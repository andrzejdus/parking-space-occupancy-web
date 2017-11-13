// Credits: http://nikolay.rocks/2016-01-13-connect-webpack-to-backend

const webpack = require("webpack");
const config = require("./webpack.dev.js");
const WebpackDevServer = require("webpack-dev-server");

module.exports = (PORT) => {
    // initiate the webpack-dev-server, and proxy all the requests to the api server
    const server = new WebpackDevServer(webpack(config), {
        proxy: {
            "*": `http://localhost:${PORT - 1}`
        },
        hot: true
    });

    server.listen(PORT, 'localhost');
}
