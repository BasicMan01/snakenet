var io = require('socket.io-client');

var View = require('../view/view.js');

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
	}

	connectAction(args) {
		this.view.showErrorMessage('Connect...');

		this.socket = io('http://' + args.ip + ':3000', {
			reconnection: false
		});

		console.log(this.socket);

		this.socket.on('connect', function() {
			if (this.socket.connected) {
				console.log('CONNECTED');

				this.socket.emit('SN_CLIENT_NAME', args.nickname);

				this.view.showLogin(false);
			} else {
				console.log('CONNECTION FAILED');
			}
		}.bind(this));

		this.socket.on('disconnect', function() {
			this.socket.close();

			this.view.showErrorMessage('Disconnected');
			this.view.showLogin(true);
		}.bind(this));

		this.socket.on('connect_error', function(error) {
			this.socket.close();
			this.view.showErrorMessage('Connection Error');
		}.bind(this));

		this.socket.on('connect_timeout', function(timeout) {
			this.socket.close();
			this.view.showErrorMessage('Connection Timeout');
		}.bind(this));

		this.socket.on('SN_SERVER_IS_CREATOR', function(msg) {
			this.view.show('iconOptions', msg == '1');
		}.bind(this));

		this.socket.on('SN_SERVER_MESSAGE', function(msg) {
			// TODO VALIDATION
			let data = JSON.parse(msg);

			this.view.draw(data);
		}.bind(this));

		this.socket.on('SN_SERVER_CHAT_MESSAGE', function(playerName, playerColor, msg) {
			this.view.addChatMessage(playerName, playerColor, msg);
		}.bind(this));

		this.socket.on('SN_SERVER_OPTIONS', function(msg) {
			// TODO VALIDATION
			let data = JSON.parse(msg);

			this.view.setOptions(data);
		}.bind(this));
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
}

module.exports = Controller;