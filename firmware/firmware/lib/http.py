import drivers.flash_storage
from constants import SERVER_PORT
from drivers.flash_storage import stream_file_data
from lib.packer import PROCESSED_FRAME_SIZE
from lib.tcp import (
    build_http_request_headers,
    close_connection,
    handle_response,
    open_connection,
    send_data,
    send_request_with_body,
)
from lib.udp import udp_discover_server

DATA_UPLOAD_PATH = "data"
PING_PATH = "ping"

server_ip: str | None = None


async def is_server_online(server_ip):
    """Checks if the server is reachable and responding to pings."""
    if server_ip is None:
        return False

    try:
        success, _ = await send_request_with_body(
            PING_PATH, server_ip, headers={"Connection": "close"}, method="GET"
        )

        return success
    except Exception as e:
        print(f"Error pinging server {server_ip}: {e}")
        return False


async def upload_data(frame_data_list: list[bytes]):
    """Unpacks binary frame data and attempts to upload to server."""
    global server_ip

    if not frame_data_list:
        return True

    # Copy list into buffer.
    processed_data_buffer = bytearray()
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


async def post_binary_file_streaming(file_path, total_frames):
    """Uploads a file using streaming to avoid loading the entire file into memory."""
    global server_ip

    if not server_ip:
        return False

    content_length = total_frames * PROCESSED_FRAME_SIZE

    print(
        f"Streaming upload of {total_frames} frames ({content_length} bytes) from {file_path}"
    )

    try:
        headers = {
            "Content-Type": "application/octet-stream",
            "Content-Length": str(content_length),
            "Pico-ID": drivers.flash_storage.get_pico_id(),
        }

        host = server_ip
        port = SERVER_PORT
        path = "data"

        # Open connection
        reader, writer, conn_error = await open_connection(host, port)
        if conn_error:
            print(f"Connection error: {conn_error}")
            return False

        # Send headers
        request = build_http_request_headers("POST", path, host, headers)
        if not await send_data(writer, request.encode("latin-1")):
            await close_connection(writer)
            return False

        # Stream file data in chunks
        bytes_sent = 0
        for chunk in stream_file_data(file_path, total_frames * PROCESSED_FRAME_SIZE):
            if not await send_data(writer, chunk):
                await close_connection(writer)
                return False

            bytes_sent += len(chunk)
            if bytes_sent >= content_length:
                break

        # Handle response
        status, body = await handle_response(reader, writer)
        return status

    except Exception as e:
        print(f"Error in streaming upload: {e}")
        return False


async def post_binary_data(server_ip, data):
    """Sends a POST request with binary data to the specified server IP and port."""
    headers = {
        "Content-Type": "application/octet-stream",
        "Content-Length": str(len(data)),
        "Connection": "close",
    }

    try:
        success, status = await send_request_with_body(
            DATA_UPLOAD_PATH, server_ip, headers, data, method="POST"
        )

        if success:
            print(f"POST to /{DATA_UPLOAD_PATH}, Status: {status}")

        return success, status
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
