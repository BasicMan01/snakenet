const Block = require('./block');
const Constants = require('./constants');

class Field {
	constructor(config) {
		this._config = config;

		this._field = [];
		this._sentValue = [];
		this._dirty = new Set();

		this._init();
	}

	_init() {
		const walls = this._config.getWalls();

		for (let row = 0; row < this._config.tiles; ++row) {
			this._field[row] = [];
			this._sentValue[row] = [];

			for (let col = 0; col < this._config.tiles; ++col) {
				this._field[row][col] = new Block(0);
				this._sentValue[row][col] = 0;

				if (walls) {
					if (col === 0 || col === this._config.tiles - 1 || row === 0 || row === this._config.tiles - 1) {
						this._field[row][col].setValue(Constants.COLOR_WALL);
						this._syncDirty(row, col);
					}
				}
			}
		}
	}

	_syncDirty(row, col) {
		const index = row * this._config.tiles + col;
		const value = this._field[row][col].getValue();

		if (value !== this._sentValue[row][col]) {
			this._dirty.add(index);
		} else {
			this._dirty.delete(index);
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
				this._syncDirty(row, col);

				if (walls) {
					if (col === 0 || col === this._config.tiles - 1 || row === 0 || row === this._config.tiles - 1) {
						this._field[row][col].setValue(Constants.COLOR_WALL);
						this._syncDirty(row, col);
					}
				}
			}
		}
	}

	resetIndex(x, y, index) {
		this._field[y][x].setValue(0);
		this._field[y][x].resetBit(index);
		this._syncDirty(y, x);
	}

	setIndex(x, y, value, index) {
		this._field[y][x].setValue(value);
		this._field[y][x].setBit(index);
		this._syncDirty(y, x);
	}

	getSocketData(full) {
		const result = [];
		const tiles = this._config.tiles;

		if (full) {
			for (let row = 0; row < tiles; ++row) {
				for (let col = 0; col < tiles; ++col) {
					const value = this._field[row][col].getValue();

					this._sentValue[row][col] = value;

					if (value > 0) {
						result.push(row * tiles + col, value);
					}
				}
			}
		} else {
			this._dirty.forEach((index) => {
				const row = Math.floor(index / tiles);
				const col = index % tiles;
				const value = this._field[row][col].getValue();

				this._sentValue[row][col] = value;

				result.push(index, value);
			});
		}

		this._dirty.clear();

		return result;
	}
}

module.exports = Field;