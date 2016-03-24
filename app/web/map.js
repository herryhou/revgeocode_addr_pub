var map, myIcon;

function map_init() {
    map = new L.Map('map', {
        center: new L.LatLng(24.153, 120.68),
        zoom: 16
    });
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 24
    });
    var ggl = new L.Google('ROADMAP', {
        maxZoom: 24
    });
    var ggl2 = new L.Google('SATELLITE', {
        maxZoom: 24
    });
    // for all possible values and explanations see "Template Parameters" in https://msdn.microsoft.com/en-us/library/ff701716.aspx
    var imagerySet = "Aerial"; // AerialWithLabels | Birdseye | BirdseyeWithLabels | Road
    var bing = new L.BingLayer("LfO3DMI9S6GnXD7d0WGs~bq2DRVkmIAzSOFdodzZLvw~Arx8dclDxmZA0Y38tHIJlJfnMbGq5GXeYmrGOUIbS2VLFzRKCK0Yv_bAl6oe-DOc", {
        type: imagerySet
    });
    map.addLayer(ggl);
    map.addControl(new L.Control.Layers({
        'OSM': osm,
        'Google': ggl,
        'Google Terrain': ggl2,
        'bing': bing
    }, {}));
    L.control.scale().addTo(map);
    map.on('click', onMapClick);
    myIcon = L.divIcon({
        iconSize: new L.Point(10, 10),
        html: '.'
    });
    user_layer = L.layerGroup().addTo(map);
}

function showCover(vName) {
    console.log(vName);
    $.get("/villageName/" + vName.trim(), function(res) {
        //kkk = res;
        //var data = res.data;
        drawGeoJson(res.data);
        /*
        data
        data.forEach(function(value) {
            if (typeof value['FeatureCollection'] === 'object') {
                L.geoJson(value['FeatureCollection'], {
                    opacity: 0.2,
                    color: "#770077",
                    weight: 1,
                    clickable: false
                }).addTo(map);
            }
            console.log(value.key + ',' + value.value);
        });*/
    });
}

function click_village(e) {
    //console.log(e.latlng);
    //var marker = L.marker(e.latlng).addTo(map);
    var latlng = e.latlng.lat + ',' + e.latlng.lng;
    $.get("/village/" + latlng, function(res) {
        kkk = res;
        var data = res.data;
        data.forEach(function(value) {
            if (typeof value['geojson'] === 'object') {
                L.geoJson(value['geojson'], {
                    opacity: 0.2,
                    color: "#770077",
                    weight: 1,
                    clickable: true
                }).bindPopup('<b><a href="#" onclick="showCover(\'' + value.value.join(' ') + '\'); return true;">' + value.value + '</a></b></br>' + value.key).addTo(map);
            }
            console.log(value.key + ',' + value.value);
        });
    });
}

function route_bestGuessScoring(latlng, box) {
    var boxHgt = box[3] - box[1];
    var boxWid = box[2] - box[0];
    //horizontal
    if (boxWid > boxHgt) {
        var h_dis1 = latlng.lng - box[0];
        var h_dis3 = box[2] - latlng.lng;
        dis = Math.min(h_dis1, h_dis3);
        //console.log(box[4].name + ' H:' + h_dis1 + ', ' + h_dis3);
    } else { //horizontal
        var h_dis1 = latlng.lat - box[1];
        var h_dis3 = box[3] - latlng.lat;
        dis = Math.min(h_dis1, h_dis3);
        //console.log(box[4].name + ' V:' + h_dis1 + ', ' + h_dis3);
    }
    return dis * 100000.0;
}

function route_bestGuessSort(latlng, res) {
    var Score;
    var MaxScore = -1;
    var MaxScoreName = '';
    res.forEach(function(box){
        Score = route_bestGuessScoring(latlng, box);
        box[4].score = Score;
        if (Score > MaxScore) {
            MaxScore = Score;
            MaxScoreName = box[4].name;
        }
    });
    return MaxScoreName;
}

function route_draw_box(box) {
    var bounds = [
        [box[1], box[0]],
        [box[3], box[2]]
    ];
    var _rect = L.rectangle(bounds, {
        opacity: 0.2,
        color: '#ff7800',
        weight: 1
    });
    _rect.roadName = box[4].name;
    _rect.on('mouseover', function(e) {
        console.log('Over: ' + e.target.roadName)
    });
    user_layer.addLayer(_rect);
    console.log('option: ' + box[4].name + ', score: ' + box[4].score);
}

function click_route(e) {
    //console.log(e.latlng);
    //var marker = L.marker(e.latlng).addTo(map);
    var latlng = e.latlng.lat + ',' + e.latlng.lng;
    $.get("/route/" + latlng, function(res) {
        kkk = res;
        var MaxScoreName = route_bestGuessSort(e.latlng, res);
        res.forEach(function(box) {
            route_draw_box(box);
        });
        console.log('Best guess: ' + MaxScoreName);
    });
}

function onMapClick(e) {
    click_addr(e);
    //click_route(e);
    //click_village(e);
}
//讀取 IOT(運研所) geo 格式的 PTs(lng,lat,lng,lat....)
function latlngs(lnglatStr) {
    var a = lnglatStr.split(',');
    var pts = [];
    for (var i = 0; i < a.length - 1;) {
        var lng = a[i++];
        var lat = a[i++];
        pts.push(L.latLng(lat, lng));
    }
    return pts;
}

function drawIOTPolyline(pointString) {
    l = L.polyline(latlngs(pointString), {
        color: 'red',
        weight: 1
    }).addTo(map);
    map.panInsideBounds(l.getBounds());
}
//drawIOTPolyline( $('#pline').val());
$(document).ready(function() {
    map_init();
});
//
function drawRtreeBox(rect) {
    var bounds;
    if (rect.length >= 4) {
        bounds = [
            [rect[0][1], rect[0][0]],
            [rect[1][1], rect[1][0]]
        ];
    } else {
        bounds = [
            [rect[1], rect[0]],
            [rect[3], rect[2]]
        ];
    }
    L.rectangle(bounds, {
        opacity: 0.2,
        color: "#007800",
        weight: 1
    }).addTo(map);
    //map.fitBounds(bounds);
}
//s2 geoJson
//{"type":"Polygon","coordinates":[[[[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]]]]}
function drawGeoJson(data) {
    //var pts = json.coordinates;
    //drawIOTPolyline(pts.toString());
    var color = '#' + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16);
    L.geoJson(data, {
        opacity: 0.4,
        fillOpacity: 0.3,
        color: color,
        weight: 1,
        clickable: false
    }).addTo(map);
}

function click_addr(e) {
    //console.log(e.latlng);
    //var marker = L.marker(e.latlng).addTo(map);
    var latlng = e.latlng.lat + ',' + e.latlng.lng;
    $.get("http://127.0.0.1:3000/addrLatlng/" + latlng, function(res) {
        kkk = res;
        var bounds = [
            [res.box[0], res.box[1]],
            [res.box[2], res.box[3]]
        ];
        console.log(JSON.stringify(bounds));
        L.rectangle(bounds, {
            opacity: 0.2,
            color: "#ff7800",
            weight: 1
        }).addTo(map);
        console.log('total: ' + res.data.length);
        //console.log(res.box);
        res.data.forEach(function(element, index, array) {
            //var data = element.value.split(',');
            var data = element;
            var latlng = [data[1], data[2]];
            L.marker(latlng, {
                icon: myIcon,
                clickable: false,
                keyboard: false,
                title: data[0]
            }).addTo(map);
            //marker.bindPopup(element.key + '\n' + data[0]+data[1]+data[2]);
            //console.log(data[11] + ',' + data[12]);
        });
    });
}
