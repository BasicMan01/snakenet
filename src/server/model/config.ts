class Config {
	readonly player: number;
	readonly tiles: number;

	private _growth: number;
	private _interval: number;
	private _startLength: number;
	private _walls: boolean;

	constructor() {
		this.player = 8;
		this.tiles = 50;

		this._growth = 5;		//  0 -  50
		this._interval = 100;	// 30 - 500
		this._startLength = 5;	//  3 -  10
		this._walls = false;
	}

	getGrowth(): number {
		return this._growth;
	}

	setGrowth(value: number): void {
		if (value >= 0 && value <= 50) {
			this._growth = value;
		}
	}

	getInterval(): number {
		return this._interval;
	}

	setInterval(value: number): void {
		if (value >= 30 && value <= 500) {
			this._interval = value;
		}
	}

	getStartLength(): number {
		return this._startLength;
	}

	setStartLength(value: number): void {
		if (value >= 3 && value <= 10) {
			this._startLength = value;
		}
	}

	getWalls(): boolean {
		return this._walls;
	}

	setWalls(value: boolean): void {
		this._walls = value;
	}
}

export = Config;
