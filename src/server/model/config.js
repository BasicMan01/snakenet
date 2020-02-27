class Config {
	constructor() {
		this.player = 8;
		this.tiles = 50;

		this.growth = 0;		//  0 -  50
		this.interval = 30;		// 30 - 500
		this.startLength = 3;	//  3 -  10
		this.walls = false;
	}
}

module.exports = Config;