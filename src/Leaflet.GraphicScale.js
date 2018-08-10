L.Control.GraphicScale = L.Control.extend({
    options: {
        position: 'bottomleft',
        updateWhenIdle: false,
        minUnitWidth: 30,
        maxUnitsWidth: 240,
        fill: false,
        showSubunits: false,
        doubleLine: false,
        labelPlacement: 'auto',
        format: "meters", //options: "feet", "meters" //HOTFIX 20180810: Options for controlling the graphics scale format.
        update: null //HOTFIX 20180810: Update function for manually updating the scale. When initially creating the graphicscale, be sure to assign it to an object. At the end of this overridden function use [thatobject]._update();
    },

    onAdd: function (map) {
        this._map = map;

        //number of units on the scale, by order of preference
        this._possibleUnitsNum = [3, 5, 2, 4];
        this._possibleUnitsNumLen = this._possibleUnitsNum.length;

        //how to divide a full unit, by order of preference
        this._possibleDivisions = [1, 0.5, 0.25, 0.2];
        this._possibleDivisionsLen = this._possibleDivisions.length;
        
        this._possibleDivisionsSub = {
            1: {
                num: 2,
                division:0.5
            },
            0.5: {
                num: 5,
                division: 0.1
            },
            0.25: {
                num: 5,
                division: 0.05
            },
            0.2: {
                num: 2,
                division: 0.1
            }
        };

        this._scaleInner = this._buildScale();
        this._scale = this._addScale(this._scaleInner);
        this._setStyle(this.options);

        map.on(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
        map.whenReady(this._update, this);

        return this._scale;
    },

    onRemove: function (map) {
        map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    },

    _addScale: function (scaleInner) {

        var scale = L.DomUtil.create('div');
        scale.className = 'leaflet-control-graphicscale';
        scale.appendChild( scaleInner );

        return scale;
    },

    _setStyle: function (options) {
        var classNames = ['leaflet-control-graphicscale-inner'];
        if (options.fill && options.fill !== 'nofill') {
            classNames.push('filled');
            classNames.push('filled-'+options.fill);
        }

        if (options.showSubunits) {
            classNames.push('showsubunits');
        }

        if (options.doubleLine) {
            classNames.push('double');
        }

        classNames.push('labelPlacement-'+options.labelPlacement);

        this._scaleInner.className = classNames.join(' ');
    },

    _buildScale: function() {
        var root = document.createElement('div');
        root.className = 'leaflet-control-graphicscale-inner';

        var subunits = L.DomUtil.create('div', 'subunits', root);
        var units = L.DomUtil.create('div', 'units', root);

        this._units = [];
        this._unitsLbls = [];
        this._subunits = [];

        for (var i = 0; i < 5; i++) {
            var unit = this._buildDivision( i%2 === 0 );
            units.appendChild(unit);
            this._units.push(unit);

            var unitLbl = this._buildDivisionLbl();
            unit.appendChild(unitLbl);
            this._unitsLbls.push(unitLbl);

            var subunit = this._buildDivision( i%2 === 1 );
            subunits.appendChild(subunit);
            this._subunits.unshift(subunit);

        }

        this._zeroLbl = L.DomUtil.create('div', 'label zeroLabel');
        this._zeroLbl.innerHTML = '0';
        this._units[0].appendChild(this._zeroLbl);

        this._subunitsLbl = L.DomUtil.create('div', 'label subunitsLabel');
        this._subunitsLbl.innerHTML = '?';
        this._subunits[4].appendChild(this._subunitsLbl);

        return root;
    },

    _buildDivision: function(fill) {
        var item = L.DomUtil.create('div', 'division');

        var l1 = L.DomUtil.create('div', 'line');
        item.appendChild( l1 );

        var l2 = L.DomUtil.create('div', 'line2');
        item.appendChild( l2 );

        if (fill)  l1.appendChild( L.DomUtil.create('div', 'fill') );
        if (!fill) l2.appendChild( L.DomUtil.create('div', 'fill') );

        return item;
    },

    _buildDivisionLbl: function() {
        var itemLbl = L.DomUtil.create('div', 'label divisionLabel');
        return itemLbl;
    },

    _update: function () {
        var bounds = this._map.getBounds();
        var centerLat = bounds.getCenter().lat;
        //length of an half world arc at current lat
        var halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180);

        //HOTFIX 20180810: Added to handle the variety of options to convert objects into.
        if (this.options.format === "feet")
            //meters to feet conversion.
            halfWorldMeters = halfWorldMeters * 3.2808399;

        //length of this arc from map left to map right
        var dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180;
        var size = this._map.getSize();

        if (size.x > 0) {
            this._updateScale(dist, this.options);
        }
    },

    _updateScale: function(maxMeters, options) {

        var scale = this._getBestScale(maxMeters, options.minUnitWidth, options.maxUnitsWidth);

        // this._render(scale.unit.unitPx, scale.numUnits, scale.unit.unitMeters);
        this._render(scale);

    },

    _getBestScale: function(maxMeters, minUnitWidthPx, maxUnitsWidthPx) {

        //favor full units (not 500, 25, etc)
        //favor multiples in this order: [3, 5, 2, 4]
        //units should have a minUnitWidth
        //full scale width should be below maxUnitsWidth
        //full scale width should be above minUnitsWidth ?

        var possibleUnits = this._getPossibleUnits( maxMeters, minUnitWidthPx, this._map.getSize().x );

        var possibleScales = this._getPossibleScales(possibleUnits, maxUnitsWidthPx);

        possibleScales.sort(function(scaleA, scaleB) {
            return scaleB.score - scaleA.score;
        });

        var scale = possibleScales[0];
        scale.subunits = this._getSubunits(scale);

        return scale;
    },

    _getSubunits: function(scale) {
        var subdivision = this._possibleDivisionsSub[scale.unit.unitDivision];

        var subunit = {};
        subunit.subunitDivision = subdivision.division;
        subunit.subunitMeters = subdivision.division * (scale.unit.unitMeters / scale.unit.unitDivision);
        subunit.subunitPx = subdivision.division * (scale.unit.unitPx / scale.unit.unitDivision);

        var subunits = {
            subunit: subunit,
            numSubunits: subdivision.num,
            total: subdivision.num * subunit.subunitMeters
        };

        return subunits;

    },

    _getPossibleScales: function(possibleUnits, maxUnitsWidthPx) {
        var scales = [];
        var minTotalWidthPx = Number.POSITIVE_INFINITY;
        var fallbackScale;

        for (var i = 0; i < this._possibleUnitsNumLen; i++) {
            var numUnits = this._possibleUnitsNum[i];
            var numUnitsScore = (this._possibleUnitsNumLen-i)*0.5;

            for (var j = 0; j < possibleUnits.length; j++) {
                var unit = possibleUnits[j];
                var totalWidthPx = unit.unitPx * numUnits;

                var scale = {
                    unit: unit,
                    totalWidthPx: totalWidthPx,
                    numUnits: numUnits,
                    score: 0
                };

                //TODO: move score calculation  to a testable method
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

                scale.score = score;



                if (totalWidthPx < maxUnitsWidthPx) {
                    scales.push(scale);
                }

                //keep a fallback scale in case totalWidthPx < maxUnitsWidthPx condition is never met
                //(happens at very high zoom levels because we dont handle submeter units yet)
                if (totalWidthPx<minTotalWidthPx) {
                    minTotalWidthPx = totalWidthPx;
                    fallbackScale = scale;
                }
            }
        }

        if (!scales.length) scales.push(fallbackScale);

        return scales;
    },

    /**
    Returns a list of possible units whose widthPx would be < minUnitWidthPx
    **/
    _getPossibleUnits: function(maxMeters, minUnitWidthPx, mapWidthPx) {
        var exp = (Math.floor(maxMeters) + '').length;

        var unitMetersPow;
        var units = [];

        for (var i = exp; i > 0; i--) {
            unitMetersPow = Math.pow(10, i);

            for (var j = 0; j < this._possibleDivisionsLen; j++) {
                var unitMeters = unitMetersPow * this._possibleDivisions[j];
                var unitPx = mapWidthPx * (unitMeters/maxMeters);

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

        return units;
    },

    _render: function(scale) {
        this._renderPart(scale.unit.unitPx, scale.unit.unitMeters, scale.numUnits, this._units, this._unitsLbls);
        this._renderPart(scale.subunits.subunit.subunitPx, scale.subunits.subunit.subunitMeters, scale.subunits.numSubunits, this._subunits);

        var subunitsDisplayUnit = this._getDisplayUnit(scale.subunits.total);
        this._subunitsLbl.innerHTML = ''+ subunitsDisplayUnit.amount + subunitsDisplayUnit.unit;
    },

    _renderPart: function(px, meters, num, divisions, divisionsLbls) {

        var displayUnit = this._getDisplayUnit(meters);

        for (var i = 0; i < this._units.length; i++) {
            var division = divisions[i];

            if (i < num) {
                division.style.width = px + 'px';
                division.className = 'division';
            } else {
                division.style.width = 0;
                division.className = 'division hidden';
            }

            if (!divisionsLbls) continue;

            var lbl = divisionsLbls[i];
            var lblClassNames = ['label', 'divisionLabel'];

            if (i < num) {
                var lblText;

                lblText = ((i + 1) * displayUnit.amount);

                //If it's a fractional number, round to the nearest tenth for display purposes.
                if (lblText % 1 !== 0)
                    lblText = lblText.toFixed(1);

                if (i === num - 1) {
                    lblText += displayUnit.unit;
                    lblClassNames.push('labelLast');
                } else {
                    lblClassNames.push('labelSub');
                }
                lbl.innerHTML = lblText;
            }

            lbl.className = lblClassNames.join(' ');

        }
    },

    _getDisplayUnit: function (units) {
        var displayUnit, amount;

        if (this.options.format === "meters") {
            if (units < 1000) {
                displayUnit = "m";
                amount = units;
            }
            else {
                displayUnit = "km";
                amount = units / 1000;
            }
        }
        else if (this.options.format === "feet") {
            //HOTFIX 20180810: feet conversion.
            if (units <= 1000) {
                displayUnit = "ft";
                //it was converted to feet earlier
                amount = units;
            }
            else {
                displayUnit = "mi";
                //Feet (though labeled meters, it was converted to feet earlier) to miles conversion.
                amount = units / 5280;
                //If it's a fractional number, round to the nearest tenth for display purposes.
                if (amount % 1 !== 0)
                    amount = amount.toFixed(1);
            }
        }
        //Handle other options here by looking for this.options.format.
        return {
            unit: displayUnit,
            amount: amount
        };
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
