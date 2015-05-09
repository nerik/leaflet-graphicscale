(function() {
	'use strict';

	var map = L.map('map').setView([16.252583, -61.539917], 10);


    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{key}/{z}/{x}/{y}.png', {
        key: 'nerik.m4nlm06k',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="http://mapbox.com">Mapbox</a>'
    }).addTo(map);

	L.control.graphicScale({
		// doubleLine: true,
		fill: 'hollow'
	}).addTo(map);

})();
