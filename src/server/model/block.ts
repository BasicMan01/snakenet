class Block {
	private _id: number;
	private _bits: number;
	private _bodyBits: number;

	constructor(id: number) {
		this._id = id;
		this._bits = 0;
		this._bodyBits = 0;
	}

	reset(): void {
		this._id = 0;
		this._bits = 0;
		this._bodyBits = 0;
	}

	getValue(): number {
		return this._id;
	}

	setValue(id: number): void {
		this._id = id;
	}

	resetBit(index: number): void {
		this._bits &= ~(1 << index);
	}

	setBit(index: number): void {
		this._bits |= 1 << index;
	}

	setBodyBit(index: number): void {
		const bit = 1 << index;

		this._bits |= bit;
		this._bodyBits |= bit;
	}

	resetBodyBit(index: number): void {
		const bit = 1 << index;

		this._bits &= ~bit;
		this._bodyBits &= ~bit;
	}

	isBodyBitSet(index: number): boolean {
		return (this._bodyBits & (1 << index)) !== 0;
	}

	hasBits(): boolean {
		return this._bits !== 0;
	}

	isBitSetOnly(index: number): boolean {
		const pow2 = 1 << index;

		return (this._bits | pow2) === pow2;
	}
}

export = Block;
