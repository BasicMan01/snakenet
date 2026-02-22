const io = require('socket.io-client');

const View = require('../view/view.js');

class Controller {
	constructor() {
		console.log('START CONTROLLER');

		this.socket = null;
		this.view = null;

		this.init();
	}

	init() {
		this.view = new View();

		this.view.showLogin(true);

		this.view.addCallback('connectAction', this.connectAction.bind(this));
		this.view.addCallback('sendDirectionAction', this.sendDirectionAction.bind(this));
		this.view.addCallback('sendPauseAction', this.sendPauseAction.bind(this));
		this.view.addCallback('sendStartAction', this.sendStartAction.bind(this));

		this.view.addCallback('sendChatMessageAction', this.sendChatMessageAction.bind(this));

		this.view.addCallback('loadOptionsAction', this.loadOptionsAction.bind(this));
		this.view.addCallback('saveOptionsAction', this.saveOptionsAction.bind(this));
		this.view.addCallback('resetPointsAction', this.resetPointsAction.bind(this));
	}

	connectAction(args) {
		this.view.showErrorMessage('Connect...');

		this.socket = io('http://' + args.ip + ':3000', {
			reconnection: false,
			transports: ['websocket']
		});

		this.socket.on('connect', () => {
			if (this.socket.connected) {
				console.log('CONNECTED');

				this.socket.emit('SN_CLIENT_NAME', args.nickname);

				this.view.showLogin(false);
			} else {
				console.log('CONNECTION FAILED');
			}
		});

		this.socket.on('disconnect', () => {
			this.socket.close();

			this.view.showErrorMessage('Disconnected');
			this.view.showLogin(true);
		});

		this.socket.on('connect_error', (error) => {
			this.socket.close();
			this.view.showErrorMessage('Connection Error');
		});

		this.socket.on('connect_timeout', (timeout) => {
			this.socket.close();
			this.view.showErrorMessage('Connection Timeout');
		});

		this.socket.on('SN_SERVER_IS_CREATOR', (msg) => {
			this.view.show('iconOptions', msg == '1');
		});

		this.socket.on('SN_SERVER_MESSAGE', (msg) => {
			// TODO VALIDATION
			const data = JSON.parse(msg);

			this.view.draw(data);
		});

		this.socket.on('SN_SERVER_CHAT_MESSAGE', (playerName, playerColor, msg) => {
			this.view.addChatMessage(playerName, playerColor, msg);
		});

		this.socket.on('SN_SERVER_OPTIONS', (msg) => {
			// TODO VALIDATION
			const data = JSON.parse(msg);

			this.view.setOptions(data);
		});
	}

	sendDirectionAction(args) {
		this.socket.emit('SN_CLIENT_DIRECTION', args.keyCode);
	}

	sendPauseAction() {
		this.socket.emit('SN_CLIENT_PAUSE', 1);
	}

	sendStartAction() {
		this.socket.emit('SN_CLIENT_START', 1);
	}

	sendChatMessageAction(args) {
		this.socket.emit('SN_CLIENT_CHAT_MESSAGE', args.message);
	}

	loadOptionsAction() {
		this.socket.emit('SN_CLIENT_OPTIONS_LOAD');
	}

	saveOptionsAction(args) {
		this.socket.emit('SN_CLIENT_OPTIONS_SAVE', JSON.stringify(args));
	}

	resetPointsAction() {
		this.socket.emit('SN_CLIENT_RESET_POINTS');
	}
}

module.exports = Controller;