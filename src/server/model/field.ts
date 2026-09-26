import Block = require('./block');
import Constants = require('./constants');
import type Config = require('./config');

class Field {
	private config: Config;

	private field: Block[][];
	private sentValue: number[][];
	private dirty: Set<number>;
	private occupiedCells: Set<number>;

	constructor(config: Config) {
		this.config = config;

		this.field = [];
		this.sentValue = [];
		this.dirty = new Set();
		this.occupiedCells = new Set();

		this.init();
	}

	private init(): void {
		const walls = this.config.getWalls();

		for (let row = 0; row < this.config.tiles; ++row) {
			this.field[row] = [];
			this.sentValue[row] = [];

			for (let col = 0; col < this.config.tiles; ++col) {
				this.field[row][col] = new Block(0);
				this.sentValue[row][col] = 0;

				if (walls) {
					if (col === 0 || col === this.config.tiles - 1 || row === 0 || row === this.config.tiles - 1) {
						this.field[row][col].setValue(Constants.COLOR_WALL);
						this.syncDirty(row, col);
					}
				}
			}
		}
	}

	private syncDirty(row: number, col: number): void {
		const index = row * this.config.tiles + col;
		const value = this.field[row][col].getValue();

		if (value !== this.sentValue[row][col]) {
			this.dirty.add(index);
		} else {
			this.dirty.delete(index);
		}
	}

	private syncWalls(walls: boolean): void {
		const tiles = this.config.tiles;
		const value = walls ? Constants.COLOR_WALL : 0;

		for (let col = 0; col < tiles; ++col) {
			this.setWall(0, col, value);
			this.setWall(tiles - 1, col, value);
		}

		for (let row = 1; row < tiles - 1; ++row) {
			this.setWall(row, 0, value);
			this.setWall(row, tiles - 1, value);
		}
	}

	private setWall(row: number, col: number, value: number): void {
		const block = this.field[row][col];

		if (block.getValue() !== value) {
			block.setValue(value);
			this.syncDirty(row, col);
		}
	}

	collideSnake(x: number, y: number, index: number): boolean {
		if (!this.field[y][x].isBitSetOnly(index)) {
			return true;
		}

		return false;
	}

	hasBody(x: number, y: number, index: number): boolean {
		return this.field[y][x].isBodyBitSet(index);
	}

	reset(): void {
		const walls = this.config.getWalls();

		this.occupiedCells.forEach((index) => {
			const row = Math.floor(index / this.config.tiles);
			const col = index % this.config.tiles;

			this.field[row][col].reset();
			this.syncDirty(row, col);
		});

		this.occupiedCells.clear();
		this.syncWalls(walls);
	}

	resetIndex(x: number, y: number, index: number): void {
		const block = this.field[y][x];
		const cellIndex = y * this.config.tiles + x;

		block.setValue(0);
		block.resetBit(index);

		if (block.hasBits()) {
			this.occupiedCells.add(cellIndex);
		} else {
			this.occupiedCells.delete(cellIndex);
		}

		this.syncDirty(y, x);
	}

	resetBodyIndex(x: number, y: number, index: number): void {
		const block = this.field[y][x];
		const cellIndex = y * this.config.tiles + x;

		block.setValue(0);
		block.resetBodyBit(index);

		if (block.hasBits()) {
			this.occupiedCells.add(cellIndex);
		} else {
			this.occupiedCells.delete(cellIndex);
		}

		this.syncDirty(y, x);
	}

	setIndex(x: number, y: number, value: number, index: number): void {
		const block = this.field[y][x];
		const cellIndex = y * this.config.tiles + x;

		block.setValue(value);
		block.setBit(index);
		this.occupiedCells.add(cellIndex);
		this.syncDirty(y, x);
	}

	setBodyIndex(x: number, y: number, value: number, index: number): void {
		const block = this.field[y][x];
		const cellIndex = y * this.config.tiles + x;

		block.setValue(value);
		block.setBodyBit(index);
		this.occupiedCells.add(cellIndex);
		this.syncDirty(y, x);
	}

	getSocketData(full: boolean): number[] {
		const result: number[] = [];
		const tiles = this.config.tiles;

		if (full) {
			for (let row = 0; row < tiles; ++row) {
				for (let col = 0; col < tiles; ++col) {
					const value = this.field[row][col].getValue();

					this.sentValue[row][col] = value;

					if (value > 0) {
						result.push(row * tiles + col, value);
					}
				}
			}
		} else {
			this.dirty.forEach((index) => {
				const row = Math.floor(index / tiles);
				const col = index % tiles;
				const value = this.field[row][col].getValue();

				this.sentValue[row][col] = value;

				result.push(index, value);
			});
		}

		this.dirty.clear();

		return result;
	}
}

export = Field;
