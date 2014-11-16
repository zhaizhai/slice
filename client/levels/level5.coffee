{Point, Polygon} = require 'geometry.coffee'
{CircleShape} = require 'input/shape_spec.coffee'

{BaseLevel} = require 'levels/base.coffee'
{TieredScorer} = require 'levels/level_util.coffee'

EPS = 0.0001
SCORER = new TieredScorer [
  0.7, 0.95, (1 - 2 * EPS)
], (1 + 2 * EPS)

exports.Level5 = new BaseLevel {
  allowed_tools:
    locator:
      points: ['A', 'B', 'C', 'D']
    ruler:
      points: ['A', 'B', 'C', 'D']
  input_shape: CircleShape

  dims: {
    width: 500
    height: 500
    offset_x: 100
    offset_y: 400
  }

  param_choices:
    h: [150..300]
    w1: [250..350]
    w2: [150..250]

  generate: (@params) ->
    {h, w1, w2} = @params
    A = @add 'A', (new Point 0, 0)
    B = @add 'B', (new Point w1, 0)
    C = @add 'C', (new Point w2, h)
    D = @add 'D', (new Point 0, h)

    r = w1 / (w1 + w2)
    X = new Point (r * w2), (r * h)

    @add 'lower', new Polygon [A, B, X]
    @add 'upper', new Polygon [X, C, D]

  evaluate: (shape) ->
    lower_contains = (@entities.lower.contains shape.center, {buffer: shape.radius - EPS})
    upper_contains = (@entities.upper.contains shape.center, {buffer: shape.radius - EPS})
    if not lower_contains and not upper_contains
      return {score: -1}

    {h, w1, w2} = @params
    [a, b, c] = [
      (w1 + w2), (new Point w1, h).length(), (new Point w2, h).length()
    ]
    opt = w1 / (w1 + w2) * (a * h) / (a + b + c)
    return {score: SCORER.score (shape.radius / opt)}
}

