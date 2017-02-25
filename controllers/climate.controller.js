var MongoClient = require('mongodb').MongoClient
var config = require('../config');
var rpiDhtSensor = require('rpi-dht-sensor');
var url = require('url');

var mongoUrl = config.mongoConnectionString;
var dht = new rpiDhtSensor.DHT11(config.dhtPort);

var climateController = function (app) {
    app.get('/climate/top', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        var readout = dht.read();
        readout.time = new Date();
        res.json(readout);
        res.end();
    })

    app.get('/climate/all', function (req, res) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var limit = parseInt(query.limit) || 100;

        res.setHeader('Content-Type', 'application/json');
        MongoClient.connect(mongoUrl, function (err, db) {
            db.collection('climate')
                .find({}, { _id: 0, temperature: 1, humidity: 1, time: 1 })
                .sort({ time: -1 })
                .limit(limit)
                .toArray(function (err, records) {
                    let sortedRecords = records.sort((a, b) => a.time - b.time);

                    res.json(sortedRecords);
                    res.end();

                    db.close();
                });
        });
    })

    app.get('/climate/:from/to/:to', function (req, res) {
        var fromTimestamp = Date.parse(req.params.from);
        var toTimestamp = Date.parse(req.params.to);

        if (isNaN(fromTimestamp) || isNaN(toTimestamp) || fromTimestamp > toTimestamp) {
            res.statusCode = 400;
            res.end();
        }

        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var limit = parseInt(query.limit) || 100;

        var from = new Date(fromTimestamp);

        var to = new Date(toTimestamp);
        to.setHours(23, 59, 59, 999);

        res.setHeader('Content-Type', 'application/json');
        MongoClient.connect(mongoUrl, function (err, db) {
            db.collection('climate')
                .find({
                    time: {
                        '$lt': to,
                        '$gt': from
                    }
                }, { _id: 0, temperature: 1, humidity: 1, time: 1 })
                .sort({ time: -1 })
                .limit(limit)
                .toArray(function (err, records) {
                    let sortedRecords = records.sort((a, b) => a.time - b.time);

                    res.json(sortedRecords);
                    res.end();

                    db.close();
                });
        });
    })
};

module.exports = climateController;