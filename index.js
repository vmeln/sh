var rpiDhtSensor = require('rpi-dht-sensor');
var express = require('express');
var cors = require('cors');
var MongoClient = require('mongodb').MongoClient

var dht = new rpiDhtSensor.DHT11(4);
var url = 'mongodb://localhost:27017/smart-house';

var app = express()
app.use(cors());
app.use(express.static('public'));

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
        db.collection('climate').find({}, {_id : 0, temperature: 1, humidity: 1, time: 1 }, function (err, cursor) {
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

var insertion = function () {
    var readout = dht.read();

    if (readout.temperature === 0 || readout.humidity === 0) return;

    if (readout.error) return;

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

setInterval(insertion, 60000);

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});

