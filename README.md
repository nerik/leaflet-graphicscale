# leaflet-graphicscale
A animated graphic scale for Leaflet.js that looks sharp.

[![Image](http://nerik.github.io/leaflet-graphicscale/readme/demo.png)][1]

Demo : http://nerik.github.io/leaflet-graphicscale/demo/

## Why ?
Because scale is an important component of a map, and it is often overlooked. Leaflet does have a default scale component (http://leafletjs.com/reference.html#control-scale), but honestly it's kind of boring.

This plugin provides a more interesting alternative with more customizability.

## Usage
```
var graphicScale = L.control.graphicScale([options]).addTo(map);
```

## Options

### fill: ```false|'fill'|'hollow'|'line'```

Default: false

- false/'nofill'

![](http://nerik.github.io/leaflet-graphicscale/readme/nofill.png)

- 'fill'

![](http://nerik.github.io/leaflet-graphicscale/readme/fill.png)

- 'hollow'

![](http://nerik.github.io/leaflet-graphicscale/readme/hollow.png)

- 'line'

![](http://nerik.github.io/leaflet-graphicscale/readme/line.png)


### doubleLine: ```false|true```

Default: false

![](http://nerik.github.io/leaflet-graphicscale/readme/double.png)


### showSubunits: ```false|true```

Default: false. Show smaller divisions on the left of the zero.

![](http://nerik.github.io/leaflet-graphicscale/readme/sub.png)


### minUnitWidth: ```(Number)```

Default: 30. The minimum width of a scale unit.

### maxUnitsWidth: ```(Number)```

Default: 240. The maximum width of the scale without subunits.

### position:

See http://leafletjs.com/reference.html#control

### updateWhenIdle:

See http://leafletjs.com/reference.html#control-scale

[1]: http://nerik.github.io/leaflet-graphicscale/demo/
