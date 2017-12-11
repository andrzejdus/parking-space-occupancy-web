# parking-space-occupancy-web
Web client &amp; server for parking space occupancy sensors. This is a companion app for [NodeMCU based esp8266 app](https://github.com/andrzejdus/parking-space-occupancy-nodemcu).

# Requirements
* node
* PostgreSQL

# How to run it
```
cp .env-example .env
vim .env
npm install
npm start
```
Now you can open [http://localhost:8080](http://localhost:8080) to view the app in the browser.

# Scripts
### `npm start`
Runs the app in the development or production mode (depending on NODE_ENV).<br>
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

In production only node server is started.
In development webpack which proxies requests to node server is started too.

### `watch`
### `build`
### `build-dev`
### `create-tables`
