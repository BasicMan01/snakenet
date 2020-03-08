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
		this._bits &= ~Math.pow(2, index);
	}

	setBit(index) {
		this._bits |= Math.pow(2, index);
	}

	isBitSetOnly(index) {
		let pow2 = Math.pow(2, index);

		return (this._bits | pow2) === pow2;
	}
}

module.exports = Block;