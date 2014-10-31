SVG = require 'svg.coffee'
LevelLoader = require 'levels/loader.coffee'

{ShapeMaker} = require 'shape_maker.coffee'
{SquareShape} = require 'shape_spec.coffee'

{ToolBox, setup_tools} = require 'toolbox/toolbox.coffee'

class Scene
  standardize_evt = (e) ->
    return {
      x: e.offsetX ? (e.clientX - $(e.target).offset().left)
      y: e.offsetY ? (e.clientY - $(e.target).offset().top)
      right: (e.which is 3)
    }

  constructor: (@level) ->
    @svg = SVG.root @level.dims.width, @level.dims.height

    xform_str = "translate(#{@level.dims.offset_x}, #{@level.dims.offset_y}) scale(1, -1)"
    @xform = SVG.g {transform: xform_str}
    @svg.appendChild @xform

    @_overlay = null
    @_mousemove_handler = null
    ($ @svg).mousemove (e) =>
      if @_mousemove_handler?
        e = (standardize_evt e)
        e.x -= @level.dims.offset_x
        e.y -= @level.dims.offset_y
        e.y = -e.y
        @_mousemove_handler e

  mousemove: (@_mousemove_handler) ->

  svg_elt: -> @svg

  render: ->
    while @xform.firstChild
      @xform.removeChild @xform.firstChild
    # @_renderer.render @xform
    @level.render @xform

    if @_overlay?
      @xform.appendChild @_overlay

  set_overlay: (@_overlay) ->
    @render()

  animate_overlay: ({fps, duration, on_tick, on_end}) ->
    fps ?= 40
    tick = 1000 / fps
    start = (new Date).valueOf()
    @_overlay = SVG.g {}

    interval_id = setInterval (=>
      now = (new Date).valueOf()
      elapsed = (now - start) / duration

      @_overlay = on_tick elapsed
      @render()
    ), tick

    setTimeout (=>
      clearInterval interval_id
      @_overlay = on_end()
      @render()
    ), duration



window.onload = ->
  level_id = window.location.hash.slice(1)
  level = LevelLoader.load level_id
  if not level?
    console.log "Hash \"#{level_id}\" does not specify a level, defaulting to l1"
    level = LevelLoader.load 'l1'

  window.level = level
  scene = new Scene level

  tb = (setup_tools level, scene).toolbox
  ($ '.right-panel').append tb.elt()

  scene.render()
  ($ '.left-panel')[0].appendChild scene.svg_elt()

  WRONG_RED = '#f2665c'
  RIGHT_GREEN = '#12e632'

  sm = new ShapeMaker SquareShape, (sq) =>
    poly = sq.polygon()

    {score, err} = level.evaluate poly
    color = if err? then WRONG_RED else RIGHT_GREEN
    disp_text = if err? then "Doesn't fit!" else "#{score}"
    text_elt = SVG.text {
      x: sq.center.x, y: -sq.center.y,
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

    scene.animate_overlay {
      fps: 40, duration: 400,
      on_tick: (elapsed) =>
        d = SVG.util.make_closed_path poly.points()
        return SVG.path {
          d: d, opacity: (0.1 + 0.8 * (ease elapsed)),
          fill: color, stroke: 'black'
        }
      on_end: =>
        d = SVG.util.make_closed_path poly.points()
        return SVG.g {}, [
          SVG.path {
            d: d, opacity: 0.9,
            fill: color, stroke: 'black'
          }
          text_elt
        ]
    }

  ($ '.right-panel').append sm.elt()



