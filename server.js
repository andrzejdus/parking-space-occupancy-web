// Credits: http://nikolay.rocks/2016-01-13-connect-webpack-to-backend

const webpackServer = require('./webpackServer');
const apiServer = require('./server/apiServer');

const PORT = process.env.PORT || 8080;
const PROD = process.env.NODE_ENV === 'production';

if (PROD) {
    console.log('|---------------------------|');
    console.log('| Running production server |');
    console.log('|---------------------------|');
    apiServer(PORT);
} else {
    console.log('|----------------------------|');
    console.log('| Running DEVELOPMENT server |');
    console.log('|----------------------------|');
    apiServer(PORT - 1);
    webpackServer(PORT);
}
