var Block = require('./block');
var Constants = require('./constants');

class Field {
	constructor(config) {
		this.config = config;

		this.field = [];

		this.init();
	}

	init() {
		for (let row = 0; row < this.config.tiles; ++row) {
			this.field[row] = [];

			for (let col = 0; col < this.config.tiles; ++col) {
				this.field[row][col] = new Block(0);

				if (this.config.activeWalls) {
					if (col === 0 || col === this.config.tiles - 1 || row === 0 || row === this.config.tiles - 1) {
						this.field[row][col].setValue(Constants.GREY);
					}
				}
			}
		}
	}

	collideSnake(x, y, index) {
		//this.index
		if (!this.field[y][x].isBitSetOnly(index)) {
			return true;
		}

		return false;
	}

	resetAll() {
		for (let row = 0; row < this.config.tiles; ++row) {
			for (let col = 0; col < this.config.tiles; ++col) {
				this.field[row][col].reset();

				if (this.config.activeWalls) {
					if (col === 0 || col === this.config.tiles - 1 || row === 0 || row === this.config.tiles - 1) {
						this.field[row][col].setValue(Constants.GREY);
					}
				}
			}
		}
	}

	set(x, y, value, index) {
		this.field[y][x].setValue(value);
		this.field[y][x].setBit(index);
	}

	getSocketData() {
		let result = [];

		for (let row = 0; row < this.config.tiles; ++row) {
			for (let col = 0; col < this.config.tiles; ++col) {
				if (this.field[row][col].getValue() > 0) {
					result.push([row, col, this.field[row][col].getValue()]);
				}
			}
		}

		return result;
	}
}

module.exports = Field;