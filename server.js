// Credits: http://nikolay.rocks/2016-01-13-connect-webpack-to-backend

const webpackServer = require('./webpackServer');
const apiServer = require('./server/apiServer');

const PORT = process.env.PORT || 8080;
const PROD = process.env.NODE_ENV === 'prod';

if (PROD) {
    console.log('Running production server');
    apiServer(PORT);
} else {
    console.log('Running development server');
    apiServer(PORT - 1);
    webpackServer(PORT);
}
