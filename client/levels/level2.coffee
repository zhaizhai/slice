SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'
{BaseLevel} = require 'levels/base.coffee'
{SquareShape} = require 'input/shape_spec.coffee'
{TieredScorer} = require 'levels/level_util.coffee'

EPS = 0.001
SCORER = new TieredScorer [
  0.7, 0.95, (1 - EPS)
], (1 + EPS)

exports.Level2 = new BaseLevel {
  allowed_tools:
    locator:
      points: (('p' + idx) for idx in [0...4])
    ruler:
      points: (('p' + idx) for idx in [0...4])

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

  evaluate: (shape) ->
    poly = shape.polygon()
    fig = @entities.figure

    if fig.intersects poly
      return {score: -1}
    for pt in fig.points()
      if poly.contains pt
        return {score: -1}

    opt = @params.w * @params.w
    return {score: SCORER.score (poly.area() / opt)}
}