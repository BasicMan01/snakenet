var Config = require('../model/config.js');
var Game = require('../model/game.js');

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

class Controller {
	constructor() {
		this.config = new Config();
		this.game = new Game(this.config);

		this.init();
	}

	init() {
		io.on('connection', function(socket){
			console.log('user connected');
			this.game.addPlayer(socket.id);

			socket.on('disconnect', function(){
				console.log('user disconnected');
				this.game.removePlayer(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_DIRECTION', function(msg){
				this.game.setDirection(socket.id, msg);
			}.bind(this));

			socket.on('SN_CLIENT_MESSAGE', function(msg){

			});
		}.bind(this));

		http.listen(3000, function(){
			console.log('listening on *:3000');
		});

		setInterval(this.animation.bind(this), 100);
	}

	animation() {
		this.game.move();

		io.emit('SN_SERVER_MESSAGE', JSON.stringify(this.game.getFieldSocketData()));
	}
}

module.exports = Controller;