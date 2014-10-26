SVG = require 'svg.coffee'
{Level1} = require 'level1.coffee'
{ShapeMaker} = require 'shape_maker.coffee'

{Locator, ToolBox} = require 'measure/locator.coffee'

class Scene
  constructor: (@level) ->
    @level.generate {w: 100}
    @svg = SVG.root @level.dims.width, @level.dims.height

    xform_str = "translate(#{@level.dims.offset_x}, #{@level.dims.offset_y}) scale(1, -1)"
    @xform = SVG.g {transform: xform_str}
    @svg.appendChild @xform

    @_default_renderer =
      render: (container) =>
        container.appendChild @level.background()
        container.appendChild @level.render_figure()
        container.appendChild @level.render_nodes()
    @_renderer = @_default_renderer

  svg_elt: -> @svg

  set_renderer: (@_renderer) ->

  render: ->
    while @xform.firstChild
      @xform.removeChild @xform.firstChild
    @_renderer.render @xform

  animate: (fps, duration, on_tick) ->
    tick = 1000 / fps
    start = (new Date).valueOf()

    interval_id = setInterval (=>
      now = (new Date).valueOf()
      elapsed = (now - start) / duration
      @render()
      elt = on_tick elapsed
      @xform.appendChild elt
    ), tick

    setTimeout (=>
      clearInterval interval_id
    ), duration



window.onload = ->
  scene = new Scene Level1
  locator = new Locator Level1

  scene.set_renderer locator
  scene.render()
  locator.on 'change', =>
    scene.render()

  ($ '.left-panel')[0].appendChild scene.svg_elt()

  sm = new ShapeMaker (sq) =>
    {score, err} = Level1.evaluate sq
    color = if err? then 'red' else 'green'

    ease = (x) ->
      # f = (t) -> Math.exp (6 * t)
      # f = (t) ->
      #   if t < 0.8
      #     (t / 4)
      #   else
      #     0.2 + (t - 0.8) * 4
      f = (t) -> (t * t * t)
      return (f(x) - f(0)) / (f(1) - f(0))

    scene.animate 40, 400, (elapsed) =>
      d = SVG.util.make_closed_path sq.points()
      path = SVG.path {
        d: d, opacity: (0.1 + 0.8 * (ease elapsed)),
        fill: color
      }

  tb = new ToolBox scene, {locator}, 'locator'
  ($ '.right-panel').append tb.elt()
  ($ '.right-panel').append sm.elt()



