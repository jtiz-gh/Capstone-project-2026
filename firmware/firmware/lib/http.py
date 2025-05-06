import drivers.flash_storage
from constants import BACKLOG_BATCH_SIZE
from lib.async_urequests import async_urequests
from lib.packer import PROCESSED_FRAME_SIZE
from lib.udp import udp_discover_server

SERVER_PORT = 8000

server_ip: str | None = None


async def is_server_online(server_ip):
    """Checks if the server is reachable and responding to pings."""
    if server_ip is None:
        return False

    ping_url = f"http://{server_ip}:{SERVER_PORT}/ping"

    try:
        response = await async_urequests.get(ping_url)
        is_online = response.status_code == 200
        if is_online:
            print("Server is online.")
        else:
            print(f"Server ping failed with status: {response.status_code}")
        await response.close()
        return is_online
    except Exception as e:
        print(f"Error pinging server {server_ip}: {e}")
        return False


async def upload_data(frame_data_list: list[bytes]):
    """Unpacks binary frame data and attempts to upload to server."""
    global server_ip

    if not frame_data_list:
        return True

    processed_data_buffer = bytearray(PROCESSED_FRAME_SIZE * len(frame_data_list))

    # Unpack all the binary data
    for frame_data in frame_data_list:
        processed_data_buffer.extend(frame_data)

    success, status = await post_binary_data(server_ip, processed_data_buffer)

    if success:
        print(f"Data batch sent (Status: {status}, Count: {len(frame_data_list)}).")
        return True
    else:
        print(f"Failed to send data batch (Reason: {status}).")

        # Check for connection errors to clear server IP
        if isinstance(status, str) and (
            "ECONNREFUSED" in status
            or "ETIMEDOUT" in status
            or "EHOSTUNREACH" in status
            or "ECONNABORTED" in status
            or "ECONNRESET" in status
        ):
            print("Connection error detected, clearing server IP for rediscovery.")
            server_ip = None
        return False


async def upload_file_streaming(file_path, total_frames):
    """Uploads a file using streaming to avoid loading the entire file into memory."""
    global server_ip

    if not server_ip:
        return False

    url = f"http://{server_ip}:{SERVER_PORT}/data"
    content_length = total_frames * PROCESSED_FRAME_SIZE
    
    print(f"Streaming upload of {total_frames} frames ({content_length} bytes) from {file_path}")
    
    try:
        from drivers.flash_storage import stream_file_data
        
        headers = {
            "Content-Type": "application/octet-stream",
            "Content-Length": str(content_length),
            "Pico-ID": drivers.flash_storage.get_pico_id(),
        }
        
        # Prepare HTTP request
        proto, dummy, host, path = url.split("/", 3)
        if ":" in host:
            host, port = host.split(":")
            port = int(port)
        else:
            port = 80
            
        import uasyncio as asyncio
        reader, writer = await asyncio.open_connection(host, port)
        
        # Build and send HTTP request headers
        request = f"POST /{path} HTTP/1.1\r\nHost: {host}\r\n"
        for header, value in headers.items():
            request += f"{header}: {value}\r\n"
        request += "\r\n"
        
        await writer.awrite(request.encode('latin-1'))
        
        # Stream file data in chunks
        bytes_sent = 0
        for chunk in stream_file_data(file_path, total_frames * PROCESSED_FRAME_SIZE):
            await writer.awrite(chunk)
            bytes_sent += len(chunk)
            if bytes_sent >= content_length:
                break
                
        # Read response
        response_line = await reader.readline()
        if not response_line:
            await writer.aclose()
            return False
            
        parts = response_line.decode('latin-1').split()
        if len(parts) < 3:
            await writer.aclose()
            return False
            
        status = int(parts[1])
        
        # Skip headers
        while True:
            line = await reader.readline()
            if not line or line == b"\r\n":
                break
                
        # Close the connection
        await writer.aclose()
        
        print(f"Streaming upload completed with status: {status}")
        return status == 200
        
    except Exception as e:
        print(f"Error in streaming upload: {e}")
        return False


async def post_binary_data(server_ip, data):
    """Sends a POST request with JSON data to the specified server IP and port."""
    url = f"http://{server_ip}:{SERVER_PORT}/data"
    headers = {
        "Content-Type": "application/octet-stream",
        "Pico-ID": drivers.flash_storage.get_pico_id(),
    }

    try:
        response = await async_urequests.post(url, headers=headers, data=bytes(data))
        print(
            f"POST to {url}, Status: {response.status_code}, Response: {await response.text()}"
        )
        status_code = response.status_code
        await response.close()
        return True, status_code
    except OSError as e:
        print(f"Error posting data to {url}: {e}")
        return False, str(e)
    except Exception as e:
        print(f"An unexpected error occurred during POST: {e}")
        return False, str(e)


def has_server_ip():
    """Checks if a server IP address is set."""
    return server_ip is not None


async def try_discover_server_ip_wrapper(timeout_ms=1000):
    """Wrapper for UDP discovery that updates global server_ip"""
    global server_ip
    server_ip = await udp_discover_server(timeout_ms)
    return server_ip
