var Config = require('../model/config.js');
var Game = require('../model/game.js');

var http = require('http').createServer();
var io = require('socket.io')(http);

class Controller {
	constructor() {
		this.config = new Config();
		this.game = new Game(this.config);

		this.timeoutInterval = null;

		this.init();
	}

	init() {
		io.on('connection', function(socket){
			console.log('user connected');
			if (this.game.addPlayer(socket.id)) {
				io.to(socket.id).emit('SN_SERVER_IS_CREATOR', this.game.isCreator(socket.id) ? 1 : 0);
			} else {
				console.log('user disconnected ???');
				socket.disconnect(true);
			}

			socket.on('disconnect', function(){
				console.log('user disconnected');
				this.game.removePlayer(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_DIRECTION', function(msg){
				this.game.setDirection(socket.id, msg);
			}.bind(this));

			socket.on('SN_CLIENT_NAME', function(msg){
				this.game.setPlayerName(socket.id, msg);
			}.bind(this));

			socket.on('SN_CLIENT_OPTIONS_LOAD', function(msg){
				if (this.game.isCreator(socket.id)) {
					let options = {
						'growth': this.config.growth,
						'interval': this.config.interval,
						'startLength': this.config.startLength,
						'walls': this.config.walls
					}

					io.to(socket.id).emit('SN_SERVER_OPTIONS', JSON.stringify(options));
				}
			}.bind(this));

			socket.on('SN_CLIENT_OPTIONS_SAVE', function(msg){
				if (this.game.isCreator(socket.id)) {
					// TODO VALIDATION
					let data = JSON.parse(msg);

					this.config.growth = parseInt(data.growth);
					this.config.interval = parseInt(data.interval);
					this.config.startLength = parseInt(data.startLength);
					this.config.walls = data.walls;

					this.stopAnimation();
					this.startAnimation();

					this.game.start();
				}
			}.bind(this));

			socket.on('SN_CLIENT_PAUSE', function(msg){
				this.game.setPause(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_START', function(msg){
				this.game.setStart(socket.id);
			}.bind(this));
		}.bind(this));

		http.listen(3000, function(){
			console.log('listening on *:3000');
		});

		this.startAnimation()
	}

	animation() {
		this.game.move();

		io.emit('SN_SERVER_MESSAGE', JSON.stringify(this.game.getSocketData()));
	}

	startAnimation() {
		this.timeoutInterval = setInterval(this.animation.bind(this), this.config.interval);
	}

	stopAnimation() {
		if (this.timeoutInterval !== null) {
			clearInterval(this.timeoutInterval);
		}
	}
}

module.exports = Controller;