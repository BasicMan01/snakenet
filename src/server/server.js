var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
	console.log('user connected');

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});

	socket.on('SN_CLIENT_MESSAGE', function(msg){
		io.emit('SN_SERVER_MESSAGE', msg);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});