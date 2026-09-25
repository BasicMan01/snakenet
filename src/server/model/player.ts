import Vector2 = require('../classes/vector2');
import Constants = require('./constants');
import type Config = require('./config');
import type Field = require('./field');

class Player {
	private _config: Config;

	private _socketId: string;
	private _index: number;

	private _directionQueue: number[];
	private _growthSteps: number;
	private _dead: boolean;

	private _name: string;
	private _points: number;

	private _color: number;
	private _direction: number;
	private _head!: Vector2;
	private _body: (Vector2 | null)[];
	private _bodyHead: number;
	private _bodyTail: number;
	private _bodySize: number;

	constructor(config: Config, socketId: string, index: number) {
		this._config = config;

		this._socketId = socketId;
		this._index = index;

		this._directionQueue = [];
		this._growthSteps = 0;
		this._dead =  false;

		this._name = '';
		this._points = 0;

		this._color = 0;
		this._direction = 0;
		this._body = [];
		this._bodyHead = -1;
		this._bodyTail = 0;
		this._bodySize = 0;

		this._initPlayerByIndex(this._index);
	}

	private _initBody(): void {
		this._body = new Array<Vector2 | null>(this._config.getStartLength());
		this._bodyHead = -1;
		this._bodyTail = 0;
		this._bodySize = 0;
	}

	private _appendBody(value: Vector2): void {
		if (this._bodySize === this._body.length) {
			this._resizeBody();
		}

		this._bodyHead = (this._bodyHead + 1) % this._body.length;
		this._body[this._bodyHead] = value;

		if (this._bodySize === 0) {
			this._bodyTail = this._bodyHead;
		}

		++this._bodySize;
	}

	private _removeBody(): void {
		if (this._bodySize === 0) {
			return;
		}

		if (this._bodySize === 1) {
			this._body[this._bodyTail] = null;
			this._bodyHead = -1;
			this._bodyTail = 0;
			this._bodySize = 0;
			return;
		}

		this._body[this._bodyTail] = null;
		this._bodyTail = (this._bodyTail + 1) % this._body.length;
		--this._bodySize;
	}

	private _resizeBody(): void {
		const oldLength = this._body.length;
		const body = new Array<Vector2 | null>(oldLength === 0 ? 1 : oldLength * 2);

		for (let i = 0; i < this._bodySize; ++i) {
			body[i] = this._body[(this._bodyTail + i) % oldLength];
		}

		this._body = body;
		this._bodyTail = 0;
		this._bodyHead = this._bodySize - 1;
	}

	private _getBody(index: number): Vector2 {
		return this._body[(this._bodyTail + index) % this._body.length]!;
	}

	private _initPlayerByIndex(index: number): void {
		this._initBody();

		switch(index) {
			case 1: {
				this._color = Constants.COLOR_P1;
				this._direction = Constants.RIGHT;
				this._head = new Vector2(this._config.getStartLength() + 2, 1);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(i + 2, 1));
				}
			} break;

			case 2: {
				this._color = Constants.COLOR_P2;
				this._direction = Constants.DOWN;
				this._head = new Vector2(this._config.tiles - 2, this._config.getStartLength() + 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(this._config.tiles - 2, i + 2));
				}
			} break;

			case 3: {
				this._color = Constants.COLOR_P3;
				this._direction = Constants.LEFT;
				this._head = new Vector2(this._config.tiles - this._config.getStartLength() - 3, this._config.tiles - 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(this._config.tiles - i - 3, this._config.tiles - 2));
				}
			} break;

			case 4: {
				this._color = Constants.COLOR_P4;
				this._direction = Constants.UP;
				this._head = new Vector2(1, this._config.tiles - this._config.getStartLength() - 3);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(1, this._config.tiles - i - 3));
				}
			} break;

			case 5: {
				this._color = Constants.COLOR_P5;
				this._direction = Constants.DOWN;
				this._head = new Vector2(1, this._config.getStartLength() + 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(1, i + 2));
				}
			} break;

			case 6: {
				this._color = Constants.COLOR_P6;
				this._direction = Constants.LEFT;
				this._head = new Vector2(this._config.tiles - this._config.getStartLength() - 3, 1);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(this._config.tiles - i - 3, 1));
				}
			} break;

			case 7: {
				this._color = Constants.COLOR_P7;
				this._direction = Constants.UP;
				this._head = new Vector2(this._config.tiles - 2, this._config.tiles - this._config.getStartLength() - 3);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(this._config.tiles - 2, this._config.tiles - i - 3));
				}
			} break;

			case 8: {
				this._color = Constants.COLOR_P8;
				this._direction = Constants.RIGHT;
				this._head = new Vector2(this._config.getStartLength() + 2, this._config.tiles - 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._appendBody(new Vector2(i + 2, this._config.tiles - 2));
				}
			} break;
		}
	}

	private _collideWall(x: number, y: number): boolean {
		if (this._config.getWalls()) {
			if (x === this._config.tiles - 1 || x === 0 || y === this._config.tiles - 1 || y === 0) {
				return true;
			}
		}

		return false;
	}

	private _collideSnake(x: number, y: number, field: Field): boolean {
		return field.hasBody(x, y, this._index);
	}

	reset(): void {
		this._directionQueue = [];
		this._growthSteps = 0;
		this._dead =  false;

		this._initPlayerByIndex(this._index);
	}

	cleanUp(field: Field): void {
		for (let i = 0; i < this._bodySize; ++i) {
			const bodyPart = this._getBody(i);

			field.resetBodyIndex(bodyPart.x, bodyPart.y, this._index);
		}

		field.resetIndex(this._head.x, this._head.y, this._index);
	}

	isDead(): boolean {
		return this._dead;
	}

	getColor(): number {
		return this._color;
	}

	setDirection(newDirection: number): void {
		this._directionQueue.push(newDirection);
	}

	getIndex(): number {
		return this._index;
	}

	getName(): string {
		return this._name;
	}

	setName(name: string): void {
		this._name = name;
	}

	addPoints(points: number): void {
		this._points += points;
	}

	getPoints(): number {
		return this._points;
	}

	resetPoints(): void {
		this._points = 0;
	}

	getSocketId(): string {
		return this._socketId;
	}

	applyBodyToField(field: Field): void {
		for (let i = 0; i < this._bodySize; ++i) {
			const bodyPart = this._getBody(i);

			field.setBodyIndex(bodyPart.x, bodyPart.y, Constants.COLOR_TAIL, this._index);
		}
	}

	applyHeadToField(field: Field): void {
		field.setIndex(this._head.x, this._head.y, this._color, this._index);
	}

	collide(field: Field): void {
		if (!this._dead) {
			if (this._collideWall(this._head.x, this._head.y)) {
				this._dead = true;

				console.log('Player ' + this._index + ' is dead (wall)');
			}

			else if (this._collideSnake(this._head.x, this._head.y, field)) {
				this._dead = true;

				console.log('Player ' + this._index + ' is dead (own snake)');
			}

			else if (field.collideSnake(this._head.x, this._head.y, this._index)) {
				this._dead = true;

				console.log('Player ' + this._index + ' is dead (foreign snake)');
			}
		}
	}

	move(): void {
		if (!this._dead) {
			const directionVector = new Vector2();
			let directionChanged = false;

			// get next direction from queue
			while (this._directionQueue.length && !directionChanged) {
				const newDirection = this._directionQueue.shift()!;

				if (this._direction !== newDirection) {
					if (
						(this._direction === Constants.LEFT && newDirection !== Constants.RIGHT) ||
						(this._direction === Constants.UP && newDirection !== Constants.DOWN) ||
						(this._direction === Constants.RIGHT && newDirection !== Constants.LEFT) ||
						(this._direction === Constants.DOWN && newDirection !== Constants.UP)
					) {
						this._direction = newDirection;

						directionChanged = true;
					}
				}
			}

			if (this._direction === Constants.LEFT) {
				directionVector.x--;
			} else if (this._direction === Constants.UP) {
				directionVector.y--;
			} else if (this._direction === Constants.RIGHT) {
				directionVector.x++;
			} else if (this._direction === Constants.DOWN) {
				directionVector.y++;
			}

			this._growthSteps++;

			if (this._config.getGrowth() === 0 || this._growthSteps < this._config.getGrowth()) {
				this._removeBody();
			} else {
				this._growthSteps = 0;
			}

			this._appendBody(new Vector2(this._head.x, this._head.y));
			this._head.add(directionVector);

			if (!this._config.getWalls()) {
				if (this._head.x < 0) {
					this._head.x = this._config.tiles - 1;
				} else if (this._head.y < 0) {
					this._head.y = this._config.tiles - 1;
				} else if (this._head.x >= this._config.tiles) {
					this._head.x = 0;
				} else if (this._head.y >= this._config.tiles) {
					this._head.y = 0;
				}
			}
		}
	}
}

export = Player;
