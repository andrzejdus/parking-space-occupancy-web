'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

server.route({
    method: 'POST',
    path:'/measurement',
    handler: function (request, reply) {
        console.log(request.payload);
        return reply({
            statusCode: 201,
            message: 'Measurement saved successfully.' });
    },
    config: {
        validate: {
            payload: {
                stationId: Joi.number().required().integer().min(0),
                waveTime: Joi.number().required().integer().min(0).max(1000),
            }
        }
    }
});

server.route({
    method: 'POST',
    path:'/occupied',
    handler: function (request, reply) {
        console.log(request.payload);
        return reply({
            statusCode: 201,
            message: 'Spot occupation saved successfully.' });
    },
    config: {
        validate: {
            payload: {
                stationId: Joi.number().required().integer().min(0),
                isOccupied: Joi.boolean().required()
            }
        }
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }

    console.log('Server running at:', server.info.uri);
});