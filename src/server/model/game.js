let Constants = require('./constants');
var Field = require('./field');
var Player = require('./player');

class Game {
	constructor(config) {
		this.config = config;

		this.field = new Field(this.config);
		this.players = [];
		this.socketIndex = {};

		this.startTimeCountdown = 0;
		this.gameStatus = Constants.GAME_STOP;

		this.init();
	}

	init() {
		for (let i = 0; i < this.config.player; ++i) {
			this.players[i] = null;
		}
	}

	isCreator(socketId) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			if (this.socketIndex[socketId].index === 1) {
				return true;
			}
		}

		return false;
	}

	addPlayer(socketId) {
		console.log('Game::addPlayer ' + socketId);

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] === null) {
				this.players[i] = new Player(this.config, socketId, i + 1);
				this.socketIndex[socketId] = this.players[i];

				this.players[i].applyBodyToField(this.field);
				this.players[i].applyHeadToField(this.field);

				return true;
			}
		}

		return false;
	}

	countPlayer() {
		let count = 0;

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] !== null) {
				count++;;
			}
		}

		return count;
	}

	removePlayer(socketId) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			delete this.socketIndex[socketId];
		}

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] !== null && socketId === this.players[i].socketId) {
				this.players[i].cleanUp(this.field);
				this.players[i] = null;
			}
		}

		console.log('Game::removePlayer ' + socketId);
	}

	move() {
		if (this.gameStatus === Constants.GAME_COUNTDOWN) {
			if  (this.startTimeCountdown - Date.now() <= 0) {
				this.gameStatus = Constants.GAME_RUN;
			}
		}

		if (this.gameStatus === Constants.GAME_RUN) {
			let livingPlayer = 0;

			this.field.reset();

			for (let i = 0; i < this.config.player; ++i) {
				if (this.players[i] !== null) {
					this.players[i].move();
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				if (this.players[i] !== null) {
					this.players[i].applyBodyToField(this.field);
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				if (this.players[i] !== null) {
					this.players[i].applyHeadToField(this.field);
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				if (this.players[i] !== null) {
					this.players[i].collide(this.field);
				}
			}

			for (let i = 0; i < this.config.player; ++i) {
				if (this.players[i] !== null && !this.players[i].dead) {
					++livingPlayer;
				}
			}

			if (livingPlayer <= 1) {
				for (let i = 0; i < this.config.player; ++i) {
					if (this.players[i] !== null && !this.players[i].dead) {
						this.players[i].points++;
					}
				}

				this.gameStatus = Constants.GAME_STOP;
				this.start();
			}
		}
	}

	start() {
		this.field.reset();

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] !== null) {
				this.players[i].reset();
				this.players[i].applyBodyToField(this.field);
				this.players[i].applyHeadToField(this.field);
			}
		}
	}

	getSocketData() {
		let data = {};

		data.countdown = Math.ceil((this.startTimeCountdown - Date.now()) / 1000);
		data.field = this.field.getSocketData();
		data.player = [];

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] !== null) {
				data.player.push([
					this.players[i].index,
					this.players[i].color,
					this.players[i].name,
					this.players[i].points
				]);
			}
		}

		return data;
	}

	setDirection(socketId, direction) {
		if (this.gameStatus !== Constants.GAME_RUN) {
			return;
		}

		if (this.socketIndex.hasOwnProperty(socketId)) {
			this.socketIndex[socketId].setDirection(direction);
		}
	}

	getPlayerColor(socketId) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			return this.socketIndex[socketId].getColor();
		}

		return 0;
	}

	getPlayerName(socketId) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			return this.socketIndex[socketId].getName();
		}

		return '';
	}

	setPlayerName(socketId, name) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			this.socketIndex[socketId].setName(name.substring(0, 10));
		}
	}

	setPause(socketId) {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to pause the game
		if (this.isCreator(socketId)) {
			if (this.gameStatus === Constants.GAME_RUN) {
				this.gameStatus = Constants.GAME_PAUSED;
			} else if (this.gameStatus === Constants.GAME_PAUSED) {
				this.gameStatus = Constants.GAME_RUN;
			}
		}
	}

	setStart(socketId) {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to start the game
		if (this.isCreator(socketId)) {
			this.startTimeCountdown = Date.now() + this.config.countdown;
			this.gameStatus = Constants.GAME_COUNTDOWN;
		}
	}
}

module.exports = Game;