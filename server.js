'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const server = new Hapi.Server();
server.connection({
    port: process.env.PORT || 8000
});

server.route({
    method: 'POST',
    path:'/measurement',
    handler: function (request, reply) {
        console.log('POST /measurement');
        console.log(request.payload);
        return reply({
            statusCode: 200,
            message: 'Measurement saved successfully.'
        });
    },
    config: {
        validate: {
            payload: {
                macAddress: Joi.string().required(),
                distance: Joi.number().required().integer(),
            }
        }
    }
});

server.route({
    method: 'POST',
    path:'/occupied',
    handler: function (request, reply) {
        console.log('POST /occupied');
        console.log(request.payload);
        return reply({
            statusCode: 200,
            message: 'Spot occupation saved successfully.'
        });
    },
    config: {
        validate: {
            payload: {
                macAddress: Joi.string().required(),
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
            statusCode: 200,
            message: 'Calibration data sent successfully.',
            data: {
                distanceHysteresis: 25,
                splitDistance: 150
            }
        });
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }

    console.log('Server running at:', server.info.uri);
});