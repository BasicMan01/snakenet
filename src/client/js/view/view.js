var Observable = require('../classes/observable.js');

class View extends Observable {
	constructor() {
		super();

		console.log('START VIEW');

		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		document.getElementById('ip').value = location.host;

		document.getElementById('connect').addEventListener('click', (event) => {
			let ip = document.getElementById('ip').value;
			let nickname = document.getElementById('nickname').value;

			this.emit('connectAction', {
				'ip': ip,
				'nickname' : nickname
			});
		});

		window.addEventListener('keydown', (event) => {
			// event.preventDefault();

			switch(event.keyCode) {
				case 32: { // SPACE
					this.emit('sendStartAction');
				} break;

				case 37: { // LEFT
					this.emit('sendDirectionAction', { 'keyCode' : 1 });
				} break;

				case 38: { // UP
					this.emit('sendDirectionAction', { 'keyCode' : 2 });
				} break;

				case 39: { // RIGHT
					this.emit('sendDirectionAction', { 'keyCode' : 3 });
				} break;

				case 40: { // DOWN
					this.emit('sendDirectionAction', { 'keyCode' : 4 });
				} break;

				case 80: { // P
					this.emit('sendPauseAction');
				} break;
			}
		});
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	draw(data) {
		let i = 0;
		let field = data.field;
		let player = data.player;

		// TODO: send configuration from server (SN_SERVER_CONFIGURATION)
		this.clear();

		this.ctx.strokeStyle = 'white';
		this.ctx.strokeRect(0, 0, 50 * 15, 50 * 15);

		for (i = 0; i < field.length; ++i) {
			if (field[i][2] > 0) {
				this.ctx.fillStyle = this.getColorById(field[i][2]);
				this.ctx.strokeStyle = 'black';
				this.ctx.strokeRect(15 * field[i][1], 15 * field[i][0], 15, 15);
				this.ctx.fillRect(15 * field[i][1] + 1, 15 * field[i][0] + 1, 15 - 2, 15 - 2);
			}
		}

		for (i = 0; i < player.length; ++i) {
			this.ctx.fillStyle = this.getColorById(player[i][1]);
			this.ctx.fillRect(800, 45 + i * 45, 15, 15);

			this.ctx.font = '11pt sans-serif';
			this.ctx.textAlign = 'left';
			this.ctx.fillStyle = 'white';

			this.ctx.fillText(player[i][3], 830, 58 + i * 45);
			this.ctx.fillText(player[i][2], 880, 58 + i * 45);
		}
	}

	getColorById(id) {
		switch(id) {
			case 1:		return 'yellow';
			case 2:		return 'orange';
			case 3:		return 'red';
			case 4:		return 'pink';
			case 5:		return 'purple';
			case 6:		return 'blue';
			case 7:		return 'tan';
			case 8:		return 'brown';
			case 10:	return 'green';
			case 11:	return 'grey';
		}

		return '';
	}

	showErrorMessage(message) {
		document.getElementById('errorMessage').innerText = message;
	}
	showLogin(value) {
		if (value) {
			this.clear();
			document.getElementById('login').style.display = '';

		} else {
			document.getElementById('login').style.display = 'none';
		}
	}
}

module.exports = View;