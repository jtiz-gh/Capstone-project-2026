const dgram = require('dgram');
const os = require('os');
const http = require('http');

const UDP_BROADCAST_PORT = 5555;
const UDP_LISTEN_PORT = 8888;
const HTTP_SERVER_PORT = 3001;
const BROADCAST_INTERVAL_MS = 250;

// Binary data format constants
// const PROCESSED_DATA_FMT = "LLLfffffffff"; // 3 uint32 + 7 float values

setupUdpBroadcast();
setupHttpServer();

function findLocalIpAddresses() {
	const interfaces = os.networkInterfaces();
	const addresses = [];
	for (const iface of Object.values(interfaces)) {
		for (const details of iface) {
			if (details.family === 'IPv4' && !details.internal && details.mac !== '00:00:00:00:00:00') {
				addresses.push(details.address);
			}
		}
	}
	return addresses;
}

function unpackProcessedFloatDataToDict(frameData) {
	// Inline unpacking of binary data
	// Read 3 uint32 values (4 bytes each)
	const timestamp = frameData.readUInt32LE(0);
	const session_id = frameData.readUInt32LE(4);
	const measurement_id = frameData.readUInt32LE(8);

	// Read 7 float values (4 bytes each)
	const avg_voltage = frameData.readFloatLE(12);
	const avg_current = frameData.readFloatLE(16);
	const avg_power = frameData.readFloatLE(20);
	const peak_voltage = frameData.readFloatLE(24);
	const peak_current = frameData.readFloatLE(28);
	const peak_power = frameData.readFloatLE(32);
	const energy = frameData.readFloatLE(36);

	return {
		timestamp: timestamp,
		session_id: session_id,
		measurement_id: measurement_id,
		avg_voltage: avg_voltage.toFixed(4),
		avg_current: avg_current.toFixed(4),
		avg_power: avg_power.toFixed(4),
		peak_voltage: peak_voltage.toFixed(4),
		peak_current: peak_current.toFixed(4),
		peak_power: peak_power.toFixed(4),
		energy: energy.toFixed(4)
	};
}

function setupUdpBroadcast() {
	const socket = dgram.createSocket('udp4');

	socket.on('listening', () => {
		socket.setBroadcast(true);
		setInterval(() => {
			// Recalculate IPs inside the interval
			const currentIpAddresses = findLocalIpAddresses();
			if (currentIpAddresses.length === 0) {
				console.warn('No valid IP addresses found for broadcast.');
				return;
			}

			const message = Buffer.from(currentIpAddresses.join(','));
			socket.send(message, 0, message.length, UDP_BROADCAST_PORT, '255.255.255.255');
		}, BROADCAST_INTERVAL_MS);

		console.log(`Sending UDP broadcast of IPs every ${BROADCAST_INTERVAL_MS}ms`);
	});

	socket.on('message', (message, remote) => {
		console.log(`Received UDP message from ${remote.address}:${remote.port}: ${message}`);
	});

	socket.on('error', (err) => {
		console.error('UDP socket error:', err);
		socket.close();
	});

	socket.bind(UDP_LISTEN_PORT);
}

function setupHttpServer() {
	const server = http.createServer((req, res) => {
		console.log(`HTTP Request: ${req.method} ${req.url}`);

		if (req.method === 'GET' && req.url === '/ping') {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('pong');
			console.log('Responded to GET /ping');
		} else if (req.method === 'POST' && req.url === '/data') {
			handleDataRequest(req, res);
		} else if (req.method === 'POST' && req.url === '/api/notification') {
			let body = '';

			req.on('data', chunk => {
				body += chunk.toString();
			});

			req.on('end', () => {
				try {
					const json = JSON.parse(body);
					console.log('Received JSON:', json);

					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ status: 'success', message: 'Notification received' }));
					console.log('Responded to POST /api/notification');
				} catch (err) {
					console.error('Invalid JSON received:', err);
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
				}
			});
		} else {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not Found');
			console.log(`404 Not Found for ${req.method} ${req.url}`);
		}
	});

	server.listen(HTTP_SERVER_PORT, () => {
		console.log(`HTTP server listening on port ${HTTP_SERVER_PORT}`);
	});

	server.on('error', (err) => {
		console.error('HTTP server error:', err);
	});
}

function handleDataRequest(req, res) {
	let data = [];

	req.on('data', chunk => {
		data.push(chunk);
	});

	req.on('end', () => {
		const buffer = Buffer.concat(data);
		console.log('Received POST /data body length:', buffer.length);
		const decodedPackets = [];
		let offset = 0;

		try {
			// Check if the buffer length is a multiple of 40 bytes
			while (offset + 40 <= buffer.length) {
				const packetBuffer = buffer.subarray(offset, offset + 40);
				const decodedData = unpackProcessedFloatDataToDict(packetBuffer);
				decodedPackets.push(decodedData);
				offset += 40;
			}

			if (decodedPackets.length > 0) {
				console.log('Parsed binary data (all packets):', decodedPackets);
				console.log(`Successfully decoded ${decodedPackets.length} packets.`);

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ status: 'success', processed: decodedPackets.length }));
				return;
			} else {
				console.log('Buffer too small for any complete binary format packet, or no packets found. Received:', buffer.length, 'bytes');
			}
		} catch (binaryError) {
			console.error('Error parsing binary data:', binaryError);
		}

		res.writeHead(400, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'error', message: 'Invalid data format or no complete packets found' }));
	});
}