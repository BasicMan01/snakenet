const Config = require('../model/config.js');
const Constants = require('../model/constants');
const Game = require('../model/game.js');
const SocketMessage = require('../model/socketMessage.js');

const http = require('http').createServer();
const io = require('socket.io')(http, {
	cors: {
		origin: '*'
	},
	transports: ['websocket']
});

class Controller {
	constructor() {
		this._config = new Config();
		this._socketMessage = new SocketMessage(io);

		this._game = new Game(this._config, this._socketMessage);

		this.init();
	}

	init() {
		io.on('connection', (socket) => {
			console.log('user connected');
			if (this._game.addPlayer(socket.id)) {
				this._socketMessage.sendCreatorInfo(socket.id, this._game.isCreator(socket.id));
			} else {
				console.log('user disconnected ???');
				socket.disconnect(true);
			}

			socket.on('disconnect', () => {
				this._game.removePlayer(socket.id);
			});

			socket.on('SN_CLIENT_DIRECTION', (direction) => {
				this._game.setDirection(socket.id, parseInt(direction));
			});

			socket.on('SN_CLIENT_NAME', (playerName) => {
				this._game.setPlayerName(socket.id, playerName);
			});

			socket.on('SN_CLIENT_PAUSE', () => {
				this._game.setPause(socket.id);
			});

			socket.on('SN_CLIENT_START', () => {
				this._game.setStart(socket.id);
			});

			socket.on('SN_CLIENT_CHAT_MESSAGE', (chatMessage) => {
				this._socketMessage.sendChatMessage(
					this._game.getPlayerName(socket.id),
					this._game.getPlayerColor(socket.id),
					chatMessage
				);
			});

			socket.on('SN_CLIENT_OPTIONS_LOAD', () => {
				if (this._game.isCreator(socket.id)) {
					const options = {
						'growth': this._config.getGrowth(),
						'interval': this._config.getInterval(),
						'startLength': this._config.getStartLength(),
						'walls': this._config.getWalls()
					}

					this._socketMessage.sendOptions(socket.id, options);
				}
			});

			socket.on('SN_CLIENT_OPTIONS_SAVE', (options) => {
				if (this._game.isCreator(socket.id)) {
					const data = JSON.parse(options);

					this._config.setGrowth(parseInt(data.growth));
					this._config.setInterval(parseInt(data.interval));
					this._config.setStartLength(parseInt(data.startLength));
					this._config.setWalls(data.walls);

					this._game.stopAnimation();
					this._game.startAnimation();

					this._game.start();
				}
			});

			socket.on('SN_CLIENT_RESET_POINTS', (options) => {
				if (this._game.isCreator(socket.id)) {
					this._game.resetPoints();
				}
			});
		});

		http.listen(3000, () => {
			console.log('listening on *:3000');
		});

		this._game.startAnimation()
	}
}

module.exports = Controller;