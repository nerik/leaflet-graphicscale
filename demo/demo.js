(function() {
	'use strict';

	var map = L.map('map').setView([21.666043, -81.425171], 8);

	L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
	}).addTo(map);

	L.control.graphicScale().addTo(map);

})();