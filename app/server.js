var express = require('express');
var queryAddr = require('./queryAddr.js');
var app = express();

app.use('/map', express.static(__dirname + '/web'));

//http://127.0.0.1:3000/hash/4049324494580060
app.get('/addrHash/:id', function(req, res) {
	//console.log(req.params.id);
	queryAddr.searchHash(req.params.id, function(err, data) {
		res.set('elapsed', data.elapsed + 'ms')
		res.send(data.data);
	})
});

//http://127.0.0.1:3000/search/25.114711,121.500027
app.get('/addrLatlng/:lat,:lng', function(req, res) {
	//var hashInt = geohash.encode_int(req.params.lat,req.params.lng,52);
	//hashInt = hashInt.toString().substr(0,12);
	//console.log(req.params.lat + ','+req.params.lng + ' - ' + hashInt);
	queryAddr.searchLatLng([req.params.lat,req.params.lng], function(err, data) {
		res.set('elapsed', data.elapsed + 'ms')
		res.send({data:data.data, box:data.box});
	})
});

var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});