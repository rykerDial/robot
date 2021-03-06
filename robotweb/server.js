// Basic framework for setting up express and web sockets from 
//http://blog.derivatived.com/posts/Control-Your-Robot-With-Node.js-Raspberry-PI-and-Arduino/
// Modified by Ryker Dial May 2015

// Initialize express and server
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
server.listen(80);


// Set '/public' as the static folder. Any files there will be directly sent to the viewer
app.use(express.static(__dirname + '/public'));

// Set index.html as the base file
app.get('/', function (req, res) {
  	res.sendfile(__dirname + '/index.html');
});

var serialport = require('serialport'); // include the library
var SerialPort = serialport.SerialPort; // make a local instance
var portName = process.argv[2]; // get port name from the command line:
var sp = new SerialPort(portName, {
   	baudRate: 9600,
   	// Arduino uses 8N1 format
   	dataBits: 8,
   	parity: 'none',
   	stopBits: 1,
   	flowControl: false
 });


console.log( 'Arduino connected on port: ' + portName );

// Drive power for robot
var robot_drive_power = 14;

// When someone has connected to me...
io.sockets.on('connection', function (socket) {
	// Send out a message (only to the one who connected)
	socket.emit('robot connected', { data: 'Connected' });

	// When I've received 'robot command' message from this connection...
	socket.on('robot command', function (data) {
	    console.log(data);
	    var command = data.command;

	    // Packet provides uniform format for sending commands to arduino
	    // 4-byte packets, MSB is control code, other 3 bytes are value
	    var PACKET_SIZE = 4;
	    var packet = new Uint8Array( PACKET_SIZE );

	    // Sends commands to arduino over serial connection
	    // Uses two byte code
	    switch( command ) {

		    // Robot commands (prefixed with 'r')
		    case 'forward':
		    	packet[0] = 114; // Byte code for robot control ( 'r' in ASCII )
		    	packet[1] = 102; // f in ASCII
		    	packet[2] = robot_drive_power;
		    	packet[3] = 0;
		   		break;
		    case 'left':
		    	packet[0] = 114; // Byte code for robot control ( 'r' in ASCII )
		    	packet[1] = 108; // l in ASCII
		    	packet[2] = robot_drive_power;
		    	packet[3] = 0;
		   		break;
		    case 'center':
		    	packet[0] = 114; // Byte code for robot control ( 'r' in ASCII )
		    	packet[1] = 99; // c in ASCII
		    	packet[2] = robot_drive_power;
		    	packet[3] = 0;
				break;
		    case 'right':
		    	packet[0] = 114; // Byte code for robot control ( 'r' in ASCII )
		    	packet[1] = 114; // r in ASCII
		    	packet[2] = robot_drive_power;
		    	packet[3] = 0;
		    	break;
		    case 'backward':
		    	packet[0] = 114; // Byte code for robot control ( 'r' in ASCII )
		    	packet[1] = 98; // b in ASCII
		    	packet[2] = robot_drive_power;
		    	packet[3] = 0;
				break;
		    case 'stop':
		    	packet[0] = 114; // Byte code for robot control ( 'r' in ASCII )
		    	packet[1] = 115; // s in ASCII
		    	packet[2] = robot_drive_power;
		    	packet[3] = 0;
				break;
		    case 'set_power':
		    	robot_drive_power = data.power;
		    	console.log('robot_drive_power: ' + robot_drive_power);
				break;

			case 'LED':
				packet[0] = 108;  // Byte code for LED control ( 'l' in ASCII )
				packet[1] = data.red;
				packet[2] = data.green;
				packet[3] = data.blue;
			break;

		    default:
				for( i = 0; i < PACKET_SIZE; i++ ) {
					packet[i] = 0;
				}
				break;
		}

		// Send packet over serial
		console.log('Sending Packet. Contents:');
		sp.write( packet );
		for( i = 0; i < PACKET_SIZE; i++ ) {
			console.log( packet[i] );
		}
		console.log('Packet Sent');
	});
});