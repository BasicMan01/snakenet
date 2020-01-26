//import Controller from './controller/controller.js';
var io = require('socket.io-client');

document.addEventListener('DOMContentLoaded', () => {
	let socket = null;

	document.getElementById('connect').addEventListener('click', () => {
		let nickname = document.getElementById('nickname').value;

		socket = io('http://localhost:3000');

		socket.on('SN_SERVER_MESSAGE', function(msg){
			console.log(msg);
		});

		socket.emit('SN_CLIENT_MESSAGE', nickname);
	});
});