const dgram = require('dgram');
const os = require('os');
const interfaces = os.networkInterfaces();
let local_ip = "";

for (const iface of Object.values(interfaces)) {
	for (const details of iface) {
		if (details.family === 'IPv4' && !details.internal && details.mac !== '00:00:00:00:00:00') {
			console.log(details);
			local_ip = details.address;
		}
	}
}

if (local_ip === "") {
	console.log('No valid IP found');
	process.exit(1);
}

const message = Buffer.from(local_ip);
const socket = dgram.createSocket('udp4');

socket.on('listening', function () {
	socket.setBroadcast(true);
	setInterval(() => {
		console.log('Sending UDP broadcast...');
		socket.send(message, 0, message.length, 5555, '255.255.255.255');
	}, 1000);
});

socket.on('message', function (message, remote) {
	console.log('Received through UDP: ', remote.address + ':' + remote.port + ' - ' + message);
});

socket.bind('8888');