var Block = require('./block.js');
var Player = require('./player.js');

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
				this.players[i] = new Player(socketId, i, this.field);
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
}

module.exports = Game;