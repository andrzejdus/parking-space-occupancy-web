'use strict';

require('dotenv').config();
const Pg = require('pg');

const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

const pg = new Pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

pg.connect();

const measurementsTable = pg.query(`CREATE TABLE ${MEASUREMENTS_TABLE} (timestamp TIMESTAMP NOT NULL PRIMARY KEY, station_id VARCHAR(12) NOT NULL, is_occupied BOOL NOT NULL, distance INT NOT NULL)`)
    .then(result => console.log(`${MEASUREMENTS_TABLE} created`))
    .catch(error => console.log(error));


const stationIdsTable = pg.query(`CREATE TABLE ${STATION_IDS_TABLE}(station_id VARCHAR(12) NOT NULL)`)
    .then(result => console.log(`${STATION_IDS_TABLE} created`))
    .catch(error => console.log(error));

Promise.all([measurementsTable, stationIdsTable]).then(values => pg.end());