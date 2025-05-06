# https://github.com/peterhinch/micropython-async/blob/8e01d4287b716f1513a33397074ae6e085ecbe4c/v3/threadsafe/threadsafe_queue.py
# threadsafe_queue.py Provides ThreadsafeQueue class

# Copyright (c) 2022 Peter Hinch
# Released under the MIT License (MIT) - see LICENSE file

# MIT License

# Copyright (c) 2016 Peter Hinch

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# Uses pre-allocated ring buffer: can use list or array
# Asynchronous iterator allowing consumer to use async for
import asyncio


class ThreadSafeQueue:  # MicroPython optimised
    def __init__(self, buf):
        self._q = [0 for _ in range(buf)] if isinstance(buf, int) else buf
        self._size = len(self._q)
        self._wi = 0
        self._ri = 0
        self._evput = asyncio.ThreadSafeFlag()  # Triggered by put, tested by get
        self._evget = asyncio.ThreadSafeFlag()  # Triggered by get, tested by put

    def full(self):
        return ((self._wi + 1) % self._size) == self._ri

    def empty(self):
        return self._ri == self._wi

    def qsize(self):
        return (self._wi - self._ri) % self._size

    def get_sync(self, block=False):  # Remove and return an item from the queue.
        if not block and self.empty():
            raise IndexError  # Not allowed to block
        while self.empty():  # Block until an item appears
            pass
        r = self._q[self._ri]
        self._ri = (self._ri + 1) % self._size
        self._evget.set()
        return r

    def put_sync(self, v, block=False):
        self._q[self._wi] = v
        self._evput.set()  # Schedule task waiting on get
        if not block and self.full():
            # raise IndexError
            # EDIT FROM UPSTREAM: Do not raise errors inside ISR.
            return
        while self.full():
            pass  # can't bump ._wi until an item is removed
        self._wi = (self._wi + 1) % self._size

    async def put(self, val):  # Usage: await queue.put(item)
        while self.full():  # Queue full
            await self._evget.wait()
        self.put_sync(val)

    def __aiter__(self):
        return self

    async def __anext__(self):
        return await self.get()

    async def get(self):
        while self.empty():
            await self._evput.wait()
        r = self._q[self._ri]
        self._ri = (self._ri + 1) % self._size
        self._evget.set()  # Schedule task waiting on ._evget
        return r
