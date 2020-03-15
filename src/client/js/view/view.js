var Observable = require('../classes/observable.js');

class View extends Observable {
	constructor() {
		super();

		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		document.getElementById('ip').value = location.host;

		document.getElementById('iconOptions').addEventListener('click', (event) => {
			this.show('options', true);
			this.emit('loadOptionsAction');
		});

		document.getElementById('growth').addEventListener('input', function(event) {
			document.getElementById('growthValue').innerHTML = this.value;
		});

		document.getElementById('interval').addEventListener('input', function(event) {
			document.getElementById('intervalValue').innerHTML = this.value;
		});

		document.getElementById('startLength').addEventListener('input', function(event) {
			document.getElementById('startLengthValue').innerHTML = this.value;
		});

		document.getElementById('cancel').addEventListener('click', (event) => {
			this.show('options', false);
		});

		document.getElementById('connect').addEventListener('click', (event) => {
			let ip = document.getElementById('ip').value;
			let nickname = document.getElementById('nickname').value;

			this.emit('connectAction', {
				'ip': ip,
				'nickname' : nickname
			});
		});

		document.getElementById('ok').addEventListener('click', (event) => {
			this.show('options', false);
			this.emit('saveOptionsAction', {
				'growth': document.getElementById('growth').value,
				'interval' : document.getElementById('interval').value,
				'startLength' : document.getElementById('startLength').value,
				'walls' : document.getElementById('walls').checked
			});
		});

		document.getElementById('chatMessage').addEventListener('keydown', (event) => {
			let chatMessage = document.getElementById('chatMessage');

			switch(event.keyCode) {
				case 13: { // ENTER
					this.emit('sendChatMessageAction', {
						'message': chatMessage.value
					});

					chatMessage.value = '';
				} break;
			}

			event.stopPropagation();
		});

		window.addEventListener('keydown', (event) => {
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
		let countdown = data.countdown;
		let field = data.field;
		let player = data.player;

		if (countdown > 0) {
			document.getElementById('countdown').innerText = countdown;
			document.getElementById('countdown').style.display = 'block';
		} else if (countdown === 0) {
			document.getElementById('countdown').style.display = 'none';
		}

		this.clear();

		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = '#00BBBB';
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
			this.ctx.fillRect(800, 15 + i * 45, 15, 15);

			this.ctx.font = '11pt sans-serif';
			this.ctx.textAlign = 'left';
			this.ctx.fillStyle = '#00BBBB';

			this.ctx.fillText(player[i][3], 830, 28 + i * 45);
			this.ctx.fillText(player[i][2], 880, 28 + i * 45);
		}
	}

	getColorById(id) {
		switch(id) {
			case 1:		return '#FFFF00';	// yellow
			case 2:		return '#FF7700';	// orange
			case 3:		return '#FF0000';	// red
			case 4:		return '#FF0077';	// pink
			case 5:		return '#7700FF';	// purple
			case 6:		return '#0077FF';	// blue
			case 7:		return '#00FFFF';	// cyan
			case 8:		return '#00FF00';	// lime (light green)
			case 10:	return '#008000';	// green
			case 11:	return '#808080';	// grey
			case 20:	return '#808080';	// grey
		}

		return '';
	}

	addChatMessage(playerName, playerColor, message) {
		let chatMessages = document.getElementById('chatMessages');
		let li = document.createElement('li');

		li.innerText = playerName + ': ' + message;
		li.style.color = this.getColorById(playerColor);

		if (playerName !== 'SYSTEM') {
			li.style.fontWeight = 'bold';
		}

		chatMessages.appendChild(li);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	setOptions(data) {
		document.getElementById('growth').value = data.growth;
		document.getElementById('interval').value = data.interval;
		document.getElementById('startLength').value = data.startLength;
		document.getElementById('walls').checked = data.walls;

		document.getElementById('growthValue').innerHTML = data.growth;
		document.getElementById('intervalValue').innerHTML = data.interval;
		document.getElementById('startLengthValue').innerHTML = data.startLength;
	}

	showErrorMessage(message) {
		document.getElementById('errorMessage').innerText = message;
	}

	show(id, value) {
		document.getElementById(id).style.display = value ? '' : 'none';
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