SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

{make_axes, BaseLevel} = require 'levels/base.coffee'

Level1Tools = {
  locator: {
  }
}

exports.Level1 = new BaseLevel {
  allowed_tools: Level1Tools

  dims: {
    width: 500
    height: 500
    offset_x: 250
    offset_y: 250
  }

  generate: ({
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

  render_figure: ->
    d = SVG.util.make_closed_path @entities.figure.points()
    return SVG.path {
      d: d, fill: 'blue', opacity: 0.2
    }

  _get_hook: (k) ->
    best_hook = null
    hooks = @_render_hooks[k] ? []
    for hook in hooks
      if best_hook? and hook.precedence <= best_hook.precedence
        continue
      best_hook = hook
    return hook

  render_nodes: ->
    nodes = []
    for pt, idx in @entities.figure.points()
      hook = @_get_hook ('p' + idx)
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
    fig = @entities.figure

    if fig.intersects poly
      return {score: 0, err: "shape is not enclosed!"}
    for pt in fig.points()
      if poly.contains pt
        return {score: 0, err: "shape is not enclosed!"}
    return {score: poly.area()}

}
