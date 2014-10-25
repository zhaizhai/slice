SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

class Level1
  @dims = {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

  @background = ->
    w = @dims.width - 4
    h = @dims.height - 4

    x_axis = Path().moveto (-w / 2), 0
    x_axis = x_axis.lineto (w / 2), 0
    x_axis = SVG.util.arrow x_axis, {
      tip: (new Point (w / 2), 0),
      length: 8, angle: 20, direction: 0
    }
    x_axis = SVG.util.arrow x_axis, {
      tip: (new Point (-w / 2), 0),
      length: 8, angle: 20, direction: 180
    }

    y_axis = Path().moveto 0, (-h / 2)
    y_axis = y_axis.lineto 0, (h / 2)
    y_axis = SVG.util.arrow y_axis, {
      tip: (new Point 0, (h / 2)),
      length: 8, angle: 20, direction: 90
    }
    y_axis = SVG.util.arrow y_axis, {
      tip: (new Point 0, (-h / 2)),
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

  @_make_path = (pts) ->
    d = Path().moveto pts[0]
    for pt in pts[1..]
      d = d.lineto pt
    return SVG.path {
      d: d.closepath().print()
      fill: 'blue', opacity: 0.2
    }
  @_make_nodes = (pts) ->
    ret = []
    for pt in pts
      ret.push (SVG.circle {
        cx: pt.x, cy: pt.y, r: 5, fill: 'red', stroke: 'black',
        mouseenter: (e) ->
          @setAttribute 'fill', 'green'
        mouseleave: (e) ->
          @setAttribute 'fill', 'red'
      })
    return ret

  # TODO: figure out lifecycle
  @make_figure = ({
    w
  }) ->
    @_fig = new Polygon [
      new Point w, 0
      new Point 0, w
      new Point -w, 0
      new Point 0, -w
    ]
    return {
      path: @_make_path @_fig.points()
      nodes: @_make_nodes @_fig.points()
    }

  @evaluate = (poly) ->
    if @_fig.intersects poly
      return {score: 0, err: "shape is not enclosed!"}
    for pt in @_fig.points()
      if poly.contains pt
        console.log poly.points(), 'contains', pt
        return {score: 0, err: "shape is not enclosed!"}
    return {score: poly.area()}


exports.Level1 = Level1