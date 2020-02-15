var Observable = require('../classes/observable.js');

class View extends Observable {
	constructor() {
		super();

		console.log('START VIEW');

		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		document.getElementById('connect').addEventListener('click', (event) => {
			let nickname = document.getElementById('nickname').value;

			this.emit('connectAction', { 'nickname' : nickname });
		});

		window.addEventListener('keydown', (event) => {
			// event.preventDefault();

			switch(event.keyCode) {
				case 37: {
					this.emit('sendDirectionAction', { 'keyCode' : 1 });
				} break;

				case 38: {
					this.emit('sendDirectionAction', { 'keyCode' : 2 });
				} break;

				case 39: {
					this.emit('sendDirectionAction', { 'keyCode' : 3 });
				} break;

				case 40: {
					this.emit('sendDirectionAction', { 'keyCode' : 4 });
				} break;
			}
		});
	}

	draw(data) {
		// TODO: send configuration from server (SN_SERVER_CONFIGURATION)
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.strokeStyle = 'white';
		this.ctx.strokeRect(0, 0, 50 * 15, 50 * 15);

		for (let i = 0; i < data.length; ++i) {
			if (data[i][2] > 0) {
				switch(data[i][2]) {
					case 1:
						this.ctx.fillStyle = 'yellow';
						break;

					case 2:
						this.ctx.fillStyle = 'orange';
						break;

					case 3:
						this.ctx.fillStyle = 'red';
						break;

					case 4:
						this.ctx.fillStyle = 'pink';
						break;

					case 5:
						this.ctx.fillStyle = 'purple';
						break;

					case 6:
						this.ctx.fillStyle = 'blue';
						break;

					case 7:
						this.ctx.fillStyle = 'tan';
						break;

					case 8:
						this.ctx.fillStyle = 'brown';
						break;

					case 10:
						this.ctx.fillStyle = 'green';
						break;

					case 11:
						this.ctx.fillStyle = 'grey';
						break;
				}

				this.ctx.strokeStyle = 'black';
				this.ctx.strokeRect(15 * data[i][1], 15 * data[i][0], 15, 15);
				this.ctx.fillRect(15 * data[i][1] + 1, 15 * data[i][0] + 1, 15 - 2, 15 - 2);
			}
		}
	}
}

module.exports = View;