const dgram = require('dgram');
const os = require('os');
const http = require('http');

const UDP_BROADCAST_PORT = 5555;
const UDP_LISTEN_PORT = 8888;
const HTTP_SERVER_PORT = 8000;
const BROADCAST_INTERVAL_MS = 250;

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
	let body = '';
	req.on('data', chunk => {
		body += chunk.toString();
	});
	req.on('end', () => {
		console.log('Received POST /data body:', body);
		try {
			const jsonData = JSON.parse(body);
			console.log('Parsed JSON data:', jsonData);
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'success' }));
		} catch (error) {
			console.error('Error parsing JSON:', error);
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON format' }));
		}
	});
}
