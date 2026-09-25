export type Direction = 1 | 2 | 3 | 4;
export type GameStatus = 0 | 1 | 2 | 3 | 4;

export type ClientMessage = 'SN_CLIENT_DIRECTION'
	| 'SN_CLIENT_NAME'
	| 'SN_CLIENT_PAUSE'
	| 'SN_CLIENT_START'
	| 'SN_CLIENT_CHAT_MESSAGE'
	| 'SN_CLIENT_OPTIONS_LOAD'
	| 'SN_CLIENT_OPTIONS_SAVE'
	| 'SN_CLIENT_RESET_POINTS';

export type ServerMessage = 'SN_SERVER_MESSAGE'
	| 'SN_SERVER_CHAT_MESSAGE'
	| 'SN_SERVER_OPTIONS'
	| 'SN_SERVER_IS_CREATOR';

// [index, colorId, name, points]
export type PlayerTuple = [number, number, string, number];

// Game.getSocketData(), sent as a JSON string via SN_SERVER_MESSAGE
export interface GameState {
	countdown: number;
	tiles: number;
	field: number[];
	full?: boolean;
	player: PlayerTuple[];
}

// SocketMessage.sendOptions(), sent as a JSON string via SN_SERVER_OPTIONS
export interface GameOptions {
	growth: number;
	interval: number;
	startLength: number;
	walls: boolean;
}

// What the view collects from the DOM and sends via SN_CLIENT_OPTIONS_SAVE
export interface GameOptionsInput {
	growth: string;
	interval: string;
	startLength: string;
	walls: boolean;
}
