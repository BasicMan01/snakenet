let Vector2 = require('../classes/vector2');
let Constants = require('./constants');

class Player {
	constructor(config, socketId, index) {
		this.config = config;

		this.socketId = socketId;
		this.index = index;

		this.lockDirection = false;
		this.growthSteps = 0;
		this.dead =  false;

		this.name = '';
		this.points = 0;

		this.color = 0;
		this.direction = 0;
		this.head = null;
		this.body = [];

		this.initPlayerByIndex(this.index);
	}

	reset() {
		this.lockDirection = false;
		this.growthSteps = 0;
		this.dead =  false;

		this.initPlayerByIndex(this.index);
	}

	cleanUp(field) {
		for (let i = 0; i < this.body.length; ++i) {
			field.resetIndex(this.body[i].x, this.body[i].y, this.index);
		}

		field.resetIndex(this.head.x, this.head.y, this.index);
	}

	initPlayerByIndex(index) {
		this.body = [];

		switch(index) {
			case 1: {
				this.color = Constants.YELLOW;
				this.direction = Constants.RIGHT;
				this.head = new Vector2(this.config.startLength + 2, 1);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(i + 2, 1));
				}
			} break;

			case 2: {
				this.color = Constants.ORANGE;
				this.direction = Constants.DOWN;
				this.head = new Vector2(this.config.tiles - 2, this.config.startLength + 2);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(this.config.tiles - 2, i + 2));
					}
			} break;

			case 3: {
				this.color = Constants.RED;
				this.direction = Constants.LEFT;
				this.head = new Vector2(this.config.tiles - this.config.startLength - 3, this.config.tiles - 2);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(this.config.tiles - i - 3, this.config.tiles - 2));
				}
			} break;

			case 4: {
				this.color = Constants.PINK;
				this.direction = Constants.UP;
				this.head = new Vector2(1, this.config.tiles - this.config.startLength - 3);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(1, this.config.tiles - i - 3));
				}
			} break;

			case 5: {
				this.color = Constants.PURPLE;
				this.direction = Constants.DOWN;
				this.head = new Vector2(1, this.config.startLength + 2);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(1, i + 2));
				}
			} break;

			case 6: {
				this.color = Constants.BLUE;
				this.direction = Constants.LEFT;
				this.head = new Vector2(this.config.tiles - this.config.startLength - 3, 1);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(this.config.tiles - i - 3, 1));
				}
			} break;

			case 7: {
				this.color = Constants.TAN;
				this.direction = Constants.UP;
				this.head = new Vector2(this.config.tiles - 2, this.config.tiles - this.config.startLength - 3);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(this.config.tiles - 2, this.config.tiles - i - 3));
				}
			} break;

			case 8: {
				this.color = Constants.BROWN;
				this.direction = Constants.RIGHT;
				this.head = new Vector2(this.config.startLength + 2, this.config.tiles - 2);

				for (let i = 0; i < this.config.startLength; ++i) {
					this.body.unshift(new Vector2(i + 2, this.config.tiles - 2));
				}
			} break;
		}
	}

	getColor() {
		return this.color;
	}

	setDirection(newDirection) {
		if (!this.lockDirection) {
			if (
				(this.direction == Constants.LEFT && newDirection != Constants.RIGHT) ||
				(this.direction == Constants.UP && newDirection != Constants.DOWN) ||
				(this.direction == Constants.RIGHT && newDirection != Constants.LEFT) ||
				(this.direction == Constants.DOWN && newDirection != Constants.UP)
			) {
				// TODO: save directions in a message queue
				this.direction = newDirection;
				this.lockDirection = true;
			}
		}
	}

	getName() {
		return this.name;
	}

	setName(name) {
		this.name = name;
	}

	applyBodyToField(field) {
		for (let i = 0; i < this.body.length; ++i) {
			field.setIndex(this.body[i].x, this.body[i].y, Constants.GREEN, this.index);
		}
	}

	applyHeadToField(field) {
		field.setIndex(this.head.x, this.head.y, this.color, this.index);
	}

	collide(field) {
		if (!this.dead) {
			if (this.collideWall(this.head.x, this.head.y)) {
				this.dead = true;

				console.log('Player ' + this.index + ' is dead (wall)');
			}

			else if (this.collideSnake(this.head.x, this.head.y)) {
				this.dead = true;

				console.log('Player ' + this.index + ' is dead (own snake)');
			}

			else if (field.collideSnake(this.head.x, this.head.y, this.index)) {
				this.dead = true;

				console.log('Player ' + this.index + ' is dead (foreign snake)');
			}
		}
	}

	collideWall(x, y) {
		if (this.config.walls) {
			if (x === this.config.tiles - 1 || x === 0 || y === this.config.tiles - 1 || y === 0) {
				return true;
			}
		}

		return false;
	}

	collideSnake(x, y) {
		for (let i = 0; i < this.body.length; ++i) {
			if (this.body[i].x === x && this.body[i].y === y) {
				return true;
			}
		}

		return false;
	}

	move() {
		if (!this.dead) {
			let directionVector = new Vector2();

			if (this.direction === Constants.LEFT) {
				directionVector.x--;
			} else if (this.direction === Constants.UP) {
				directionVector.y--;
			} else if (this.direction === Constants.RIGHT) {
				directionVector.x++;
			} else if (this.direction === Constants.DOWN) {
				directionVector.y++;
			}

			this.lockDirection = false;
			this.growthSteps++;

			if (this.config.growth === 0 || this.growthSteps < this.config.growth) {
				this.body.pop();
			} else {
				this.growthSteps = 0;
			}

			this.body.unshift(new Vector2(this.head.x, this.head.y));
			this.head.add(directionVector);

			if (!this.config.walls) {
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

module.exports = Player;