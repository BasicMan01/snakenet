class Block {
	private id: number;
	private bits: number;
	private bodyBits: number;

	constructor(id: number) {
		this.id = id;
		this.bits = 0;
		this.bodyBits = 0;
	}

	reset(): void {
		this.id = 0;
		this.bits = 0;
		this.bodyBits = 0;
	}

	getValue(): number {
		return this.id;
	}

	setValue(id: number): void {
		this.id = id;
	}

	resetBit(index: number): void {
		this.bits &= ~(1 << index);
	}

	setBit(index: number): void {
		this.bits |= 1 << index;
	}

	setBodyBit(index: number): void {
		const bit = 1 << index;

		this.bits |= bit;
		this.bodyBits |= bit;
	}

	resetBodyBit(index: number): void {
		const bit = 1 << index;

		this.bits &= ~bit;
		this.bodyBits &= ~bit;
	}

	isBodyBitSet(index: number): boolean {
		return (this.bodyBits & (1 << index)) !== 0;
	}

	hasBits(): boolean {
		return this.bits !== 0;
	}

	isBitSetOnly(index: number): boolean {
		const pow2 = 1 << index;

		return (this.bits | pow2) === pow2;
	}
}

export = Block;
