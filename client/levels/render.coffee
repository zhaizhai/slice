SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon, Circle} = require 'geometry.coffee'

exports.make_axes = make_axes = (dims) ->
  [left, right] = [-dims.offset_x, dims.width - dims.offset_x]
  [bottom, top] = [-dims.height + dims.offset_y, dims.offset_y]

  [left, right] = [left + 2, right - 2]
  [bottom, top] = [bottom + 2, top - 2]

  x_axis = Path().moveto left, 0
  x_axis = x_axis.lineto right, 0
  x_axis = SVG.util.arrow x_axis, {
    tip: (new Point right, 0),
    length: 8, angle: 20, direction: 0
  }
  x_axis = SVG.util.arrow x_axis, {
    tip: (new Point left, 0),
    length: 8, angle: 20, direction: 180
  }

  y_axis = Path().moveto 0, bottom
  y_axis = y_axis.lineto 0, top
  y_axis = SVG.util.arrow y_axis, {
    tip: (new Point 0, top),
    length: 8, angle: 20, direction: 90
  }
  y_axis = SVG.util.arrow y_axis, {
    tip: (new Point 0, bottom),
    length: 8, angle: 20, direction: 270
  }

  return SVG.g {}, [
    SVG.path {
      d: x_axis.print(), stroke: 'black',
      opacity: 0.4
    }
    SVG.path {
      d: y_axis.print(), stroke: 'black',
      opacity: 0.4
    }
  ]

exports.DEFAULT_RENDERERS =
  node: (pt) ->
    return SVG.circle {
      cx: pt.x, cy: pt.y, r: 5
      fill: 'red', stroke: 'black'
    }
  shape: (poly) ->
    d = SVG.util.make_closed_path poly.points()
    return SVG.path {
      d: d, fill: 'blue', opacity: 0.2
    }
  circle: (circ) ->
    return SVG.circle {
      cx: circ.center.x, cy: circ.center.y
      r: circ.radius
      fill: 'none', stroke: 'black'
    }
