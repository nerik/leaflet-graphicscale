var expect = chai.expect;

var map = L.map('map').setView([48.856614, 2.352222], 8);

var gs = L.control.graphicScale().addTo(map);

describe('Leaflet.GraphicScale', function () {
    describe('#_getPossibleUnits', function() {

        var isNotEmpty = function(dist) {
            return function() {
                expect( gs._getPossibleUnits(dist, 30) ).length.to.not.be.empty();
            };
        };

        for (var i = 1; i < 2; i++) {
            console.log(i)
            var dist = Math.pow(10, i);
            console.log(dist)
            it('should return an array with at least 1 element', isNotEmpty(dist) );
        }

    });
});