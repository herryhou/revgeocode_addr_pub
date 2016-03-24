var db_dir = '../db/leveldb/geoAddTC';
var levelup = require('levelup');
var db_des = levelup(db_dir);
var geohash = require('ngeohash');
var async = require('async');
var ops = {};
//var ops = {start:'臺北市', end:'臺北市\uffff'};
function get(hashkey, cb) {
    db_des.get(hashkey, function(err, value) {
        cb(err, value);
    });
}

function searchHash(hashkey, cb) {
    var COUNT_LIMIT = 200;
    var res = [];
    var ops = {
        limit: COUNT_LIMIT,
        start: hashkey,
        end: hashkey + '\xff'
    };
    var t1 = Date.now();
    db_des.createReadStream(ops).on('readable', function() {
        var data = this.read();
        if (data) {
            res.push(data);
        }
    }).on('error', function(err) {
        cb(err, null);
    }).on('close', function() {
        //console.log('Closed')
    }).on('end', function() {
        //console.log('Total: ' + cnt)
        var box = geohash.decode_bbox(hashkey);
        var t2 = Date.now();
        cb(null, {
            elapsed: t2 - t1,
            data: res,
            box: box
        });
    });
}

function searchLatLng_int(latlng, cb) {
    var COUNT_LIMIT = 200;
    var res = [];
    var t1 = Date.now();
    var hashkey = geohash.encode_int(latlng[0], latlng[1], 47);
    //var hashkey = hashInt.toString().substr(0,12);
    //console.log(req.params.lat + ','+req.params.lng + ' - ' + hashInt);
    var ops = {
        limit: COUNT_LIMIT,
        start: hashkey,
        end: hashkey + '\xff'
    };
    db_des.createReadStream(ops).on('readable', function() {
        var data = this.read();
        if (data) {
            res.push(data);
        }
    }).on('error', function(err) {
        cb(err, null);
    }).on('close', function() {
        //console.log('Closed')
    }).on('end', function() {
        //console.log('Total: ' + cnt)
        var box = geohash.decode_bbox_int(hashkey, 47);
        var t2 = Date.now();
        cb(null, {
            elapsed: t2 - t1,
            data: res,
            box: box
        });
    });
}


function makeTaskArray(items, fn, args) {
    var tasks = [];
    items.forEach(function(item) {
        tasks.push(fn(item, args));
    })
    return tasks;
}

function taskSeachDB(hashkey) {
    var COUNT_LIMIT = 5000;
    return function(callback) {
        var res = []
        var ops = {
            limit: COUNT_LIMIT,
            start: hashkey,
            end: hashkey + '\xff'
        };
        db_des.createReadStream(ops).on('readable', function() {
            var data = this.read();
            if (data) {
                var value = data.value.split(',');
                var lng = value.pop();
                var lat = value.pop();
                res.push([
                    value[0] + //臺中市
                    value[1] + //北區
                    value[2] + //錦平里
                    data.key.substr(11), //中華路二段175巷2號
                    parseFloat(lat),
                    parseFloat(lng)
                ]);
            }
        }).on('error', function(err) {
            callback(err, null);
        }).on('close', function() {}).on('end', function() {
            callback(null, res);
        });
    }
}

function getNearestPts(lat, lng, pts, maxRetrun) {
    /*
    function compareDist(pt1, pt2) {
        return Math.pow(pt1[1] - lat, 2) +
            Math.pow(pt1[2] - lng, 2) -
            Math.pow(pt2[1] - lat, 2) -
            Math.pow(pt2[2] - lng, 2);
    }*/
    function compareDist(pt1, pt2) {
        return pt1[3]-pt2[3];
    }
    pts.forEach(function(pt) {
        pt.push(Math.pow(pt[1] - lat, 2) +
            Math.pow(pt[2] - lng, 2));
    });
    pts.sort(compareDist);
    return pts.slice(0, maxRetrun);
}

function searchLatLng(latlng, cb) {
    var t1 = Date.now();
    var maxRetrun = 5;
    var hashkey = geohash.encode(latlng[0], latlng[1], 8); //大約 30＊3 公尺範圍
    var neighbors = geohash.neighbors(hashkey);
    neighbors.push(hashkey);

    async.parallel(makeTaskArray(neighbors, taskSeachDB), function(err, results) {
        var box = geohash.decode_bbox(hashkey);
        //flattern array
        results = results.reduce(function(a, b) {
            return a.concat(b);
        });
        var pts = getNearestPts(latlng[0], latlng[1], results, maxRetrun);
        //

        cb(null, {
            elapsed: Date.now() - t1,
            data: pts,
            box: box
        });
    });
}

module.exports = {
    get: get,
    searchHash: searchHash,
    searchLatLng: searchLatLng,
    searchLatLng_int: searchLatLng_int
}