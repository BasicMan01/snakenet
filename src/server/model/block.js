class Block {
	constructor(id) {
		this._id = id;
		this._bits = 0;
	}

	reset() {
		this._id = 0;
		this._bits = 0;
	}

	getValue() {
		return this._id;
	}

	setValue(id) {
		this._id = id;
	}

	resetBit(index) {
		this._bits &= ~(1 << index);
	}

	setBit(index) {
		this._bits |= 1 << index;
	}

	hasBits() {
		return this._bits !== 0;
	}

	isBitSetOnly(index) {
		const pow2 = 1 << index;

		return (this._bits | pow2) === pow2;
	}
}

module.exports = Block;