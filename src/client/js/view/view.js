const Observable = require('../classes/observable.js');

class View extends Observable {
	constructor() {
		super();

		this.countdown = document.getElementById('countdown');

		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		this._tiles = 0;
		this._tileSize = 15;
		this._fieldGrid = [];
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

				case 'ArrowLeft':
				case 'a': {
					this.emit('sendDirectionAction', { 'keyCode' : 1 });
				} break;

				case 'ArrowUp':
				case 'w': {
					this.emit('sendDirectionAction', { 'keyCode' : 2 });
				} break;

				case 'ArrowRight':
				case 'd': {
					this.emit('sendDirectionAction', { 'keyCode' : 3 });
				} break;

				case 'ArrowDown':
				case 's': {
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
		return Array.from({ length: this._tiles }, () => Array(this._tiles).fill(0));
	}

	clearFieldCell(row, col) {
		this.ctx.clearRect(
			this._tileSize * col + 1,
			this._tileSize * row + 1,
			this._tileSize - 2,
			this._tileSize - 2
		);
	}

	drawFieldCell(row, col, value, fillStyle) {
		if (value <= 0) {
			return fillStyle;
		}

		const color = this._colorById[value] || '';

		if (color !== fillStyle) {
			this.ctx.fillStyle = color;
			fillStyle = color;
		}

		this.ctx.fillRect(
			this._tileSize * col + 1,
			this._tileSize * row + 1,
			this._tileSize - 2,
			this._tileSize - 2
		);

		return fillStyle;
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

		const full = data.full || data.tiles !== this._tiles || this._fieldGrid.length === 0;
		let fillStyle = this.ctx.fillStyle;

		if (full) {
			this._tiles = data.tiles;
			this._fieldGrid = this.createGrid();

			for (let i = 0; i < field.length; i += 2) {
				const index = field[i];
				const row = Math.floor(index / this._tiles);
				const col = index % this._tiles;

				this._fieldGrid[row][col] = field[i + 1];
			}

			this.clear();

			for (let row = 0; row < this._tiles; ++row) {
				for (let col = 0; col < this._tiles; ++col) {
					fillStyle = this.drawFieldCell(row, col, this._fieldGrid[row][col], fillStyle);
				}
			}

			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = '#00BBBB';
			this.ctx.strokeRect(0, 0, this._tiles * this._tileSize, this._tiles * this._tileSize);
		} else {
			this.ctx.clearRect(800, 0, this.canvas.width - 800, this.canvas.height);

			for (let i = 0; i < field.length; i += 2) {
				const index = field[i];
				const row = Math.floor(index / this._tiles);
				const col = index % this._tiles;

				this._fieldGrid[row][col] = field[i + 1];
				this.clearFieldCell(row, col);
				fillStyle = this.drawFieldCell(row, col, this._fieldGrid[row][col], fillStyle);
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

			this.ctx.fillRect(800, this._tileSize + i * 45, this._tileSize, this._tileSize);

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