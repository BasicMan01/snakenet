var Block = require('./block');
var Player = require('./player');

class Game {
	constructor(config) {
		this.config = config;

		this.field = [];
		this.players = [];
		this.socketIndex = {};

		this.run = false;

		this.init();
	}

	init() {
		for (let row = 0; row < this.config.tiles; ++row) {
			this.field[row] = [];

			for (let col = 0; col < this.config.tiles; ++col) {
				this.field[row][col] = new Block(0);

				if (this.config.activeWalls) {
					if (col == 0 || col == this.config.tiles - 1 || row == 0 || row == this.config.tiles - 1) {
						this.field[row][col].setId(11);
					}
				}
			}
		}

		for (let i = 0; i < this.config.player; ++i) {
			this.players[i] = null;
		}
	}

	addPlayer(socketId) {
		console.log('Game::addPlayer ' + socketId);

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] == null) {
				this.players[i] = new Player(this.config, socketId, i, this.field);
				this.socketIndex[socketId] = this.players[i];
				break;
			}
		}
	}

	removePlayer(socketId) {
		delete this.socketIndex[socketId];

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null && socketId == this.players[i].socketId) {
				this.players[i].cleanUp();
				this.players[i] = null;
			}
		}
	}

	move() {
		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null) {
				this.players[i].move();
			}
		}
	}

	getFieldSocketData() {
		let result = [];

		for (let row = 0; row < this.config.tiles; ++row) {
			for (let col = 0; col < this.config.tiles; ++col) {
				if (this.field[row][col].getId() > 0) {
					result.push([row, col, this.field[row][col].getId()]);
				}
			}
		}

		return result;
	}

	setDirection(socketId, direction) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			this.socketIndex[socketId].setDirection(direction);
		}
	}
}

module.exports = Game;