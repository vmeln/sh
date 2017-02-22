var MongoClient = require('mongodb').MongoClient
var config = require('../config');
var rpiDhtSensor = require('rpi-dht-sensor');
var url = config.mongoConnectionString;
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
        res.setHeader('Content-Type', 'application/json');
        MongoClient.connect(url, function (err, db) {
            db.collection('climate').find({}, { _id: 0, temperature: 1, humidity: 1, time: 1 }, function (err, cursor) {
                if (err == null) {
                    cursor.toArray(function (err, records) {
                        res.json(records);
                        res.end();
                    });
                }

                db.close();
            });
        });
    })
};

module.exports = climateController;