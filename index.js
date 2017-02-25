var rpiDhtSensor = require('rpi-dht-sensor');
var express = require('express');
var cors = require('cors');
var MongoClient = require('mongodb').MongoClient
var config = require('./config');

var climateController = require('./controllers/climate.controller');

var dht = new rpiDhtSensor.DHT11(config.dhtPort);
var url = config.mongoConnectionString;

var app = express()
app.use(cors());
app.use(express.static(__dirname + '/public'));

app.get('/interval', (req, res) => {
    res.json(config.refreshTimeout);
});

climateController(app);

var insertion = function () {
    var readout = dht.read();

    if (readout.error || readout.temperature === 0 || readout.humidity === 0) return;

    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.error(err);
        }

        db.collection('climate').insert({
            humidity: readout.humidity,
            temperature: readout.temperature,
            time: new Date()
        }, function (err) {
            if (err) {
                console.error(err);
            }

            db.close();
        });
    });
};

setInterval(insertion, config.refreshTimeout);

app.listen(config.listeningPort, function () {
    console.log(`Example app listening on port ${config.listeningPort}!`)
});

