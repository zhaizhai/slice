SVG = require 'svg.coffee'
LevelLoader = require 'levels/loader.coffee'
{ShapeMaker} = require 'shape_maker.coffee'

{Locator, ToolBox} = require 'measure/locator.coffee'

class Scene
  constructor: (@level) ->
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

  animate: ({fps, duration, on_tick, on_end}) ->
    fps ?= 40

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
      @xform.appendChild on_end()
    ), duration



window.onload = ->
  Level1 = LevelLoader.load 'l1'
  scene = new Scene Level1
  locator = new Locator Level1

  scene.set_renderer locator
  scene.render()
  locator.on 'change', =>
    scene.render()

  ($ '.left-panel')[0].appendChild scene.svg_elt()

  WRONG_RED = '#f2665c'
  RIGHT_GREEN = '#12e632'

  sm = new ShapeMaker (sq) =>
    {score, err} = Level1.evaluate sq.shape
    color = if err? then WRONG_RED else RIGHT_GREEN
    disp_text = if err? then "Doesn't fit!" else "#{score}"
    text_elt = SVG.text {
      x: sq.center.x, y: sq.center.y,
      'font-family': 'sans-serif',
      'font-size': '16px', fill: 'black'
      transform: "scale(1, -1)"
      'text-anchor': 'middle'
    }
    text_elt.innerHTML = disp_text

    ease = (x) ->
      # f = (t) -> Math.exp (6 * t)
      # f = (t) ->
      #   if t < 0.8
      #     (t / 4)
      #   else
      #     0.2 + (t - 0.8) * 4
      f = (t) -> (t * t * t)
      return (f(x) - f(0)) / (f(1) - f(0))

    scene.animate {
      fps: 40, duration: 400,
      on_tick: (elapsed) =>
        d = SVG.util.make_closed_path sq.shape.points()
        return SVG.path {
          d: d, opacity: (0.1 + 0.8 * (ease elapsed)),
          fill: color, stroke: 'black'
        }
      on_end: =>
        d = SVG.util.make_closed_path sq.shape.points()
        return SVG.g {}, [
          SVG.path {
            d: d, opacity: 0.9,
            fill: color, stroke: 'black'
          }
          text_elt
        ]
    }

  tb = new ToolBox scene, {locator}, 'locator'
  ($ '.right-panel').append tb.elt()
  ($ '.right-panel').append sm.elt()



