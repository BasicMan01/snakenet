import Block = require('./block');
import Constants = require('./constants');
import type Config = require('./config');

class Field {
	private _config: Config;

	private _field: Block[][];
	private _sentValue: number[][];
	private _dirty: Set<number>;
	private _occupiedCells: Set<number>;

	constructor(config: Config) {
		this._config = config;

		this._field = [];
		this._sentValue = [];
		this._dirty = new Set();
		this._occupiedCells = new Set();

		this._init();
	}

	private _init(): void {
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

	private _syncDirty(row: number, col: number): void {
		const index = row * this._config.tiles + col;
		const value = this._field[row][col].getValue();

		if (value !== this._sentValue[row][col]) {
			this._dirty.add(index);
		} else {
			this._dirty.delete(index);
		}
	}

	private _syncWalls(walls: boolean): void {
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

	private _setWall(row: number, col: number, value: number): void {
		const block = this._field[row][col];

		if (block.getValue() !== value) {
			block.setValue(value);
			this._syncDirty(row, col);
		}
	}

	collideSnake(x: number, y: number, index: number): boolean {
		if (!this._field[y][x].isBitSetOnly(index)) {
			return true;
		}

		return false;
	}

	hasBody(x: number, y: number, index: number): boolean {
		return this._field[y][x].isBodyBitSet(index);
	}

	reset(): void {
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

	resetIndex(x: number, y: number, index: number): void {
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

	resetBodyIndex(x: number, y: number, index: number): void {
		const block = this._field[y][x];
		const cellIndex = y * this._config.tiles + x;

		block.setValue(0);
		block.resetBodyBit(index);

		if (block.hasBits()) {
			this._occupiedCells.add(cellIndex);
		} else {
			this._occupiedCells.delete(cellIndex);
		}

		this._syncDirty(y, x);
	}

	setIndex(x: number, y: number, value: number, index: number): void {
		const block = this._field[y][x];
		const cellIndex = y * this._config.tiles + x;

		block.setValue(value);
		block.setBit(index);
		this._occupiedCells.add(cellIndex);
		this._syncDirty(y, x);
	}

	setBodyIndex(x: number, y: number, value: number, index: number): void {
		const block = this._field[y][x];
		const cellIndex = y * this._config.tiles + x;

		block.setValue(value);
		block.setBodyBit(index);
		this._occupiedCells.add(cellIndex);
		this._syncDirty(y, x);
	}

	getSocketData(full: boolean): number[] {
		const result: number[] = [];
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

export = Field;
