const Observable = require('../classes/observable.js');

class View extends Observable {
	constructor() {
		super();

		this.countdown = document.getElementById('countdown');

		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		this._tiles = 50;
		this._fieldGrid = this.createGrid();
		this._colorById = new Array(21).fill('');
		this._colorById[1] = '#FFFF00';
		this._colorById[2] = '#FF7700';
		this._colorById[3] = '#FF0000';
		this._colorById[4] = '#FF0077';
		this._colorById[5] = '#7700FF';
		this._colorById[6] = '#0077FF';
		this._colorById[7] = '#00FFFF';
		this._colorById[8] = '#00FF00';
		this._colorById[10] = '#008000';
		this._colorById[11] = '#808080';
		this._colorById[20] = '#808080';

		document.getElementById('ip').value = location.host;

		document.getElementById('iconOptions').addEventListener('click', (event) => {
			this.show('options', true);
			this.emit('loadOptionsAction');
		});

		document.getElementById('growth').addEventListener('input', (event) => {
			document.getElementById('growthValue').innerHTML = event.currentTarget.value;
		});

		document.getElementById('interval').addEventListener('input', (event) => {
			document.getElementById('intervalValue').innerHTML = event.currentTarget.value;
		});

		document.getElementById('startLength').addEventListener('input', (event) => {
			document.getElementById('startLengthValue').innerHTML = event.currentTarget.value;
		});

		document.getElementById('cancel').addEventListener('click', (event) => {
			this.show('options', false);
		});

		document.getElementById('connect').addEventListener('click', (event) => {
			const ip = document.getElementById('ip').value;
			const nickname = document.getElementById('nickname').value;

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

		document.getElementById('resetPoints').addEventListener('click', (event) => {
			this.emit('resetPointsAction');
		});

		document.getElementById('chatMessage').addEventListener('keydown', (event) => {
			const chatMessage = document.getElementById('chatMessage');

			switch (event.key) {
				case 'Enter': {
					this.emit('sendChatMessageAction', {
						'message': chatMessage.value
					});

					chatMessage.value = '';
				} break;
			}

			event.stopPropagation();
		});

		window.addEventListener('keydown', (event) => {
			switch (event.key) {
				case ' ': {
					this.emit('sendStartAction');
				} break;

				case 'ArrowLeft': {
					this.emit('sendDirectionAction', { 'keyCode' : 1 });
				} break;

				case 'ArrowUp': {
					this.emit('sendDirectionAction', { 'keyCode' : 2 });
				} break;

				case 'ArrowRight': {
					this.emit('sendDirectionAction', { 'keyCode' : 3 });
				} break;

				case 'ArrowDown': {
					this.emit('sendDirectionAction', { 'keyCode' : 4 });
				} break;

				case 'p': {
					this.emit('sendPauseAction');
				} break;
			}
		});
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	createGrid() {
		const grid = [];

		for (let row = 0; row < this._tiles; ++row) {
			grid[row] = [];

			for (let col = 0; col < this._tiles; ++col) {
				grid[row][col] = 0;
			}
		}

		return grid;
	}

	draw(data) {
		const countdown = data.countdown;
		const field = data.field;
		const player = data.player;

		if (countdown > 0) {
			this.countdown.innerText = countdown;
			this.countdown.style.display = 'block';
		} else if (countdown === 0) {
			this.countdown.style.display = 'none';
		}

		if (data.full) {
			this._fieldGrid = this.createGrid();
		}

		for (let i = 0; i < field.length; ++i) {
			this._fieldGrid[field[i][0]][field[i][1]] = field[i][2];
		}

		this.clear();

		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = '#00BBBB';
		this.ctx.strokeRect(0, 0, this._tiles * 15, this._tiles * 15);

		let fillStyle = this.ctx.fillStyle;

		for (let row = 0; row < this._tiles; ++row) {
			for (let col = 0; col < this._tiles; ++col) {
				if (this._fieldGrid[row][col] > 0) {
					const color = this._colorById[this._fieldGrid[row][col]] || '';

					if (color !== fillStyle) {
						this.ctx.fillStyle = color;
						fillStyle = color;
					}

					this.ctx.strokeStyle = 'black';
					this.ctx.strokeRect(15 * col, 15 * row, 15, 15);
					this.ctx.fillRect(15 * col + 1, 15 * row + 1, 15 - 2, 15 - 2);
				}
			}
		}

		// Player List
		this.ctx.font = '11pt sans-serif';
		this.ctx.textAlign = 'left';

		for (let i = 0; i < player.length; ++i) {
			const color = this._colorById[player[i][1]] || '';

			if (color !== fillStyle) {
				this.ctx.fillStyle = color;
				fillStyle = color;
			}

			this.ctx.fillRect(800, 15 + i * 45, 15, 15);

			if ('#00BBBB' !== fillStyle) {
				this.ctx.fillStyle = '#00BBBB';
				fillStyle = '#00BBBB';
			}

			this.ctx.fillText(player[i][3], 830, 28 + i * 45);
			this.ctx.fillText(player[i][2], 880, 28 + i * 45);
		}
	}

	getColorById(id) {
		if (typeof id !== 'number') {
			return '';
		}

		return this._colorById[id] || '';
	}

	addChatMessage(playerName, playerColor, message) {
		const chatMessages = document.getElementById('chatMessages');
		const li = document.createElement('li');

		li.innerHTML = playerName + ': ' + message;
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