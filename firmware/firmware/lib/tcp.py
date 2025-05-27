import gc
import time

import drivers.flash_storage
import uasyncio as asyncio
from constants import SERVER_PORT


def open_connection(host, port):
    """Open a TCP connection and return the reader and writer objects."""
    try:
        future = asyncio.open_connection(host, port)

        try:
            # Wait for 3 seconds, then raise TimeoutError
            reader, writer = yield from asyncio.wait_for(future, timeout=3)
        except asyncio.TimeoutError:
            return None, None, "Connection timed out"

        return reader, writer, None
    except Exception as e:
        return None, None, str(e)


async def send_data(writer, data):
    """Send data to a TCP connection."""
    try:
        await writer.awrite(data)
        return True
    except Exception as e:
        print(f"Error sending data: {e}")
        return False


async def read_line(reader):
    """Read a line from a TCP connection."""
    if reader is None:
        return None

    try:
        line = await reader.readline()
        return line
    except Exception as e:
        print(f"Error reading line: {e}")
        return None


async def read_http_response_status(reader, writer):
    """Read HTTP response status line and parse status code."""
    if reader is None:
        return None, "No reader available"

    response_line = await read_line(reader)

    if not response_line:
        if writer is not None:
            await writer.wait_closed()
        return None, "No response"

    try:
        parts = response_line.decode("latin-1").split()
        if len(parts) < 2:
            if writer is not None:
                await writer.wait_closed()
            return None, "Malformed response"

        status_code = int(parts[1])
        return status_code, None
    except Exception as e:
        if writer is not None:
            await writer.wait_closed()
        return None, str(e)


def build_http_request_headers(method, path, host, headers):
    pico_headers = {
        "Pico-ID": drivers.flash_storage.get_pico_id(),
        "User-Agent": "upython-pico-w-ecu-v001",
        "Pico-Timestamp": str(time.ticks_ms()),
    }

    request = f"{method} /{path} HTTP/1.1\r\nHost: {host}\r\n"
    for header, value in pico_headers.items():
        request += f"{header}: {value}\r\n"
    for header, value in headers.items():
        request += f"{header}: {value}\r\n"
    request += "\r\n"
    return request


async def close_connection(writer):
    """Close the TCP connection."""
    if writer is not None:
        try:
            await writer.wait_closed()
        except Exception as e:
            print(f"Error closing connection: {e}")


async def handle_response(reader, writer):
    # Read response status
    status_code, error = await read_http_response_status(reader, writer)
    if error:
        return False, error

    while True:
        line = await read_line(reader)
        if not line or line == b"\r\n":
            break

    await close_connection(writer)

    if status_code is not None:
        return 200 <= status_code < 300, status_code
    else:
        return False, "Invalid status code"


async def send_request_with_body(path, host, headers=None, body=None, method="POST"):
    port = SERVER_PORT

    # Open connection
    reader, writer, conn_error = await open_connection(host, port)
    if conn_error:
        return False, conn_error

    if reader is None or writer is None:
        return False, "Failed to open connection"

    if body is not None:
        if not headers:
            headers = {}

        if isinstance(body, bytearray):
            headers["Content-Length"] = str(len(body))
        elif isinstance(body, list):
            headers["Content-Length"] = str(sum(len(item) for item in body))

    try:
        # Prepare request
        request = build_http_request_headers(method, path, host, headers or {})

        # Send request headers
        if not await send_data(writer, request.encode("latin-1")):
            await writer.wait_closed()
            return False, "Failed to send request headers"

        # Send body if provided
        gc.collect()
        if body is not None:
            if isinstance(body, bytearray):
                if not await send_data(writer, body):
                    await writer.wait_closed()
                    return False, "Failed to send request body"
            elif isinstance(body, list):
                for item in body:
                    if not await send_data(writer, item):
                        await writer.wait_closed()
                        return False, "Failed to send request body"

        return await handle_response(reader, writer)

    except Exception as e:
        if writer is not None:
            try:
                await writer.wait_closed()
            except Exception as e:
                print(f"Error while closing connection: {e}")
        return False, str(e)
