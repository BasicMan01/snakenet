import Vector2 = require('../classes/vector2');
import Constants = require('./constants');
import type Config = require('./config');
import type Field = require('./field');

class Player {
	private config: Config;

	private socketId: string;
	private index: number;

	private directionQueue: number[];
	private growthSteps: number;
	private dead: boolean;

	private name: string;
	private points: number;

	private color: number;
	private direction: number;
	private head!: Vector2;
	private body: (Vector2 | null)[];
	private bodyHead: number;
	private bodyTail: number;
	private bodySize: number;

	constructor(config: Config, socketId: string, index: number) {
		this.config = config;

		this.socketId = socketId;
		this.index = index;

		this.directionQueue = [];
		this.growthSteps = 0;
		this.dead =  false;

		this.name = '';
		this.points = 0;

		this.color = 0;
		this.direction = 0;
		this.body = [];
		this.bodyHead = -1;
		this.bodyTail = 0;
		this.bodySize = 0;

		this.initPlayerByIndex(this.index);
	}

	private initBody(): void {
		this.body = new Array<Vector2 | null>(this.config.getStartLength());
		this.bodyHead = -1;
		this.bodyTail = 0;
		this.bodySize = 0;
	}

	private appendBody(value: Vector2): void {
		if (this.bodySize === this.body.length) {
			this.resizeBody();
		}

		this.bodyHead = (this.bodyHead + 1) % this.body.length;
		this.body[this.bodyHead] = value;

		if (this.bodySize === 0) {
			this.bodyTail = this.bodyHead;
		}

		++this.bodySize;
	}

	private removeBody(): void {
		if (this.bodySize === 0) {
			return;
		}

		if (this.bodySize === 1) {
			this.body[this.bodyTail] = null;
			this.bodyHead = -1;
			this.bodyTail = 0;
			this.bodySize = 0;
			return;
		}

		this.body[this.bodyTail] = null;
		this.bodyTail = (this.bodyTail + 1) % this.body.length;
		--this.bodySize;
	}

	private resizeBody(): void {
		const oldLength = this.body.length;
		const body = new Array<Vector2 | null>(oldLength === 0 ? 1 : oldLength * 2);

		for (let i = 0; i < this.bodySize; ++i) {
			body[i] = this.body[(this.bodyTail + i) % oldLength];
		}

		this.body = body;
		this.bodyTail = 0;
		this.bodyHead = this.bodySize - 1;
	}

	private getBody(index: number): Vector2 {
		return this.body[(this.bodyTail + index) % this.body.length]!;
	}

	private initPlayerByIndex(index: number): void {
		this.initBody();

		switch(index) {
			case 1: {
				this.color = Constants.COLOR_P1;
				this.direction = Constants.RIGHT;
				this.head = new Vector2(this.config.getStartLength() + 2, 1);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(i + 2, 1));
				}
			} break;

			case 2: {
				this.color = Constants.COLOR_P2;
				this.direction = Constants.DOWN;
				this.head = new Vector2(this.config.tiles - 2, this.config.getStartLength() + 2);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(this.config.tiles - 2, i + 2));
				}
			} break;

			case 3: {
				this.color = Constants.COLOR_P3;
				this.direction = Constants.LEFT;
				this.head = new Vector2(this.config.tiles - this.config.getStartLength() - 3, this.config.tiles - 2);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(this.config.tiles - i - 3, this.config.tiles - 2));
				}
			} break;

			case 4: {
				this.color = Constants.COLOR_P4;
				this.direction = Constants.UP;
				this.head = new Vector2(1, this.config.tiles - this.config.getStartLength() - 3);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(1, this.config.tiles - i - 3));
				}
			} break;

			case 5: {
				this.color = Constants.COLOR_P5;
				this.direction = Constants.DOWN;
				this.head = new Vector2(1, this.config.getStartLength() + 2);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(1, i + 2));
				}
			} break;

			case 6: {
				this.color = Constants.COLOR_P6;
				this.direction = Constants.LEFT;
				this.head = new Vector2(this.config.tiles - this.config.getStartLength() - 3, 1);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(this.config.tiles - i - 3, 1));
				}
			} break;

			case 7: {
				this.color = Constants.COLOR_P7;
				this.direction = Constants.UP;
				this.head = new Vector2(this.config.tiles - 2, this.config.tiles - this.config.getStartLength() - 3);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(this.config.tiles - 2, this.config.tiles - i - 3));
				}
			} break;

			case 8: {
				this.color = Constants.COLOR_P8;
				this.direction = Constants.RIGHT;
				this.head = new Vector2(this.config.getStartLength() + 2, this.config.tiles - 2);

				for (let i = 0; i < this.config.getStartLength(); ++i) {
					this.appendBody(new Vector2(i + 2, this.config.tiles - 2));
				}
			} break;
		}
	}

	private collideWall(x: number, y: number): boolean {
		if (this.config.getWalls()) {
			if (x === this.config.tiles - 1 || x === 0 || y === this.config.tiles - 1 || y === 0) {
				return true;
			}
		}

		return false;
	}

	private collideSnake(x: number, y: number, field: Field): boolean {
		return field.hasBody(x, y, this.index);
	}

	reset(): void {
		this.directionQueue = [];
		this.growthSteps = 0;
		this.dead =  false;

		this.initPlayerByIndex(this.index);
	}

	cleanUp(field: Field): void {
		for (let i = 0; i < this.bodySize; ++i) {
			const bodyPart = this.getBody(i);

			field.resetBodyIndex(bodyPart.x, bodyPart.y, this.index);
		}

		field.resetIndex(this.head.x, this.head.y, this.index);
	}

	isDead(): boolean {
		return this.dead;
	}

	getColor(): number {
		return this.color;
	}

	setDirection(newDirection: number): void {
		this.directionQueue.push(newDirection);
	}

	getIndex(): number {
		return this.index;
	}

	getName(): string {
		return this.name;
	}

	setName(name: string): void {
		this.name = name;
	}

	addPoints(points: number): void {
		this.points += points;
	}

	getPoints(): number {
		return this.points;
	}

	resetPoints(): void {
		this.points = 0;
	}

	getSocketId(): string {
		return this.socketId;
	}

	applyBodyToField(field: Field): void {
		for (let i = 0; i < this.bodySize; ++i) {
			const bodyPart = this.getBody(i);

			field.setBodyIndex(bodyPart.x, bodyPart.y, Constants.COLOR_TAIL, this.index);
		}
	}

	applyHeadToField(field: Field): void {
		field.setIndex(this.head.x, this.head.y, this.color, this.index);
	}

	collide(field: Field): void {
		if (!this.dead) {
			if (this.collideWall(this.head.x, this.head.y)) {
				this.dead = true;

				console.log('Player ' + this.index + ' is dead (wall)');
			}

			else if (this.collideSnake(this.head.x, this.head.y, field)) {
				this.dead = true;

				console.log('Player ' + this.index + ' is dead (own snake)');
			}

			else if (field.collideSnake(this.head.x, this.head.y, this.index)) {
				this.dead = true;

				console.log('Player ' + this.index + ' is dead (foreign snake)');
			}
		}
	}

	move(): void {
		if (!this.dead) {
			const directionVector = new Vector2();
			let directionChanged = false;

			// get next direction from queue
			while (this.directionQueue.length && !directionChanged) {
				const newDirection = this.directionQueue.shift()!;

				if (this.direction !== newDirection) {
					if (
						(this.direction === Constants.LEFT && newDirection !== Constants.RIGHT) ||
						(this.direction === Constants.UP && newDirection !== Constants.DOWN) ||
						(this.direction === Constants.RIGHT && newDirection !== Constants.LEFT) ||
						(this.direction === Constants.DOWN && newDirection !== Constants.UP)
					) {
						this.direction = newDirection;

						directionChanged = true;
					}
				}
			}

			if (this.direction === Constants.LEFT) {
				directionVector.x--;
			} else if (this.direction === Constants.UP) {
				directionVector.y--;
			} else if (this.direction === Constants.RIGHT) {
				directionVector.x++;
			} else if (this.direction === Constants.DOWN) {
				directionVector.y++;
			}

			this.growthSteps++;

			if (this.config.getGrowth() === 0 || this.growthSteps < this.config.getGrowth()) {
				this.removeBody();
			} else {
				this.growthSteps = 0;
			}

			this.appendBody(new Vector2(this.head.x, this.head.y));
			this.head.add(directionVector);

			if (!this.config.getWalls()) {
				if (this.head.x < 0) {
					this.head.x = this.config.tiles - 1;
				} else if (this.head.y < 0) {
					this.head.y = this.config.tiles - 1;
				} else if (this.head.x >= this.config.tiles) {
					this.head.x = 0;
				} else if (this.head.y >= this.config.tiles) {
					this.head.y = 0;
				}
			}
		}
	}
}

export = Player;
