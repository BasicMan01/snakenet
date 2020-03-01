class Config {
	constructor() {
		this.player = 8;
		this.tiles = 50;

		this.growth = 50;		//  0 -  50
		this.interval = 40;		// 30 - 500
		this.startLength = 4;	//  3 -  10
		this.walls = false;
	}
}

module.exports = Config;