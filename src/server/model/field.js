const Block = require('./block');
const Constants = require('./constants');

class Field {
	constructor(config) {
		this._config = config;

		this._field = [];
		this._sentValue = [];
		this._dirty = new Set();
		this._occupiedCells = new Set();

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

	_syncWalls(walls) {
		const tiles = this._config.tiles;
		const value = walls ? Constants.COLOR_WALL : 0;

		for (let col = 0; col < tiles; ++col) {
			this._setWall(0, col, value);
			this._setWall(tiles - 1, col, value);
		}

		for (let row = 1; row < tiles - 1; ++row) {
			this._setWall(row, 0, value);
			this._setWall(row, tiles - 1, value);
		}
	}

	_setWall(row, col, value) {
		const block = this._field[row][col];

		if (block.getValue() !== value) {
			block.setValue(value);
			this._syncDirty(row, col);
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

		this._occupiedCells.forEach((index) => {
			const row = Math.floor(index / this._config.tiles);
			const col = index % this._config.tiles;

			this._field[row][col].reset();
			this._syncDirty(row, col);
		});

		this._occupiedCells.clear();
		this._syncWalls(walls);
	}

	resetIndex(x, y, index) {
		const block = this._field[y][x];
		const cellIndex = y * this._config.tiles + x;

		block.setValue(0);
		block.resetBit(index);

		if (block.hasBits()) {
			this._occupiedCells.add(cellIndex);
		} else {
			this._occupiedCells.delete(cellIndex);
		}

		this._syncDirty(y, x);
	}

	setIndex(x, y, value, index) {
		const block = this._field[y][x];
		const cellIndex = y * this._config.tiles + x;

		block.setValue(value);
		block.setBit(index);
		this._occupiedCells.add(cellIndex);
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