SVG = require 'svg.coffee'
{Level1} = require 'level1.coffee'
{ShapeMaker} = require 'shape_maker.coffee'

class Scene
  constructor: (@level) ->
    @level.generate {w: 100}
    @svg = SVG.root @level.dims.width, @level.dims.height

    xform_str = "translate(#{@level.dims.offset_x}, #{@level.dims.offset_y}) scale(1, -1)"
    @xform = SVG.g {transform: xform_str}
    @svg.appendChild @xform

  svg_elt: -> @svg

  render: ->
    while @xform.firstChild
      @xform.removeChild @xform.firstChild

    @xform.appendChild @level.background()
    @xform.appendChild @level.render_figure()
    @xform.appendChild @level.render_nodes()


window.onload = ->
  scene = new Scene Level1
  scene.render()
  ($ '.left-panel')[0].appendChild scene.svg_elt()

  sm = new ShapeMaker (sq) ->
    {score, err} = Level1.evaluate sq
    color = if err? then 'red' else 'green'

    d = SVG.util.make_closed_path sq.points()
    path = SVG.path {
      d: d, fill: color, opacity: 0.8
    }
    scene.xform.appendChild path

  ($ '.right-panel').append sm.elt()



