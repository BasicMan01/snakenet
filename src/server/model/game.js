let Constants = require('./constants');
let Field = require('./field');
let Player = require('./player');

class Game {
	constructor(config, socketMessage) {
		this._config = config;
		this._socketMessage = socketMessage;

		this._field = new Field(this._config);
		this._players = [];
		this._socketIndex = {};

		this._startTimeCountdown = 0;
		this._stopTimeCountdown = 0;
		this._timeoutInterval = null;

		this._gameStatus = Constants.GAME_STOP;

		this.init();
	}

	init() {
		for (let i = 0; i < this._config.player; ++i) {
			this._players[i] = null;
		}
	}

	animation() {
		this.move();

		this._socketMessage.sendGameData(this.getSocketData());
	}

	startAnimation() {
		this._timeoutInterval = setInterval(this.animation.bind(this), this._config.getInterval());
	}

	stopAnimation() {
		if (this._timeoutInterval !== null) {
			clearInterval(this._timeoutInterval);
		}
	}

	isCreator(socketId) {
		if (this._socketIndex.hasOwnProperty(socketId)) {
			if (this._socketIndex[socketId].getIndex() === 1) {
				return true;
			}
		}

		return false;
	}

	addPlayer(socketId) {
		console.log('Game::addPlayer ' + socketId);

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] === null) {
				this._players[i] = new Player(this._config, socketId, i + 1);
				this._socketIndex[socketId] = this._players[i];

				this._players[i].applyBodyToField(this._field);
				this._players[i].applyHeadToField(this._field);

				return true;
			}
		}

		return false;
	}

	countPlayer() {
		let count = 0;

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] !== null) {
				++count;
			}
		}

		return count;
	}

	removePlayer(socketId) {
		this._socketMessage.sendChatMessage(
			'SYSTEM',
			Constants.COLOR_TEXT,
			this.getPlayerName(socketId) + ' has left the game'
		);

		if (this._socketIndex.hasOwnProperty(socketId)) {
			delete this._socketIndex[socketId];
		}

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] !== null && socketId === this._players[i].getSocketId()) {
				this._players[i].cleanUp(this._field);
				this._players[i] = null;
			}
		}

		console.log('Game::removePlayer ' + socketId);
	}

	move() {
		if (this._gameStatus === Constants.GAME_START_COUNTDOWN) {
			if  (this._startTimeCountdown - Date.now() <= 0) {
				this._gameStatus = Constants.GAME_RUN;
			}
		}

		if (this._gameStatus === Constants.GAME_RUN) {
			let livingPlayer = 0;

			this._field.reset();

			for (let i = 0; i < this._config.player; ++i) {
				if (this._players[i] !== null) {
					this._players[i].move();
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				if (this._players[i] !== null) {
					this._players[i].applyBodyToField(this._field);
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				if (this._players[i] !== null) {
					this._players[i].applyHeadToField(this._field);
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				if (this._players[i] !== null) {
					this._players[i].collide(this._field);
				}
			}

			for (let i = 0; i < this._config.player; ++i) {
				if (this._players[i] !== null && !this._players[i].isDead()) {
					++livingPlayer;
				}
			}

			if (livingPlayer <= 1) {
				for (let i = 0; i < this._config.player; ++i) {
					if (this._players[i] !== null && !this._players[i].isDead()) {
						this._players[i].addPoints(1);

						this._socketMessage.sendChatMessage(
							'SYSTEM',
							Constants.COLOR_TEXT,
							this._players[i].getName() + ' win &#x1F3C6;'
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

	start() {
		this._field.reset();

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] !== null) {
				this._players[i].reset();
				this._players[i].applyBodyToField(this._field);
				this._players[i].applyHeadToField(this._field);
			}
		}
	}

	getSocketData() {
		let data = {};

		data.countdown = Math.ceil((this._startTimeCountdown - Date.now()) / 1000);
		data.field = this._field.getSocketData();
		data.player = [];

		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] !== null) {
				data.player.push([
					this._players[i].getIndex(),
					this._players[i].getColor(),
					this._players[i].getName(),
					this._players[i].getPoints()
				]);
			}
		}

		return data;
	}

	resetPoints() {
		for (let i = 0; i < this._config.player; ++i) {
			if (this._players[i] !== null) {
				this._players[i].resetPoints();
			}
		}
	}

	setDirection(socketId, direction) {
		if (this._gameStatus !== Constants.GAME_RUN) {
			return;
		}

		if (this._socketIndex.hasOwnProperty(socketId)) {
			this._socketIndex[socketId].setDirection(direction);
		}
	}

	getPlayerColor(socketId) {
		if (this._socketIndex.hasOwnProperty(socketId)) {
			return this._socketIndex[socketId].getColor();
		}

		return 0;
	}

	getPlayerName(socketId) {
		if (this._socketIndex.hasOwnProperty(socketId)) {
			return this._socketIndex[socketId].getName();
		}

		return '';
	}

	setPlayerName(socketId, name) {
		if (this._socketIndex.hasOwnProperty(socketId)) {
			this._socketIndex[socketId].setName(name.substring(0, 10));
		}

		this._socketMessage.sendChatMessage(
			'SYSTEM',
			Constants.COLOR_TEXT,
			this.getPlayerName(socketId) + ' joined the game'
		);
	}

	setPause(socketId) {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to pause the game
		if (this.isCreator(socketId)) {
			if (this._gameStatus === Constants.GAME_RUN) {
				this._gameStatus = Constants.GAME_PAUSED;
			} else if (this._gameStatus === Constants.GAME_PAUSED) {
				this._gameStatus = Constants.GAME_RUN;
			}
		}
	}

	setStart(socketId) {
		if (this.countPlayer() <= 1) {
			return;
		}

		// only the creator has rights to start the game
		if (this.isCreator(socketId)) {
			if (this._gameStatus === Constants.GAME_STOP) {
				this._startTimeCountdown = Date.now() + Constants.START_COUNTDOWN;
				this._gameStatus = Constants.GAME_START_COUNTDOWN;
			}
		}
	}
}

module.exports = Game;