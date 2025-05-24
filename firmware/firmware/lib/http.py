import gc
import json

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

DATA_UPLOAD_PATH = "api/sensor-data"
PING_PATH = "api/ping"

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

    if not frame_data_list:
        return True

    success, status = await post_binary_data(DATA_UPLOAD_PATH, frame_data_list)

    if success:
        print(f"Data batch sent (Status: {status}, Count: {len(frame_data_list)}).")
        return True
    else:
        print(f"Failed to send data batch (Reason: {status}).")
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
            "Content-Length": str(content_length)
        }

        host = server_ip
        port = SERVER_PORT
        path = DATA_UPLOAD_PATH

        # Open connection
        reader, writer, conn_error = await open_connection(host, port)
        if conn_error:
            print(f"Connection error: {conn_error}")
            server_ip = None
            return False

        # Send headers
        request = build_http_request_headers("POST", path, host, headers)
        if not await send_data(writer, request.encode("latin-1")):
            await close_connection(writer)
            return False

        # Stream file data in chunks
        bytes_sent = 0
        for chunk in stream_file_data(file_path, total_frames * PROCESSED_FRAME_SIZE):
            gc.collect()

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

        if "memory allocation failed" not in str(e):
            server_ip = None

        return False


async def post_binary_data(path, data):
    """Sends a POST request with binary data to the specified server IP and port."""
    global server_ip

    headers = {
        "Content-Type": "application/octet-stream",
        "Content-Length": str(len(data)),
        "Connection": "close",
    }

    try:
        success, status = await send_request_with_body(
            path, server_ip, headers, data, method="POST"
        )

        if success:
            print(f"POST to /{path}, Status: {status}")

        return success, status
    except Exception as e:
        if "memory allocation failed" not in str(e):
            server_ip = None

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
