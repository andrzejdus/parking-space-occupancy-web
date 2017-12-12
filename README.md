[![dependencies Status](https://david-dm.org/andrzejdus/parking-space-occupancy-web/status.svg)](https://david-dm.org/andrzejdus/parking-space-occupancy-web)

# Parking Space Occupancy Sensors Web Client & Server
Web client &amp; server for parking space occupancy sensors. This is a companion app for [NodeMCU based esp8266 app](https://github.com/andrzejdus/parking-space-occupancy-nodemcu).

# Global dependecies
* node
* npm
* PostgreSQL
* Sentry (optional)

# How to run it
## Development
* make sure that `NODE_ENV` is set to `development`
```
cp .env-example .env
vim .env
npm install
npm start
```
Now you can open [http://localhost:8080](http://localhost:8080) to view the app in the browser.

## Production
* make sure that `NODE_ENV` is set to `production`
```
npm install
npm start
```
Node.js app will serve static content (from `dist` directory), respond to API endpoints and communicate with client using [socket.io](https://github.com/socketio/socket.io).

# Scripts
### `npm start`
Runs the app in the development or production mode (depending on NODE_ENV).<br>
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

In production mode only Node.JS server is started.
In development webpack, which proxies requests to node server, is started too.

### `watch`
### `build`
### `build-dev`
### `create-tables`

# Main modules
* Client - React app that shows current parking sensor status
* Server - Node.js API & web server
