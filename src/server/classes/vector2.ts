class Vector2 {
	public x: number;
	public y: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	add(v: Vector2): void {
		this.x += v.x;
		this.y += v.y;
	}
}

export = Vector2;
