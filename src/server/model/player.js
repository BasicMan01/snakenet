let Vector2 = require('../classes/vector2');
let Constants = require('./constants');

class Player {
	constructor(config, socketId, index) {
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
		this._head = null;
		this._body = [];

		this._initPlayerByIndex(this._index);
	}

	_initPlayerByIndex(index) {
		this._body = [];

		switch(index) {
			case 1: {
				this._color = Constants.COLOR_P1;
				this._direction = Constants.RIGHT;
				this._head = new Vector2(this._config.getStartLength() + 2, 1);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(i + 2, 1));
				}
			} break;

			case 2: {
				this._color = Constants.COLOR_P2;
				this._direction = Constants.DOWN;
				this._head = new Vector2(this._config.tiles - 2, this._config.getStartLength() + 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(this._config.tiles - 2, i + 2));
				}
			} break;

			case 3: {
				this._color = Constants.COLOR_P3;
				this._direction = Constants.LEFT;
				this._head = new Vector2(this._config.tiles - this._config.getStartLength() - 3, this._config.tiles - 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(this._config.tiles - i - 3, this._config.tiles - 2));
				}
			} break;

			case 4: {
				this._color = Constants.COLOR_P4;
				this._direction = Constants.UP;
				this._head = new Vector2(1, this._config.tiles - this._config.getStartLength() - 3);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(1, this._config.tiles - i - 3));
				}
			} break;

			case 5: {
				this._color = Constants.COLOR_P5;
				this._direction = Constants.DOWN;
				this._head = new Vector2(1, this._config.getStartLength() + 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(1, i + 2));
				}
			} break;

			case 6: {
				this._color = Constants.COLOR_P6;
				this._direction = Constants.LEFT;
				this._head = new Vector2(this._config.tiles - this._config.getStartLength() - 3, 1);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(this._config.tiles - i - 3, 1));
				}
			} break;

			case 7: {
				this._color = Constants.COLOR_P7;
				this._direction = Constants.UP;
				this._head = new Vector2(this._config.tiles - 2, this._config.tiles - this._config.getStartLength() - 3);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(this._config.tiles - 2, this._config.tiles - i - 3));
				}
			} break;

			case 8: {
				this._color = Constants.COLOR_P8;
				this._direction = Constants.RIGHT;
				this._head = new Vector2(this._config.getStartLength() + 2, this._config.tiles - 2);

				for (let i = 0; i < this._config.getStartLength(); ++i) {
					this._body.unshift(new Vector2(i + 2, this._config.tiles - 2));
				}
			} break;
		}
	}

	_collideWall(x, y) {
		if (this._config.getWalls()) {
			if (x === this._config.tiles - 1 || x === 0 || y === this._config.tiles - 1 || y === 0) {
				return true;
			}
		}

		return false;
	}

	_collideSnake(x, y) {
		for (let i = 0; i < this._body.length; ++i) {
			if (this._body[i].x === x && this._body[i].y === y) {
				return true;
			}
		}

		return false;
	}

	reset() {
		this._directionQueue = [];
		this._growthSteps = 0;
		this._dead =  false;

		this._initPlayerByIndex(this._index);
	}

	cleanUp(field) {
		for (let i = 0; i < this._body.length; ++i) {
			field.resetIndex(this._body[i].x, this._body[i].y, this._index);
		}

		field.resetIndex(this._head.x, this._head.y, this._index);
	}

	isDead() {
		return this._dead;
	}

	getColor() {
		return this._color;
	}

	setDirection(newDirection) {
		this._directionQueue.push(newDirection);
	}

	getIndex() {
		return this._index;
	}

	getName() {
		return this._name;
	}

	setName(name) {
		this._name = name;
	}

	addPoints(points) {
		this._points += points;
	}

	getPoints() {
		return this._points;
	}

	resetPoints() {
		this._points = 0;
	}

	getSocketId() {
		return this._socketId;
	}

	applyBodyToField(field) {
		for (let i = 0; i < this._body.length; ++i) {
			field.setIndex(this._body[i].x, this._body[i].y, Constants.COLOR_TAIL, this._index);
		}
	}

	applyHeadToField(field) {
		field.setIndex(this._head.x, this._head.y, this._color, this._index);
	}

	collide(field) {
		if (!this._dead) {
			if (this._collideWall(this._head.x, this._head.y)) {
				this._dead = true;

				console.log('Player ' + this._index + ' is dead (wall)');
			}

			else if (this._collideSnake(this._head.x, this._head.y)) {
				this._dead = true;

				console.log('Player ' + this._index + ' is dead (own snake)');
			}

			else if (field.collideSnake(this._head.x, this._head.y, this._index)) {
				this._dead = true;

				console.log('Player ' + this._index + ' is dead (foreign snake)');
			}
		}
	}

	move() {
		if (!this._dead) {
			let directionVector = new Vector2();
			let directionChanged = false;

			// get next direction from queue
			while (this._directionQueue.length && !directionChanged) {
				let newDirection = this._directionQueue.shift();

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
				this._body.pop();
			} else {
				this._growthSteps = 0;
			}

			this._body.unshift(new Vector2(this._head.x, this._head.y));
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

module.exports = Player;