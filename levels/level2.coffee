SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'
{BaseLevel} = require 'levels/base.coffee'
{SquareShape} = require 'input/shape_spec.coffee'

Level2Tools = {
  locator: {
    points: (('p' + idx) for idx in [0...4])
  }
  ruler: {
    points: (('p' + idx) for idx in [0...4])
  }
}

exports.Level2 = new BaseLevel {
  allowed_tools: Level2Tools
  input_shape: SquareShape

  dims: {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

  param_choices:
    w: ((100 + 2 * i) for i in [0..30])
    x: [5..50]
    y: [5..50]

  generate: (@params) ->
    {w, x, y} = @params
    fig = new Polygon [
      new Point (x + w), y
      new Point x, (y + w)
      new Point (x - w), y
      new Point x, (y - w)
    ]

    @add 'figure', fig
    for pt, idx in fig.points()
      @add ('p' + idx), pt

  # TODO: factor out some of the rendering
  render_figure: ->
    d = SVG.util.make_closed_path @entities.figure.points()
    return SVG.path {
      d: d, fill: 'blue', opacity: 0.2
    }

  render_nodes: ->
    nodes = []
    for pt, idx in @entities.figure.points()
      hook = @get_hook ('p' + idx)
      if hook?
        nodes.push hook.render()
      else
        nodes.push (SVG.circle {
          cx: pt.x, cy: pt.y, r: 5, fill: 'red', stroke: 'black'
        })
    return SVG.g {}, nodes

  render: (container) ->
    container.appendChild @render_background()
    container.appendChild @render_figure()
    container.appendChild @render_nodes()

  _score: (area) ->
    opt = @params.w * @params.w
    r = area / opt
    EPS = 0.001
    if r >= (1 + EPS)
      console.log "What?? should be impossible"
    if r >= (1 - EPS)
      return 3
    if r >= 0.95
      return 2
    if r >= 0.7
      return 1
    return 0

  evaluate: (shape) ->
    poly = shape.polygon()
    fig = @entities.figure

    if fig.intersects poly
      return {score: -1}
    for pt in fig.points()
      if poly.contains pt
        return {score: -1}
    return {score: @_score poly.area()}
}