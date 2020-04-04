class SocketMessage {
	constructor(io) {
		this._io = io;
	}

	_parseChatMessage(message) {
		return message.replace(/>/g, '&gt;').replace(/</g, '&lt;');
	}

	sendChatMessage(playerName, playerColor, message) {
		this._io.emit('SN_SERVER_CHAT_MESSAGE', playerName, playerColor, this._parseChatMessage(message));
	}

	sendCreatorInfo(socketId, isCreator) {
		this._io.to(socketId).emit('SN_SERVER_IS_CREATOR', isCreator ? 1 : 0);
	}

	sendGameData(data) {
		this._io.emit('SN_SERVER_MESSAGE', JSON.stringify(data));
	}

	sendOptions(socketId, data) {
		this._io.to(socketId).emit('SN_SERVER_OPTIONS', JSON.stringify(data));
	}
}

module.exports = SocketMessage;