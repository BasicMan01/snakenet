import Constants = require('./constants');
import Field = require('./field');
import Player = require('./player');
import type Config = require('./config');
import type SocketMessage = require('./socketMessage');
import { GameState, GameStatus } from '../../types/protocol';

class Game {
	private config: Config;
	private socketMessage: SocketMessage;

	private field: Field;
	private players: (Player | null)[];
	private socketIndex: Map<string, Player>;

	private startTimeCountdown: number;
	private stopTimeCountdown: number;
	private timeoutInterval: ReturnType<typeof setInterval> | null;

	private gameStatus: GameStatus;
	private sendBroadcast: boolean;
	private sendFullBroadcast: boolean;
	private lastCountdown: number;

	constructor(config: Config, socketMessage: SocketMessage) {
		this.config = config;
		this.socketMessage = socketMessage;

		this.field = new Field(this.config);
		this.players = [];
		this.socketIndex = new Map();

		this.startTimeCountdown = 0;
		this.stopTimeCountdown = 0;
		this.timeoutInterval = null;

		this.gameStatus = Constants.GAME_STOP;
		this.sendBroadcast = false;
		this.sendFullBroadcast = false;
		this.lastCountdown = 0;

		this.init();
	}

	init(): void {
		for (let i = 0; i < this.config.player; ++i) {
			this.players[i] = null;
		}
	}

	animation(): void {
		this.move();

		if (this.sendBroadcast) {
			this.sendBroadcast = false;
			this.lastCountdown = this.getCountdown();

			const full = this.sendFullBroadcast;
			this.sendFullBroadcast = false;

			this.socketMessage.sendGameData(this.getSocketData(full));
		}
	}

	startAnimation(): void {
		this.timeoutInterval = setInterval(this.animation.bind(this), this.config.getInterval());
	}

	stopAnimation(): void {
		if (this.timeoutInterval !== null) {
			clearInterval(this.timeoutInterval);
		}
	}

	isCreator(socketId: string): boolean {
		const player = this.socketIndex.get(socketId);

		if (player !== undefined) {
			if (player.getIndex() === 1) {
				return true;
			}
		}

		return false;
	}

	addPlayer(socketId: string): boolean {
		console.log('Game::addPlayer ' + socketId);

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] === null) {
				const player = new Player(this.config, socketId, i + 1);
				this.players[i] = player;
				this.socketIndex.set(socketId, player);

				player.applyBodyToField(this.field);
				player.applyHeadToField(this.field);

				this.sendBroadcast = true;
				this.sendFullBroadcast = true;

				return true;
			}
		}

		return false;
	}

	countPlayer(): number {
		let count = 0;

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] !== null) {
				++count;
			}
		}

		return count;
	}

	removePlayer(socketId: string): void {
		this.socketMessage.sendChatMessage(
			'SYSTEM',
			Constants.COLOR_TEXT,
			this.getPlayerName(socketId) + ' has left the game'
		);

		if (this.socketIndex.has(socketId)) {
			this.socketIndex.delete(socketId);
		}

		for (let i = 0; i < this.config.player; ++i) {
			const player = this.players[i];

			if (player !== null && socketId === player.getSocketId()) {
				player.cleanUp(this.field);
				this.players[i] = null;

				this.sendBroadcast = true;
			}
		}

		console.log('Game::removePlayer ' + socketId);
	}

	move(): void {
		if (this.gameStatus === Constants.GAME_START_COUNTDOWN) {
			if  (this.startTimeCountdown - Date.now() <= 0) {
				this.gameStatus = Constants.GAME_RUN;
				this.sendBroadcast = true;
			} else if (this.getCountdown() !== this.lastCountdown) {
				this.sendBroadcast = true;
			}
		}

		if (this.gameStatus === Constants.GAME_RUN) {
			this.sendBroadcast = true;

			let livingPlayer = 0;

			this.field.reset();

			for (let i = 0; i < this.config.player; ++i) {
				const player = this.players[i];

				if (player !== null) {
					player.move();
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				const player = this.players[i];

				if (player !== null) {
					player.applyBodyToField(this.field);
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				const player = this.players[i];

				if (player !== null) {
					player.applyHeadToField(this.field);
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				const player = this.players[i];

				if (player !== null) {
					player.collide(this.field);
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				const player = this.players[i];

				if (player !== null && !player.isDead()) {
					++livingPlayer;
				}
			}

			if (livingPlayer <= 1) {
				for (let i = 0; i < this.config.player; ++i) {
					const player = this.players[i];

					if (player !== null && !player.isDead()) {
						player.addPoints(1);

						this.socketMessage.sendChatMessage(
							'SYSTEM',
							Constants.COLOR_TEXT,
							player.getName() + ' win &#x1F3C6;'
						);
					}
				}

				this.stopTimeCountdown = Date.now() + Constants.STOP_COUNTDOWN;
				this.gameStatus = Constants.GAME_STOP_COUNTDOWN;
			}
		}

		if (this.gameStatus === Constants.GAME_STOP_COUNTDOWN) {
			if  (this.stopTimeCountdown - Date.now() <= 0) {
				this.gameStatus = Constants.GAME_STOP;
				this.start();
			}
		}
	}

	start(): void {
		this.field.reset();

		for (let i = 0; i < this.config.player; ++i) {
			const player = this.players[i];

			if (player !== null) {
				player.reset();
				player.applyBodyToField(this.field);
				player.applyHeadToField(this.field);
			}
		}

		this.sendBroadcast = true;
	}

	getCountdown(): number {
		return Math.ceil((this.startTimeCountdown - Date.now()) / 1000);
	}

	getSocketData(full: boolean): GameState {
		const data: GameState = {
			countdown: this.getCountdown(),
			tiles: this.config.tiles,
			field: this.field.getSocketData(full),
			player: []
		};

		if (full) {
			data.full = true;
		}

		for (let i = 0; i < this.config.player; ++i) {
			const player = this.players[i];

			if (player !== null) {
				data.player.push([
					player.getIndex(),
					player.getColor(),
					player.getName(),
					player.getPoints()
				]);
			}
		}

		return data;
	}

	resetPoints(): void {
		for (let i = 0; i < this.config.player; ++i) {
			const player = this.players[i];

			if (player !== null) {
				player.resetPoints();
			}
		}

		this.sendBroadcast = true;
	}

	setDirection(socketId: string, direction: number): void {
		if (this.gameStatus !== Constants.GAME_RUN) {
			return;
		}

		const player = this.socketIndex.get(socketId);

		if (player !== undefined) {
			player.setDirection(direction);
		}
	}

	getPlayerColor(socketId: string): number {
		const player = this.socketIndex.get(socketId);

		if (player !== undefined) {
			return player.getColor();
		}

		return 0;
	}

	getPlayerName(socketId: string): string {
		const player = this.socketIndex.get(socketId);

		if (player !== undefined) {
			return player.getName();
		}

		return '';
	}

	setPlayerName(socketId: string, name: string): void {
		const player = this.socketIndex.get(socketId);

		if (player !== undefined) {
			player.setName(name.substring(0, 10));
		}

		this.sendBroadcast = true;

		this.socketMessage.sendChatMessage(
			'SYSTEM',
			Constants.COLOR_TEXT,
			this.getPlayerName(socketId) + ' joined the game'
		);
	}

	setPause(socketId: string): void {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to pause the game
		if (this.isCreator(socketId)) {
			if (this.gameStatus === Constants.GAME_RUN) {
				this.gameStatus = Constants.GAME_PAUSED;
				this.sendBroadcast = true;
			} else if (this.gameStatus === Constants.GAME_PAUSED) {
				this.gameStatus = Constants.GAME_RUN;
				this.sendBroadcast = true;
			}
		}
	}

	setStart(socketId: string): void {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to start the game
		if (this.isCreator(socketId)) {
			if (this.gameStatus === Constants.GAME_STOP) {
				this.startTimeCountdown = Date.now() + Constants.START_COUNTDOWN;
				this.gameStatus = Constants.GAME_START_COUNTDOWN;
				this.sendBroadcast = true;
			}
		}
	}
}

export = Game;
