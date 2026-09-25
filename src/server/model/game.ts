import Constants = require('./constants');
import Field = require('./field');
import Player = require('./player');
import type Config = require('./config');
import type SocketMessage = require('./socketMessage');
import { GameState, GameStatus } from '../../types/protocol';

class Game {
	private _config: Config;
	private _socketMessage: SocketMessage;

	private _field: Field;
	private _players: (Player | null)[];
	private _socketIndex: Map<string, Player>;

	private _startTimeCountdown: number;
	private _stopTimeCountdown: number;
	private _timeoutInterval: ReturnType<typeof setInterval> | null;

	private _gameStatus: GameStatus;
	private _sendBroadcast: boolean;
	private _sendFullBroadcast: boolean;
	private _lastCountdown: number;

	constructor(config: Config, socketMessage: SocketMessage) {
		this._config = config;
		this._socketMessage = socketMessage;

		this._field = new Field(this._config);
		this._players = [];
		this._socketIndex = new Map();

		this._startTimeCountdown = 0;
		this._stopTimeCountdown = 0;
		this._timeoutInterval = null;

		this._gameStatus = Constants.GAME_STOP;
		this._sendBroadcast = false;
		this._sendFullBroadcast = false;
		this._lastCountdown = 0;

		this.init();
	}

	init(): void {
		for (let i = 0; i < this._config.player; ++i) {
			this._players[i] = null;
		}
	}

	animation(): void {
		this.move();

		if (this._sendBroadcast) {
			this._sendBroadcast = false;
			this._lastCountdown = this.getCountdown();

			const full = this._sendFullBroadcast;
			this._sendFullBroadcast = false;

			this._socketMessage.sendGameData(this.getSocketData(full));
		}
	}

	startAnimation(): void {
		this._timeoutInterval = setInterval(this.animation.bind(this), this._config.getInterval());
	}

	stopAnimation(): void {
		if (this._timeoutInterval !== null) {
			clearInterval(this._timeoutInterval);
		}
	}

	isCreator(socketId: string): boolean {
		const player = this._socketIndex.get(socketId);

		if (player !== undefined) {
			if (player.getIndex() === 1) {
				return true;
			}
		}

		return false;
	}

	addPlayer(socketId: string): boolean {
		console.log('Game::addPlayer ' + socketId);

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] === null) {
				const player = new Player(this._config, socketId, i + 1);
				this._players[i] = player;
				this._socketIndex.set(socketId, player);

				player.applyBodyToField(this._field);
				player.applyHeadToField(this._field);

				this._sendBroadcast = true;
				this._sendFullBroadcast = true;

				return true;
			}
		}

		return false;
	}

	countPlayer(): number {
		let count = 0;

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] !== null) {
				++count;
			}
		}

		return count;
	}

	removePlayer(socketId: string): void {
		this._socketMessage.sendChatMessage(
			'SYSTEM',
			Constants.COLOR_TEXT,
			this.getPlayerName(socketId) + ' has left the game'
		);

		if (this._socketIndex.has(socketId)) {
			this._socketIndex.delete(socketId);
		}

		for (let i = 0; i < this._config.player; ++i) {
			const player = this._players[i];

			if (player !== null && socketId === player.getSocketId()) {
				player.cleanUp(this._field);
				this._players[i] = null;

				this._sendBroadcast = true;
			}
		}

		console.log('Game::removePlayer ' + socketId);
	}

	move(): void {
		if (this._gameStatus === Constants.GAME_START_COUNTDOWN) {
			if  (this._startTimeCountdown - Date.now() <= 0) {
				this._gameStatus = Constants.GAME_RUN;
				this._sendBroadcast = true;
			} else if (this.getCountdown() !== this._lastCountdown) {
				this._sendBroadcast = true;
			}
		}

		if (this._gameStatus === Constants.GAME_RUN) {
			this._sendBroadcast = true;

			let livingPlayer = 0;

			this._field.reset();

			for (let i = 0; i < this._config.player; ++i) {
				const player = this._players[i];

				if (player !== null) {
					player.move();
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				const player = this._players[i];

				if (player !== null) {
					player.applyBodyToField(this._field);
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				const player = this._players[i];

				if (player !== null) {
					player.applyHeadToField(this._field);
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				const player = this._players[i];

				if (player !== null) {
					player.collide(this._field);
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				const player = this._players[i];

				if (player !== null && !player.isDead()) {
					++livingPlayer;
				}
			}

			if (livingPlayer <= 1) {
				for (let i = 0; i < this._config.player; ++i) {
					const player = this._players[i];

					if (player !== null && !player.isDead()) {
						player.addPoints(1);

						this._socketMessage.sendChatMessage(
							'SYSTEM',
							Constants.COLOR_TEXT,
							player.getName() + ' win &#x1F3C6;'
						);
					}
				}

				this._stopTimeCountdown = Date.now() + Constants.STOP_COUNTDOWN;
				this._gameStatus = Constants.GAME_STOP_COUNTDOWN;
			}
		}

		if (this._gameStatus === Constants.GAME_STOP_COUNTDOWN) {
			if  (this._stopTimeCountdown - Date.now() <= 0) {
				this._gameStatus = Constants.GAME_STOP;
				this.start();
			}
		}
	}

	start(): void {
		this._field.reset();

		for (let i = 0; i < this._config.player; ++i) {
			const player = this._players[i];

			if (player !== null) {
				player.reset();
				player.applyBodyToField(this._field);
				player.applyHeadToField(this._field);
			}
		}

		this._sendBroadcast = true;
	}

	getCountdown(): number {
		return Math.ceil((this._startTimeCountdown - Date.now()) / 1000);
	}

	getSocketData(full: boolean): GameState {
		const data: GameState = {
			countdown: this.getCountdown(),
			tiles: this._config.tiles,
			field: this._field.getSocketData(full),
			player: []
		};

		if (full) {
			data.full = true;
		}

		for (let i = 0; i < this._config.player; ++i) {
			const player = this._players[i];

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
		for (let i = 0; i < this._config.player; ++i) {
			const player = this._players[i];

			if (player !== null) {
				player.resetPoints();
			}
		}

		this._sendBroadcast = true;
	}

	setDirection(socketId: string, direction: number): void {
		if (this._gameStatus !== Constants.GAME_RUN) {
			return;
		}

		const player = this._socketIndex.get(socketId);

		if (player !== undefined) {
			player.setDirection(direction);
		}
	}

	getPlayerColor(socketId: string): number {
		const player = this._socketIndex.get(socketId);

		if (player !== undefined) {
			return player.getColor();
		}

		return 0;
	}

	getPlayerName(socketId: string): string {
		const player = this._socketIndex.get(socketId);

		if (player !== undefined) {
			return player.getName();
		}

		return '';
	}

	setPlayerName(socketId: string, name: string): void {
		const player = this._socketIndex.get(socketId);

		if (player !== undefined) {
			player.setName(name.substring(0, 10));
		}

		this._sendBroadcast = true;

		this._socketMessage.sendChatMessage(
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
			if (this._gameStatus === Constants.GAME_RUN) {
				this._gameStatus = Constants.GAME_PAUSED;
				this._sendBroadcast = true;
			} else if (this._gameStatus === Constants.GAME_PAUSED) {
				this._gameStatus = Constants.GAME_RUN;
				this._sendBroadcast = true;
			}
		}
	}

	setStart(socketId: string): void {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to start the game
		if (this.isCreator(socketId)) {
			if (this._gameStatus === Constants.GAME_STOP) {
				this._startTimeCountdown = Date.now() + Constants.START_COUNTDOWN;
				this._gameStatus = Constants.GAME_START_COUNTDOWN;
				this._sendBroadcast = true;
			}
		}
	}
}

export = Game;
