class Config {
	constructor() {
		this.player = 8;
		this.tiles = 50;

		this._growth = 5;		//  0 -  50
		this._interval = 100;	// 30 - 500
		this._startLength = 5;	//  3 -  10
		this._walls = false;
	}

	getGrowth() {
		return this._growth;
	}

	setGrowth(value) {
		if (value >= 0 && value <= 50) {
			this._growth = value;
		}
	}

	getInterval() {
		return this._interval;
	}

	setInterval(value) {
		if (value >= 30 && value <= 500) {
			this._interval = value;
		}
	}

	getStartLength() {
		return this._startLength;
	}

	setStartLength(value) {
		if (value >= 3 && value <= 10) {
			this._startLength = value;
		}
	}

	getWalls() {
		return this._walls;
	}

	setWalls(value) {
		this._walls = (value > 0);
	}
}

module.exports = Config;