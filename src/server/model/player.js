let Vector2 = require('../classes/vector2');
let Constants = require('./constants');

class Player {
	constructor(config, socketId, index, field) {
		this.config = config;

		this.socketId = socketId;
		this.index = index;
		this.field = field;

		this.name = '';
		this.direction = Constants.RIGHT;

		this.head = new Vector2(this.config.startLength + 2, 1);
		this.dead =  false;

		for (let i = 0; i < this.config.startLength; ++i) {
			this.field[1][i + 2].setId(10);
		}

		this.field[1][this.config.startLength + 2].setId(1);
	}

	cleanUp() {
		//this.field[this.index][this.index].setId(0);
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

			this.head.add(directionVector);

			this.field[this.head.y][this.head.x].setId(1);

		}
	}

	setDirection(newDirection) {
		if (
			(this.direction == Constants.LEFT && newDirection != Constants.RIGHT) ||
			(this.direction == Constants.UP && newDirection != Constants.DOWN) ||
			(this.direction == Constants.RIGHT && newDirection != Constants.LEFT) ||
			(this.direction == Constants.DOWN && newDirection != Constants.UP)
		) {
			this.direction = newDirection;
		}
	}
}

module.exports = Player;