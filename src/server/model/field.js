let Block = require('./block');
let Constants = require('./constants');

class Field {
	constructor(config) {
		this._config = config;

		this._field = [];

		this._init();
	}

	_init() {
		const walls = this._config.getWalls();

		for (let row = 0; row < this._config.tiles; ++row) {
			this._field[row] = [];

			for (let col = 0; col < this._config.tiles; ++col) {
				this._field[row][col] = new Block(0);

				if (walls) {
					if (col === 0 || col === this._config.tiles - 1 || row === 0 || row === this._config.tiles - 1) {
						this._field[row][col].setValue(Constants.COLOR_WALL);
					}
				}
			}
		}
	}

	collideSnake(x, y, index) {
		if (!this._field[y][x].isBitSetOnly(index)) {
			return true;
		}

		return false;
	}

	reset() {
		const walls = this._config.getWalls();

		for (let row = 0; row < this._config.tiles; ++row) {
			for (let col = 0; col < this._config.tiles; ++col) {
				this._field[row][col].reset();

				if (walls) {
					if (col === 0 || col === this._config.tiles - 1 || row === 0 || row === this._config.tiles - 1) {
						this._field[row][col].setValue(Constants.COLOR_WALL);
					}
				}
			}
		}
	}

	resetIndex(x, y, index) {
		this._field[y][x].setValue(0);
		this._field[y][x].resetBit(index);
	}

	setIndex(x, y, value, index) {
		this._field[y][x].setValue(value);
		this._field[y][x].setBit(index);
	}

	getSocketData() {
		let result = [];

		for (let row = 0; row < this._config.tiles; ++row) {
			for (let col = 0; col < this._config.tiles; ++col) {
				if (this._field[row][col].getValue() > 0) {
					result.push([row, col, this._field[row][col].getValue()]);
				}
			}
		}

		return result;
	}
}

module.exports = Field;