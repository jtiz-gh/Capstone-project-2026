import asyncio


class ClientResponse:
    def __init__(self, reader, status=None, headers=None):
        self.content = reader
        self.status = status
        self.headers = headers

    async def read(self, sz=-1):
        return await self.content.read(sz)
        
    async def text(self):
        data = await self.read()
        return data.decode('utf-8')

    def __repr__(self):
        return "<ClientResponse %d %s>" % (self.status, self.headers)


class ChunkedClientResponse(ClientResponse):
    def __init__(self, reader, status=None, headers=None):
        super().__init__(reader, status, headers)
        self.chunk_size = 0

    async def read(self, sz=4 * 1024 * 1024):
        if self.chunk_size == 0:
            line = await self.content.readline()
            line = line.split(b";", 1)[0]
            self.chunk_size = int(line, 16)
            if self.chunk_size == 0:
                # End of message
                sep = await self.content.read(2)
                assert sep == b"\r\n"
                return b""
        data = await self.content.read(min(sz, self.chunk_size))
        self.chunk_size -= len(data)
        if self.chunk_size == 0:
            sep = await self.content.read(2)
            assert sep == b"\r\n"
        return data


async def request_raw(method, url, headers=None, data=None):
    try:
        proto, dummy, host, path = url.split("/", 3)
    except ValueError:
        proto, dummy, host = url.split("/", 2)
        path = ""

    if ":" in host:
        host, port = host.split(":")
        port = int(port)
    else:
        port = 80

    if proto != "http:":
        raise ValueError("Unsupported protocol: " + proto)
        
    reader, writer = await asyncio.open_connection(host, port)
    
    # Use protocol 1.0, because 1.1 always allows to use chunked
    # transfer-encoding But explicitly set Connection: close, even
    # though this should be default for 1.0, because some servers
    # misbehave w/o it.
    query = "%s /%s HTTP/1.0\r\nHost: %s\r\nConnection: close\r\nUser-Agent: compat\r\n" % (
        method, path, host
    )
    
    if headers:
        for header, value in headers.items():
            query += f"{header}: {value}\r\n"
    
    query += "\r\n"
    
    await writer.awrite(query.encode("latin-1"))
    
    if data:
        if isinstance(data, (bytes, bytearray)):
            await writer.awrite(data)
        elif hasattr(data, '__iter__') and not isinstance(data, (str, bytes, bytearray)):
            # Handle iterable/generator data for streaming
            for chunk in data:
                if chunk:
                    await writer.awrite(chunk)
        else:
            await writer.awrite(data)
    
    return reader, writer


async def request(method, url, headers=None, data=None):
    redir_cnt = 0
    while redir_cnt < 2:
        reader, writer = await request_raw(method, url, headers, data)
        response_headers = []
        sline = await reader.readline()
        sline = sline.split(None, 2)
        status = int(sline[1])
        chunked = False
        
        while True:
            line = await reader.readline()
            if not line or line == b"\r\n":
                break
            response_headers.append(line)
            if line.startswith(b"Transfer-Encoding:"):
                if b"chunked" in line:
                    chunked = True
            elif line.startswith(b"Location:"):
                url = line.rstrip().split(None, 1)[1].decode("latin-1")

        if 301 <= status <= 303:
            redir_cnt += 1
            await reader.aclose()
            continue
        break

    if chunked:
        resp = ChunkedClientResponse(reader, status, response_headers)
    else:
        resp = ClientResponse(reader, status, response_headers)
    resp.status = status
    resp.headers = response_headers
    return resp


async def head(url, headers=None):
    return await request("HEAD", url, headers)

async def get(url, headers=None):
    return await request("GET", url, headers)

async def post(url, headers=None, data=None):
    return await request("POST", url, headers, data)

async def put(url, headers=None, data=None):
    return await request("PUT", url, headers, data)

async def patch(url, headers=None, data=None):
    return await request("PATCH", url, headers, data)

async def delete(url, headers=None, data=None):
    return await request("DELETE", url, headers, data)
