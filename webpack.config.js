const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: [
		"./src/client/js/app.js"
	],
    output: {
        path: require("path").resolve("./client"),
        filename: "./js/app.js"
	},
	plugins: [
		new CopyPlugin([
            {
				from: './src/client/index.html',
				to: './'
			}
        ])
    ]
}