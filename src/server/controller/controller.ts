import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import Config = require('../model/config.js');
import Game = require('../model/game.js');
import SocketMessage = require('../model/socketMessage.js');
import { GameOptions, GameOptionsInput } from '../../types/protocol';

function getServerPort(): number {
	const result = config({ quiet: true });

	if (result.error) {
		throw new Error('.env not readable, copy .env.template to .env');
	}

	const port = parseInt(process.env.SERVER_PORT ?? '', 10);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('SERVER_PORT in .env must be an integer between 1 and 65535');
	}

	return port;
}

const port = getServerPort();

const http = createServer();
const io = new Server(http, {
	cors: {
		origin: '*'
	},
	transports: ['websocket']
});

class Controller {
	private config: Config;
	private socketMessage: SocketMessage;
	private game: Game;

	constructor() {
		this.config = new Config();
		this.socketMessage = new SocketMessage(io);

		this.game = new Game(this.config, this.socketMessage);

		this.init();
	}

	init(): void {
		io.on('connection', (socket) => {
			console.log('user connected');
			if (this.game.addPlayer(socket.id)) {
				this.socketMessage.sendCreatorInfo(socket.id, this.game.isCreator(socket.id));
			} else {
				console.log('user disconnected ???');
				socket.disconnect(true);
			}

			socket.on('disconnect', () => {
				this.game.removePlayer(socket.id);
			});

			socket.on('SN_CLIENT_DIRECTION', (direction: string | number) => {
				this.game.setDirection(socket.id, parseInt(String(direction)));
			});

			socket.on('SN_CLIENT_NAME', (playerName: string) => {
				this.game.setPlayerName(socket.id, playerName);
			});

			socket.on('SN_CLIENT_PAUSE', () => {
				this.game.setPause(socket.id);
			});

			socket.on('SN_CLIENT_START', () => {
				this.game.setStart(socket.id);
			});

			socket.on('SN_CLIENT_CHAT_MESSAGE', (chatMessage: string) => {
				this.socketMessage.sendChatMessage(
					this.game.getPlayerName(socket.id),
					this.game.getPlayerColor(socket.id),
					chatMessage
				);
			});

			socket.on('SN_CLIENT_OPTIONS_LOAD', () => {
				if (this.game.isCreator(socket.id)) {
					const options: GameOptions = {
						'growth': this.config.getGrowth(),
						'interval': this.config.getInterval(),
						'startLength': this.config.getStartLength(),
						'walls': this.config.getWalls()
					};

					this.socketMessage.sendOptions(socket.id, options);
				}
			});

			socket.on('SN_CLIENT_OPTIONS_SAVE', (options: string) => {
				if (this.game.isCreator(socket.id)) {
					const data: GameOptionsInput = JSON.parse(options);

					this.config.setGrowth(parseInt(data.growth));
					this.config.setInterval(parseInt(data.interval));
					this.config.setStartLength(parseInt(data.startLength));
					this.config.setWalls(data.walls);

					this.game.stopAnimation();
					this.game.startAnimation();

					this.game.start();
				}
			});

			socket.on('SN_CLIENT_RESET_POINTS', () => {
				if (this.game.isCreator(socket.id)) {
					this.game.resetPoints();
				}
			});
		});

		http.listen(port, () => {
			console.log('listening on *:' + port);
		});

		this.game.startAnimation();
	}
}

export = Controller;
