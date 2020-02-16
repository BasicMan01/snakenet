class Block {
	constructor(id) {
		this.id = id;
		this.bits = 0;
	}

	reset() {
		this.id = 0;
		this.bits = 0;
	}

	getValue() {
		return this.id;
	}

	setValue(id) {
		this.id = id;
	}

	setBit(index) {
		this.bits |= Math.pow(2, index);
	}

	isBitSetOnly(index) {
		let pow2 = Math.pow(2, index);

		return (this.bits | pow2) === pow2;
	}
}

module.exports = Block;