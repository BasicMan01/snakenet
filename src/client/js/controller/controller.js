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

		this.view.addCallback('connectAction', this.connectAction.bind(this));
	}

	connectAction(args) {
		this.socket = io('http://localhost:3000');

		this.socket.on('SN_SERVER_MESSAGE', function(msg){
			// TODO VALIDATION
			let data = JSON.parse(msg);

			this.view.draw(data);
		}.bind(this));

		this.socket.emit('SN_CLIENT_MESSAGE', args.nickname);
	}
}

module.exports = Controller;