const dgram = require('dgram');
const os = require('os');
const http = require('http');
const fs = require('fs');
const { spawnSync } = require('child_process');

const UDP_BROADCAST_PORT = 5555;
const UDP_LISTEN_PORT = 8888;
const HTTP_SERVER_PORT = 3000;
const BROADCAST_INTERVAL_MS = 250;
const STOP = 25;
const STEP = 0.5;
const N_READINGS = 5;

let resistance = 4.0;
let counter = 0;
const voltage_stream = fs.createWriteStream("_voltage_results.log", { flags: 'w' });
const current_stream = fs.createWriteStream("_current_results.log", { flags: 'w' });
const power_stream = fs.createWriteStream("_power_results.log", { flags: 'w' });
const startup = Date.now();
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
	const avg_voltage = frameData.readFloatLE(12);
	const avg_current = frameData.readFloatLE(16);
	const avg_power = frameData.readFloatLE(20);

	return {
		avg_voltage: avg_voltage,
		avg_current: avg_current,
		avg_power: avg_power,
	};
}

function setupUdpBroadcast() {
	const socket = dgram.createSocket('udp4');

	socket.on('listening', () => {
		socket.setBroadcast(true);
		setInterval(() => {
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

		if (req.method === 'POST' && req.url === '/api/sensor-data') {
			let data = [];
			req.on('data', chunk => data.push(chunk));
			req.on('end', () => {
				const buffer = Buffer.concat(data);
				let voltageFromHttp = null;
				let currentFromHttp = null;
				let powerFromHttp = null;
				if (buffer.length >= 40) {
					const pkt = unpackProcessedFloatDataToDict(buffer.subarray(0, 40));
					voltageFromHttp = pkt.avg_voltage;
					currentFromHttp = pkt.avg_current;
					powerFromHttp = pkt.avg_power;
				}

				if (startup + 10000 < Date.now()) {
					const result = spawnSync('python', ['load-control.py', resistance.toString()], { encoding: 'utf-8' });
					let voltageFromPy, currentFromPy, powerFromPy;
					try {
						console.log(result.stdout)
						console.log(result.stderr)
						const measurements = JSON.parse(result.stdout);
						voltageFromPy = measurements.voltage;
						currentFromPy = measurements.current;
						powerFromPy = measurements.power;
					} catch { }

					if (counter != 1) {
						voltage_stream.write(`${voltageFromHttp}\t${voltageFromPy}\n`);
						current_stream.write(`${currentFromHttp}\t${currentFromPy}\n`);
						power_stream.write(`${powerFromHttp}\t${powerFromPy}\n`);
					}

					counter++;

					if (counter >= N_READINGS) {
						counter = 0;
						resistance = Math.round((resistance + STEP) * 100) / 100;
						if (resistance > STOP) {
							voltage_stream.end();
							current_stream.end();
							power_stream.end();
							console.log('Sweep complete.');

							res.writeHead(200, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ status: 'ok' }));

							process.exit(0);
						}
					}
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ status: 'ok' }));
				} else {
					console.log("Waiting for 10 seconds before starting the sweep...");
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ status: 'ok' }));
				}
			});
		} else if (req.method === 'GET' && req.url === '/api/ping') {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('pong');
			console.log('Responded to GET /ping');
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
