const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const { config } = require('dotenv');

function getServerPort() {
	const result = config({ quiet: true });

	if (result.error) {
		throw new Error('.env not readable, copy .env.template to .env');
	}

	const port = parseInt(process.env.SERVER_PORT ?? '', 10);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('SERVER_PORT in .env must be an integer between 1 and 65535');
	}

	return port;
}

const serverPort = getServerPort();

module.exports = {
    entry: [
		"./src/client/js/app.js"
	],
    output: {
        path: require("path").resolve("./client"),
        filename: "./js/app.js"
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.SERVER_PORT': JSON.stringify(String(serverPort))
		}),
		new CopyPlugin({
			patterns: [
				{
					from: './src/client/index.html',
					to: './'
				},
				{
					from: './src/client/css/global.css',
					to: './css/'
				}
			]
		})
	]
}
