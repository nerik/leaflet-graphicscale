(function() {
	'use strict';

	var map = L.map('map').setView([48.856614, 2.352222], 8);

	L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
	}).addTo(map);

	L.control.graphicScale().addTo(map);

})();
