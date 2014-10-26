SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

make_axes = (w, h) ->
  w -= 4
  h -= 4

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

class Level1
  @dims = {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

  @background = ->
    return make_axes @dims.width, @dims.height

  @entities = {}
  @add = (k, v) ->
    @entities[k] = v

  @generate = ({
    w
  }) ->
    fig = new Polygon [
      new Point w, 0
      new Point 0, w
      new Point -w, 0
      new Point 0, -w
    ]

    @add 'figure', fig
    for pt, idx in fig.points()
      @add ('p' + idx), pt

  @render_figure = ->
    d = SVG.util.make_closed_path @entities.figure.points()
    return SVG.path {
      d: d, fill: 'blue', opacity: 0.2
      click: ->
        console.log 'fig click'
    }

  @render_nodes = ->
    nodes = []
    for pt in @entities.figure.points()
      nodes.push (SVG.circle {
        cx: pt.x, cy: pt.y, r: 5, fill: 'red', stroke: 'black'
      })
    return SVG.g {}, nodes

  @evaluate = (poly) ->
    fig = @entities.figure

    if fig.intersects poly
      return {score: 0, err: "shape is not enclosed!"}
    for pt in fig.points()
      if poly.contains pt
        return {score: 0, err: "shape is not enclosed!"}
    return {score: poly.area()}


exports.Level1 = Level1