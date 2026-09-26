class Config {
	readonly player: number;
	readonly tiles: number;

	private growth: number;
	private interval: number;
	private startLength: number;
	private walls: boolean;

	constructor() {
		this.player = 8;
		this.tiles = 50;

		this.growth = 5;		//  0 -  50
		this.interval = 100;	// 30 - 500
		this.startLength = 5;	//  3 -  10
		this.walls = false;
	}

	getGrowth(): number {
		return this.growth;
	}

	setGrowth(value: number): void {
		if (value >= 0 && value <= 50) {
			this.growth = value;
		}
	}

	getInterval(): number {
		return this.interval;
	}

	setInterval(value: number): void {
		if (value >= 30 && value <= 500) {
			this.interval = value;
		}
	}

	getStartLength(): number {
		return this.startLength;
	}

	setStartLength(value: number): void {
		if (value >= 3 && value <= 10) {
			this.startLength = value;
		}
	}

	getWalls(): boolean {
		return this.walls;
	}

	setWalls(value: boolean): void {
		this.walls = value;
	}
}

export = Config;
