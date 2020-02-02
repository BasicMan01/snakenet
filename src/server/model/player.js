class Player {
	constructor(socketId, index, field) {
		this.socketId = socketId;
		this.index = index;
		this.field = field;

		this.snake = null;
		this.name = '';

		this.field[this.index][this.index].setId(this.index + 1);
	}

	cleanUp() {
		this.field[this.index][this.index].setId(0);
	}
}

module.exports = Player;