(function() {
	'use strict';

	var map = L.map('map').setView([16.252583, -61.539917], 10);


    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{key}/{z}/{x}/{y}.png', {
        key: 'nerik.m4nlm06k',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="http://mapbox.com">Mapbox</a>'
    }).addTo(map);

	var graphicScale = L.control.graphicScale({
		// doubleLine: true,
		fill: 'line'
	}).addTo(map);

    var scaleText = L.DomUtil.create('div', 'scaleText' );
    graphicScale._container.insertBefore(scaleText, graphicScale._container.firstChild);
    scaleText.innerHTML = '<h1>Leaflet Graphic Scale</h1><p>style: <span class="choice">hollow</span>-<span class="choice">line</span>-<span class="choice">fill</span></p>';

    var styleChoices = scaleText.querySelectorAll('.choice');

    for (var i = 0; i < styleChoices.length; i++) { 
        styleChoices[i].addEventListener('click', function(e) {
            graphicScale._setStyle( e.currentTarget.innerHTML );
        });
    }
       
})();
