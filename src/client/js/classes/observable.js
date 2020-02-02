class Observable {
	constructor() {
		this.callbacks = new Map();
	}

	addCallback(token, callback) {
		if (!this.callbacks.has(token)) {
			this.callbacks.set(token, callback);
		}
	}

	emit(token, args) {
		let callback = this.callbacks.get(token);

		if (typeof callback === 'function') {
			return callback(args);
		}

		return false;
	}
}

module.exports = Observable;