import { createServer } from 'http';
import { Server } from 'socket.io';
import Config = require('../model/config.js');
import Game = require('../model/game.js');
import SocketMessage = require('../model/socketMessage.js');
import { GameOptions, GameOptionsInput } from '../../types/protocol';

const http = createServer();
const io = new Server(http, {
	cors: {
		origin: '*'
	},
	transports: ['websocket']
});

class Controller {
	private _config: Config;
	private _socketMessage: SocketMessage;
	private _game: Game;

	constructor() {
		this._config = new Config();
		this._socketMessage = new SocketMessage(io);

		this._game = new Game(this._config, this._socketMessage);

		this.init();
	}

	init(): void {
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

			socket.on('SN_CLIENT_DIRECTION', (direction: string | number) => {
				this._game.setDirection(socket.id, parseInt(String(direction)));
			});

			socket.on('SN_CLIENT_NAME', (playerName: string) => {
				this._game.setPlayerName(socket.id, playerName);
			});

			socket.on('SN_CLIENT_PAUSE', () => {
				this._game.setPause(socket.id);
			});

			socket.on('SN_CLIENT_START', () => {
				this._game.setStart(socket.id);
			});

			socket.on('SN_CLIENT_CHAT_MESSAGE', (chatMessage: string) => {
				this._socketMessage.sendChatMessage(
					this._game.getPlayerName(socket.id),
					this._game.getPlayerColor(socket.id),
					chatMessage
				);
			});

			socket.on('SN_CLIENT_OPTIONS_LOAD', () => {
				if (this._game.isCreator(socket.id)) {
					const options: GameOptions = {
						'growth': this._config.getGrowth(),
						'interval': this._config.getInterval(),
						'startLength': this._config.getStartLength(),
						'walls': this._config.getWalls()
					};

					this._socketMessage.sendOptions(socket.id, options);
				}
			});

			socket.on('SN_CLIENT_OPTIONS_SAVE', (options: string) => {
				if (this._game.isCreator(socket.id)) {
					const data: GameOptionsInput = JSON.parse(options);

					this._config.setGrowth(parseInt(data.growth));
					this._config.setInterval(parseInt(data.interval));
					this._config.setStartLength(parseInt(data.startLength));
					this._config.setWalls(data.walls);

					this._game.stopAnimation();
					this._game.startAnimation();

					this._game.start();
				}
			});

			socket.on('SN_CLIENT_RESET_POINTS', () => {
				if (this._game.isCreator(socket.id)) {
					this._game.resetPoints();
				}
			});
		});

		http.listen(3000, () => {
			console.log('listening on *:3000');
		});

		this._game.startAnimation();
	}
}

export = Controller;
