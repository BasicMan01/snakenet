var Observable = require('../classes/observable.js');

class View extends Observable {
	constructor() {
		super();

		console.log('START VIEW');

		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		document.getElementById('connect').addEventListener('click', () => {
			let nickname = document.getElementById('nickname').value;

			this.emit('connectAction', {
				'nickname' : nickname }
			);
		});
	}

	draw(data) {
		console.log(data);

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
				}

				this.ctx.fillRect(20 * data[i][1], 20 * data[i][0], 20, 20);
			}
		}
	}
}

module.exports = View;