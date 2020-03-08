let Config = require('../model/config.js');
let Constants = require('../model/constants');
let Game = require('../model/game.js');

let http = require('http').createServer();
let io = require('socket.io')(http);

class Controller {
	constructor() {
		this._config = new Config();
		this._game = new Game(this._config);

		this._timeoutInterval = null;

		this.init();
	}

	init() {
		io.on('connection', function(socket){
			console.log('user connected');
			if (this._game.addPlayer(socket.id)) {
				io.to(socket.id).emit('SN_SERVER_IS_CREATOR', this._game.isCreator(socket.id) ? 1 : 0);
			} else {
				console.log('user disconnected ???');
				socket.disconnect(true);
			}

			socket.on('disconnect', function() {
				this.sendChatMessage('SYSTEM', Constants.GREY, this._game.getPlayerName(socket.id) + ' has left the game');

				this._game.removePlayer(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_DIRECTION', function(direction) {
				this._game.setDirection(socket.id, parseInt(direction));
			}.bind(this));

			socket.on('SN_CLIENT_NAME', function(playerName) {
				this._game.setPlayerName(socket.id, playerName);

				this.sendChatMessage('SYSTEM', Constants.GREY, this._game.getPlayerName(socket.id) + ' joined the game');
			}.bind(this));

			socket.on('SN_CLIENT_PAUSE', function() {
				this._game.setPause(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_START', function() {
				this._game.setStart(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_CHAT_MESSAGE', function(chatMessage) {
				this.sendChatMessage(this._game.getPlayerName(socket.id), this._game.getPlayerColor(socket.id), chatMessage);
			}.bind(this));

			socket.on('SN_CLIENT_OPTIONS_LOAD', function() {
				if (this._game.isCreator(socket.id)) {
					let options = {
						'growth': this._config.getGrowth(),
						'interval': this._config.getInterval(),
						'startLength': this._config.getStartLength(),
						'walls': this._config.getWalls()
					}

					io.to(socket.id).emit('SN_SERVER_OPTIONS', JSON.stringify(options));
				}
			}.bind(this));

			socket.on('SN_CLIENT_OPTIONS_SAVE', function(options) {
				if (this._game.isCreator(socket.id)) {
					let data = JSON.parse(options);

					this._config.setGrowth(parseInt(data.growth));
					this._config.setInterval(parseInt(data.interval));
					this._config.setStartLength(parseInt(data.startLength));
					this._config.setWalls(data.walls);

					this.stopAnimation();
					this.startAnimation();

					this._game.start();
				}
			}.bind(this));
		}.bind(this));

		http.listen(3000, function(){
			console.log('listening on *:3000');
		});

		this.startAnimation()
	}

	animation() {
		this._game.move();

		io.emit('SN_SERVER_MESSAGE', JSON.stringify(this._game.getSocketData()));
	}

	startAnimation() {
		this._timeoutInterval = setInterval(this.animation.bind(this), this._config.getInterval());
	}

	stopAnimation() {
		if (this._timeoutInterval !== null) {
			clearInterval(this._timeoutInterval);
		}
	}

	sendChatMessage(playerName, playerColor, message) {
		io.emit('SN_SERVER_CHAT_MESSAGE', playerName, playerColor, message);
	}
}

module.exports = Controller;