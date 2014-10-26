SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

{make_axes, BaseLevel} = require 'levels/base.coffee'

Level2Tools = {
  locator: {
  }
}

exports.Level2 = new BaseLevel {
  allowed_tools: Level2Tools

  dims: {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

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

  evaluate: (poly) ->
    # TODO
    fig = @entities.figure

    if fig.intersects poly
      return {score: 0, err: "shape is not enclosed!"}
    for pt in fig.points()
      if poly.contains pt
        return {score: 0, err: "shape is not enclosed!"}
    return {score: poly.area()}

}