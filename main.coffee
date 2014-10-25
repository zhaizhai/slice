SVG = require 'svg.coffee'
{Level1} = require 'level1.coffee'
{ShapeMaker} = require 'shape_maker.coffee'

render_level = (level) ->
  svg = SVG.root level.dims.width, level.dims.height
  console.log 'svg is', svg
  window.svg = svg

  xform_str = "translate(#{level.dims.offset_x}, #{level.dims.offset_y})"
  xform = SVG.g {transform: xform_str}
  svg.appendChild xform

  bg = level.background()
  xform.appendChild bg

  fig = level.make_figure({w: 100})
  window.fig = fig

  fig.path.setAttribute 'fill', 'blue'
  xform.appendChild fig.path
  for node in fig.nodes
    xform.appendChild node

  return svg

class Scene
  constructor: (@level) ->
    @svg = SVG.root @level.dims.width, @level.dims.height

    xform_str = "translate(#{@level.dims.offset_x}, #{@level.dims.offset_y}) scale(1, -1)"
    @xform = SVG.g {transform: xform_str}
    @svg.appendChild @xform

  svg_elt: -> @svg

  render: ->
    while @xform.firstChild
      @xform.removeChild @xform.firstChild
    @xform.appendChild @level.background()

    fig = @level.make_figure({w: 100})
    @xform.appendChild fig.path
    for node in fig.nodes
      @xform.appendChild node



window.onload = ->
  scene = new Scene Level1
  scene.render()
  ($ '.left-panel')[0].appendChild scene.svg_elt()

  sm = new ShapeMaker (sq) ->
    {score, err} = Level1.evaluate sq
    color = if err? then 'red' else 'green'

    d = SVG.util.make_closed_path sq.points()
    path = SVG.path {
      d: d, fill: color, opacity: 0.4
    }
    scene.xform.appendChild path

  ($ '.right-panel').append sm.elt()



