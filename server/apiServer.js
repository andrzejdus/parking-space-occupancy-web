'use strict';

require('dotenv').config();

const Raven = require('raven');
Raven.config(process.env.SENTRY_DSN).install();

const Hapi = require('hapi');
const Joi = require('joi');
const Pg = require('pg');
const socketIo = require('socket.io');


module.exports = (PORT) => {
    function fetchStation(stationId) {
        return new Promise((resolve, reject) => {
            pg.query(`SELECT * FROM ${MEASUREMENTS_TABLE} WHERE station_id = '${stationId}' ORDER BY timestamp DESC LIMIT 1`)
                .then(result => {
                    if (result.rowCount > 0) {
                        const firstRow = result.rows[0];

                        resolve({
                            message: 'Station data sent successfully.',
                            data: {
                                timestamp: firstRow.timestamp,
                                isOccupied: firstRow.is_occupied,
                                distance: firstRow.distance
                            }
                        });
                    } else {
                        resolve({
                            message: `Station with id ${stationId} not found.`
                        });
                    }
                }).catch(error => {
                console.log(error);

                Raven.captureException(error);

                reject(error);
            });
        });
    }

    const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
    const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

    // TODO What future will bring us? Nobody knows, but those values may be fetched from db someday (they say so)
    const measurementInterval = 100;
    const distanceHysteresis = 20;
    const splitDistance = 150;

    console.log('Port is', PORT);
    console.log('Measurements table is', MEASUREMENTS_TABLE);
    console.log('Allowed station IDs table is', STATION_IDS_TABLE);

    const server = new Hapi.Server({ debug: { request: ['error'] } });
    server.connection({
        port: PORT
    });

    const pg = new Pg.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });

    const allowedStationIds = [];

    server.on('start', () => {
        console.log('Server running at: ', server.info.uri);

        pg.connect();

        pg.query(`SELECT * FROM ${STATION_IDS_TABLE}`).then(result => {
            for (let row of result.rows) {
                const stationId = row.station_id;
                console.log('Allowing station ID', stationId);
                allowedStationIds.push(stationId);
            }
        }).catch(error => {
            console.log('Cannot get allowed station IDs from database, error', error);
            Raven.captureException(error)
        });

    });

    server.on('stop', () => {
        console.log('Stopping server');
        pg.end().catch(error => console.log('Error closing connection', error));
    });

    server.route({
        method: 'POST',
        path:'/measurement',
        handler: (request, reply) => {
            console.log('POST /measurement');

            const payloadDecoded = request.payload;
            console.log('Payload', payloadDecoded);

            const stationId = payloadDecoded.stationId;

            if (!allowedStationIds.includes(stationId)) {
                return reply({
                    message: 'Station ID not allowed.'
                }).code(400);
            }

            const response = reply(new Promise((resolve, reject) => {
                pg.query(`INSERT INTO ${MEASUREMENTS_TABLE} VALUES(NOW(), '${stationId}', ${payloadDecoded.isOccupied}, ${payloadDecoded.distance}) RETURNING timestamp`)
                    .then(result => {
                        const timestamp = new Date(result.rows[0].timestamp).getTime();
                        console.log('Data saved in database', result, );

                        response.created(request.path + '/' + timestamp);
                        resolve({
                            message: 'Measurement saved successfully.'
                        });
                    }).catch(error => {
                        console.log('Error saving data in database: ' + error);

                        Raven.captureException(error);

                        reject({
                            message: 'Measurement save failed, error: ' + error
                        });
                    });
            }));

            return response;
        },
        config: {
            validate: {
                payload: {
                    stationId: Joi.string().required(),
                    distance: Joi.number().required(),
                    isOccupied: Joi.boolean().required()
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path:'/calibration',
        handler: function (request, reply) {
            console.log('GET /calibration');

            return reply({
                message: 'Calibration data sent successfully.',
                data: {
                    measurementInterval: measurementInterval,
                    distanceHysteresis: distanceHysteresis,
                    splitDistance: splitDistance
                }
            });
        }
    });

    server.register(require('inert'), (error) => {
        if (error) {
            console.log(error);
            return;
        }

        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: (request, reply) => {
                console.log('GET /{param*}');

                const requestFile = request.path.split('/').pop();
                const isDirectory = requestFile.length == 0 || !requestFile.includes('.');
                const fullFilesystemPath = 'dist/' + (isDirectory ? 'index.html' : requestFile );

                console.log(`Sending file ${fullFilesystemPath}`);
                return reply.file(fullFilesystemPath);
            }
        });
    });

    const io = socketIo(server.listener);


    let currentStation;
    let isPooling = false;
    function startPooling() {
        if (isPooling) {
            return;
        }

        isPooling = true;
        poolStation();
    }

    function stopPooling() {
        isPooling = false;
    }

    function poolStation() {
        if (!isPooling) {
            return;
        }

        fetchStation('18fe34dea74c').then((station) => {
            currentStation = station;

            setTimeout(poolStation, 500);
        });
    }

    io.on('connection', socket => {
        startPooling();

        let lastEmitTimestamp;
        const emitStation = () => {
            let timestamp = currentStation && currentStation.data.timestamp.getTime();
            if (lastEmitTimestamp != timestamp) {
                socket.emit('station', currentStation);
                lastEmitTimestamp = timestamp;
            }

            if (socket.connected) {
                setTimeout(emitStation, 500);
            }
        };

        socket.on('disconnect', reason => {
            if (io.engine.clientsCount == 0) {
                stopPooling();
            }
        });

        setTimeout(emitStation, 0);
    });

    server.start();
};
