/*
 * L.Control.Scale is used for displaying metric/imperial scale on the map.
 */

L.Control.GraphicScale = L.Control.extend({
    options: {
        position: 'bottomleft',
        maxWidth: 100,
        metric: true,
        imperial: false,
        updateWhenIdle: false,
        minUnitWidth: 30,
        maxUnitsWidth: 200
    },

    onAdd: function (map) {
        this._map = map;

        var className = 'leaflet-control-scale',
            container = L.DomUtil.create('div', className),
            options = this.options;

        this._addScales(options, className, container);

        this._tpl = L.DomUtil.get('scaleTpl').innerHTML;
        this._scale.innerHTML = this._tpl ;




        map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
        map.whenReady(this._update, this);


        return container;
    },

    onRemove: function (map) {
        map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    },

    _addScales: function (options, className, container) {
        this._scale = L.DomUtil.create('div', className + '-line', container);
        if (options.metric) {
            this._mScale = L.DomUtil.create('div', className + '-line', container);
        }
        if (options.imperial) {
            this._iScale = L.DomUtil.create('div', className + '-line', container);
        }
    },

    _update: function () {
        var bounds = this._map.getBounds(),
            centerLat = bounds.getCenter().lat,
            //length of an half world arc at current lat
            halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
            //length of this arc from map left to map right
            dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

            size = this._map.getSize(),
            options = this.options,
            maxMeters = 0;


        if (size.x > 0) {
            var scaleWidthRatio = options.maxWidth / size.x;
            maxMeters = dist * scaleWidthRatio;
        }

        this._updateScales(options, maxMeters);
        this._updateScale(dist, options);
    },

    _updateScale: function(dist, options) {
        var maxMeters = dist;
        var exp = (Math.floor(maxMeters) + '').length + 1;
        // var pow10 = Math.pow(10, (Math.floor(maxMeters) + '').length - 1);

        var unitWidthPx, unitMeters;
        for (var i = exp; i > 0; i--) {
            var meters = Math.pow(10, i);
            var r = meters/maxMeters;
            var widthPx = this._map.getSize().x * r;
            if (widthPx<options.minUnitWidth) {
                // console.log( Math.pow(10, i-1));
                break;
            }
            unitMeters = meters;
            unitWidthPx = widthPx;
        }

        var multiples = [5, 3, 2, 1];
        var unitsMultiple;
        for (var j = 0; j < multiples.length; j++) {
            var multiple = multiples[j];
            console.log(multiple)
            console.log(multiple * unitWidthPx)
            if ( (multiple * unitWidthPx) < options.maxUnitsWidth) {
                unitsMultiple = multiple;
                break;
            }
        }

        console.log('-----');
        console.log(unitsMultiple);
        console.log(unitMeters);
        console.log('-----');

        // var meters = pow10;

        // var r = meters/maxMeters;
        // var widthPx = this._map.getSize().x * r;
        // this._scale.style.width = unitWidthPx*unitsMultiple + 'px';

        this._render(unitWidthPx, unitsMultiple, unitMeters);

    },

    _render: function(unitWidthPx, unitsMultiple, unitMeters) {

        this._units = document.querySelectorAll('.leaflet-control-graphicscale .unit');
        this._unitsLbls = document.querySelectorAll('.leaflet-control-graphicscale .unit .lbl');

        var displayUnit = (unitMeters<1000) ? 'm' : 'km';
        var unitLength = unitMeters;
        if (displayUnit === 'km') unitLength /= 1000;


        for (var i = 0; i < this._units.length; i++) {
            var u = this._units[i];

            if (i <= unitsMultiple) {
                u.style.width = unitWidthPx + 'px';
                u.className = 'unit';
                var lbl = this._unitsLbls[i];
                lbl.innerHTML = ( (i+1)*unitLength );
            } else {
                u.style.width = 0;
                u.className = 'unit hidden';
            }
        }
    },

    _updateScales: function (options, maxMeters) {
        if (options.metric && maxMeters) {
            this._updateMetric(maxMeters);
        }

        if (options.imperial && maxMeters) {
            this._updateImperial(maxMeters);
        }
    },

    _updateMetric: function (maxMeters) {
        //maxMeters : how many meters can we fit in options.maxWidth
        var meters = this._getRoundNum(maxMeters);

        var r = meters / maxMeters;
        // console.log(meters);
        this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + 'px';
        this._mScale.innerHTML = meters < 1000 ? meters + ' m' : (meters / 1000) + ' KM';
    },

    _updateImperial: function (maxMeters) {
        var maxFeet = maxMeters * 3.2808399,
            scale = this._iScale,
            maxMiles, miles, feet;

        if (maxFeet > 5280) {
            maxMiles = maxFeet / 5280;
            miles = this._getRoundNum(maxMiles);

            scale.style.width = this._getScaleWidth(miles / maxMiles) + 'px';
            scale.innerHTML = miles + ' mi';

        } else {
            feet = this._getRoundNum(maxFeet);

            scale.style.width = this._getScaleWidth(feet / maxFeet) + 'px';
            scale.innerHTML = feet + ' ft';
        }
    },

    _getScaleWidth: function (ratio) {
        return Math.round(this.options.maxWidth * ratio) - 10;
    },

    _getRoundNum: function (num) {
        // console.log('----')
        // console.log(num)
        var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
            d = num / pow10;
        // console.log(pow10)
        // console.log(d)

        console.log('----')
        console.log(num)
        console.log(pow10)

        d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

        return pow10 * d;
    }
});

L.Map.mergeOptions({
    graphicScaleControl: false
});


L.Map.addInitHook(function () {
    if (this.options.graphicScaleControl) {
        this.graphicScaleControl = new L.Control.GraphicScale();
        this.addControl(this.graphicScaleControl);
    }
});


L.control.graphicScale = function (options) {
    return new L.Control.GraphicScale(options);
};
