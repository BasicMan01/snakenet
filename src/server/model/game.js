var Field = require('./field');
var Player = require('./player');

class Game {
	constructor(config) {
		this.config = config;

		this.field = new Field(this.config);
		this.players = [];
		this.socketIndex = {};

		this.run = false;

		this.init();
	}

	init() {
		for (let i = 0; i < this.config.player; ++i) {
			this.players[i] = null;
		}
	}

	addPlayer(socketId) {
		console.log('Game::addPlayer ' + socketId);

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] == null) {
				this.players[i] = new Player(this.config, socketId, i + 1);
				this.socketIndex[socketId] = this.players[i];

				this.players[i].applyBodyToField(this.field);
				this.players[i].applyHeadToField(this.field);
				break;
			}
		}
	}

	removePlayer(socketId) {
		console.log('Game::removePlayer ' + socketId);

		if (this.socketIndex.hasOwnProperty(socketId)) {
			delete this.socketIndex[socketId];
		}

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null && socketId == this.players[i].socketId) {
				this.players[i].cleanUp();
				this.players[i] = null;
			}
		}
	}

	move() {
		this.field.resetAll();

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null) {
				this.players[i].move();
			}
		}

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null) {
				this.players[i].applyBodyToField(this.field);
			}
		}

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null) {
				this.players[i].applyHeadToField(this.field);
			}
		}

		for (let i = 0; i < this.config.player; ++i) {
			if (this.players[i] != null) {
				this.players[i].collide(this.field);
			}
		}
	}

	getFieldSocketData() {
		return this.field.getSocketData();
	}

	setDirection(socketId, direction) {
		if (this.socketIndex.hasOwnProperty(socketId)) {
			this.socketIndex[socketId].setDirection(direction);
		}
	}
}

module.exports = Game;