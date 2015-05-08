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
        maxUnitsWidth: 240,
        fill: 'hollow',
        doubleLine : false
    },

    onAdd: function (map) {
        this._map = map;

        this._possibleUnitsNum = [3, 5, 2, 4];
        this._possibleUnitsNumLen = this._possibleUnitsNum.length;
        this._possibleDivisions = [1, 0.5, 0.25, 0.2];
        this._possibleDivisionsLen = this._possibleDivisions.length;


        var uberContainer = L.DomUtil.create('div','uberContainer');

        var className = 'leaflet-control-scale',
            containerLegacy = L.DomUtil.create('div', className, uberContainer),
            options = this.options;

        this._addScales(options, className, containerLegacy);

        this._addScale(uberContainer, options);

        map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
        map.whenReady(this._update, this);


        return uberContainer;
    },

    onRemove: function (map) {
        map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    },

    _buildScaleDom: function() {
        var root = document.createElement('div');
        var units = document.createElement('div');
        units.className = 'units';
        root.appendChild(units);

        this._units = [];
        this._unitsLbls = [];

        for (var i = 0; i < 5; i++) {
            var unit = L.DomUtil.create('div', 'unit');
            units.appendChild(unit);
            this._units.push(unit);

            var unitLbl = L.DomUtil.create('div', 'lbl');
            unit.appendChild(unitLbl);
            this._unitsLbls.push(unit);

            var l1 = L.DomUtil.create('div', 'l1');
            unit.appendChild( l1 );

            var l2 = L.DomUtil.create('div', 'l2');
            unit.appendChild( l2 );

            l1.appendChild( L.DomUtil.create('div', 'l1inner') );
            l2.appendChild( L.DomUtil.create('div', 'l2inner') );

        }

        return root;
    },

    _addScale: function (container, options) {
        var classNames = ['leaflet-control-graphicscale'];
        if (options.fill) {
            classNames.push('fill');
            classNames.push('fill-'+options.fill);
        }
        
        this._scale = L.DomUtil.create('div', classNames.join(' '), container);
        this._scale.appendChild( this._buildScaleDom() );
    },

    _addScales: function (options, className, container) {
        
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
            this._updateScales(options, maxMeters);
            this._updateScale(dist, options);
        }


    },

    _updateScale: function(dist, options) {

        var maxMeters = dist;
        
        var scale = this._getBestScale(maxMeters, options.minUnitWidth, options.maxUnitsWidth);

        this._render(scale.unit.unitPx, scale.numUnits, scale.unit.unitMeters);

    },

    _getBestScale: function(maxMeters, minUnitWidthPx, maxUnitsWidthPx) {

        //favor full units (not 500, 25, etc)
        //favor multiples in this order: [3, 2, 5, 4]
        //units should have a minUnitWidth
        //full scale width should be below maxUnitsWidth
        //full scale width should be above minUnitsWidth ?

        var possibleUnits = this._getPossibleUnits(maxMeters, minUnitWidthPx);

        var possibleScales = this._getPossibleScales(possibleUnits, maxUnitsWidthPx);

        possibleScales.sort(function(scaleA, scaleB) {
            return scaleB.score - scaleA.score;
        });

        return possibleScales[0];
    },

    _getPossibleScales: function(possibleUnits, maxUnitsWidthPx) {
        var scales = [];
        for (var i = 0; i < this._possibleUnitsNumLen; i++) {
            var numUnits = this._possibleUnitsNum[i];
            var numUnitsScore = this._possibleUnitsNumLen-i;
            
            for (var j = 0; j < possibleUnits.length; j++) {
                var unit = possibleUnits[j];
                var totalWidthPx = unit.unitPx * numUnits;
                if (totalWidthPx < maxUnitsWidthPx) {

                    var totalWidthPxScore = 1-(maxUnitsWidthPx - totalWidthPx) / maxUnitsWidthPx;
                    totalWidthPxScore *= 3;

                    var score = unit.unitScore + numUnitsScore + totalWidthPxScore;

                    //penalty when unit / numUnits association looks weird
                    if ( 
                        unit.unitDivision === 0.25 && numUnits === 3 ||
                        unit.unitDivision === 0.5 && numUnits === 3 ||
                        unit.unitDivision === 0.25 && numUnits === 5
                        ) {
                        score -= 2;
                    }

                    scales.push({
                        unit: unit,
                        totalWidthPx: totalWidthPx,
                        numUnits: numUnits,
                        score: score
                    });
                }
            }
        }

        return scales;
    },

    _getPossibleUnits: function(maxMeters, minUnitWidthPx) {
        var exp = (Math.floor(maxMeters) + '').length;

        var unitMetersPow;
        var units = [];

        for (var i = exp; i > 0; i--) {
            unitMetersPow = Math.pow(10, i);

            for (var j = 0; j < this._possibleDivisionsLen; j++) {
                var unitMeters = unitMetersPow * this._possibleDivisions[j];
                var unitPx = this._map.getSize().x * (unitMeters/maxMeters);

                if (unitPx < minUnitWidthPx) {
                    return units;
                }

                units.push({
                    unitMeters: unitMeters, 
                    unitPx: unitPx, 
                    unitDivision: this._possibleDivisions[j],
                    unitScore: this._possibleDivisionsLen-j });

            }
        }
    },

    _render: function(unitWidthPx, unitsMultiple, unitMeters) {

        this._units = document.querySelectorAll('.leaflet-control-graphicscale .unit');
        this._unitsLbls = document.querySelectorAll('.leaflet-control-graphicscale .unit .lbl');

        var displayUnit = (unitMeters<1000) ? 'm' : 'km';
        var unitLength = unitMeters;
        if (displayUnit === 'km') unitLength /= 1000;


        for (var i = 0; i < this._units.length; i++) {
            var u = this._units[i];

            if (i < unitsMultiple) {
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

        // console.log('----')
        // console.log(num)
        // console.log(pow10)

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
