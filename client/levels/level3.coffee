SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'
{CircleShape} = require 'input/shape_spec.coffee'

{BaseLevel} = require 'levels/base.coffee'
{TieredScorer} = require 'levels/level_util.coffee'

EPS = 0.0001
SCORER = new TieredScorer [
  0.7, 0.95, (1 - 2 * EPS)
], (1 + 2 * EPS)

exports.Level3 = new BaseLevel {
  allowed_tools: {
    locator: {
      points: (('p' + idx) for idx in [0...3])
    }
  }
  input_shape: CircleShape

  dims: {
    width: 500
    height: 500
    offset_x: 100
    offset_y: 400
  }

  param_choices:
    x: [150..350]
    y: [150..350]

  generate: (@params) ->
    {x, y} = @params
    fig = new Polygon [
      new Point 0, 0
      new Point x, 0
      new Point 0, y
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

  evaluate: (shape) ->
    fig = @entities.figure
    if not (fig.contains shape.center, {buffer: shape.radius - EPS})
      return {score: -1}

    {x, y} = @params
    opt = (x * y) / (x + y + Math.sqrt(x*x + y*y))
    return {score: SCORER.score (shape.radius / opt)}
}

