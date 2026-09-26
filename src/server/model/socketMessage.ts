import { Server } from 'socket.io';
import { GameOptions, GameState } from '../../types/protocol';

class SocketMessage {
	private io: Server;

	constructor(io: Server) {
		this.io = io;
	}

	private parseChatMessage(message: string): string {
		return message.replace(/>/g, '&gt;').replace(/</g, '&lt;');
	}

	sendChatMessage(playerName: string, playerColor: number, message: string): void {
		this.io.emit('SN_SERVER_CHAT_MESSAGE', playerName, playerColor, this.parseChatMessage(message));
	}

	sendCreatorInfo(socketId: string, isCreator: boolean): void {
		this.io.to(socketId).emit('SN_SERVER_IS_CREATOR', isCreator ? 1 : 0);
	}

	sendGameData(data: GameState): void {
		this.io.emit('SN_SERVER_MESSAGE', JSON.stringify(data));
	}

	sendOptions(socketId: string, data: GameOptions): void {
		this.io.to(socketId).emit('SN_SERVER_OPTIONS', JSON.stringify(data));
	}
}

export = SocketMessage;
