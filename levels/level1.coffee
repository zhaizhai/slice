SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'
{BaseLevel} = require 'levels/base.coffee'
{SquareShape} = require 'input/shape_spec.coffee'

Level1Tools = {
  locator: {
    points: (('p' + idx) for idx in [0...4])
  }
  ruler: {
    points: (('p' + idx) for idx in [0...4])
  }
}

exports.Level1 = new BaseLevel {
  allowed_tools: Level1Tools
  input_shape: SquareShape

  dims: {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

  param_choices:
    w: ((100 + 2 * i) for i in [0..50])

  generate: (@params) ->
    {w} = @params
    fig = new Polygon [
      new Point w, 0
      new Point 0, w
      new Point -w, 0
      new Point 0, -w
    ]

    @add 'figure', fig
    for pt, idx in fig.points()
      @add ('p' + idx), pt

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

  evaluate: (poly) ->
    result =
      opt: @params.w * @params.w
    too_big = ->
      result.score = 0
      result.err = "shape is not enclosed!"
      return result

    fig = @entities.figure

    if fig.intersects poly
      return too_big()
    for pt in fig.points()
      if poly.contains pt
        return too_big()

    result.score = poly.area()
    return result

}
