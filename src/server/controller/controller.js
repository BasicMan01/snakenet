let Config = require('../model/config.js');
let Constants = require('../model/constants');
let Game = require('../model/game.js');
let SocketMessage = require('../model/socketMessage.js');

let http = require('http').createServer();
let io = require('socket.io')(http);

class Controller {
	constructor() {
		this._config = new Config();
		this._socketMessage = new SocketMessage(io);

		this._game = new Game(this._config, this._socketMessage);

		this.init();
	}

	init() {
		io.on('connection', function(socket){
			console.log('user connected');
			if (this._game.addPlayer(socket.id)) {
				this._socketMessage.sendCreatorInfo(socket.id, this._game.isCreator(socket.id));
			} else {
				console.log('user disconnected ???');
				socket.disconnect(true);
			}

			socket.on('disconnect', function() {
				this._game.removePlayer(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_DIRECTION', function(direction) {
				this._game.setDirection(socket.id, parseInt(direction));
			}.bind(this));

			socket.on('SN_CLIENT_NAME', function(playerName) {
				this._game.setPlayerName(socket.id, playerName);
			}.bind(this));

			socket.on('SN_CLIENT_PAUSE', function() {
				this._game.setPause(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_START', function() {
				this._game.setStart(socket.id);
			}.bind(this));

			socket.on('SN_CLIENT_CHAT_MESSAGE', function(chatMessage) {
				this._socketMessage.sendChatMessage(
					this._game.getPlayerName(socket.id),
					this._game.getPlayerColor(socket.id),
					chatMessage
				);
			}.bind(this));

			socket.on('SN_CLIENT_OPTIONS_LOAD', function() {
				if (this._game.isCreator(socket.id)) {
					let options = {
						'growth': this._config.getGrowth(),
						'interval': this._config.getInterval(),
						'startLength': this._config.getStartLength(),
						'walls': this._config.getWalls()
					}

					this._socketMessage.sendOptions(socket.id, options);
				}
			}.bind(this));

			socket.on('SN_CLIENT_OPTIONS_SAVE', function(options) {
				if (this._game.isCreator(socket.id)) {
					let data = JSON.parse(options);

					this._config.setGrowth(parseInt(data.growth));
					this._config.setInterval(parseInt(data.interval));
					this._config.setStartLength(parseInt(data.startLength));
					this._config.setWalls(data.walls);

					this._game.stopAnimation();
					this._game.startAnimation();

					this._game.start();
				}
			}.bind(this));
		}.bind(this));

		http.listen(3000, function(){
			console.log('listening on *:3000');
		});

		this._game.startAnimation()
	}
}

module.exports = Controller;