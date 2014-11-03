SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon, Circle} = require 'geometry.coffee'
{SquareShape} = require 'input/shape_spec.coffee'

{BaseLevel} = require 'levels/base.coffee'
{TieredScorer} = require 'levels/level_util.coffee'

EPS = 0.0001
SCORER = new TieredScorer [
  0.7, 0.95, (1 - 2 * EPS)
], (1 + 2 * EPS)

exports.Level4 = new BaseLevel {
  allowed_tools: {
    radius_finder: {
      circles: ['c1']
    }
  }
  input_shape: SquareShape

  dims: {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

  param_choices:
    r: [120..240]

  generate: (@params) ->
    {r} = @params
    @add 'c1', (new Circle (new Point 0, 0), r)

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
    hook = @get_hook 'c1'
    svg_elt = if hook?
      hook.render()
    else
      SVG.circle {
        cx: 0, cy: 0, r: @params.r, fill: 'none',
        stroke: 'black'
      }
    container.appendChild @render_background()
    container.appendChild svg_elt

  evaluate: (shape) ->
    {r} = @params
    o = new Point 0, 0
    for pt in shape.polygon().points()
      if (Point.dist o, pt) >= r + EPS
        return {score: -1}

    opt = 2 * r * r
    area = shape.polygon().area()
    return {score: SCORER.score (area / opt)}
}

