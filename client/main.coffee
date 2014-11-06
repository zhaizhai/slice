SVG = require 'svg.coffee'
LevelLoader = require 'levels/loader.coffee'
{ShapeMaker} = require 'input/shape_maker.coffee'

{ToolBox, setup_tools} = require 'toolbox/toolbox.coffee'

{$ajax} = require 'http_util.coffee'

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



report_score = (stars, level_id) ->
  data =
    levelID: level_id
    stars: stars
  $ajax.post 'complete_level', data, (err, res) ->
    console.log 'complete_level:', err, res


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

  SCORE_TO_MESG =
    '-1': "Doesn't fit!"
    0: ''
    1: 'Good \u2605\u2606\u2606'
    2: 'Great! \u2605\u2605\u2606'
    3: 'Perfect! \u2605\u2605\u2605'
  sm = new ShapeMaker level.input_shape, (shape) =>
    {score} = level.evaluate shape
    report_score score, level_id # fires off $ajax.post

    color = if score is -1 then WRONG_RED else RIGHT_GREEN
    disp_text = SCORE_TO_MESG[score]

    label_pos = shape.label()
    text_elt = SVG.text {
      x: label_pos.x, y: -label_pos.y,
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


    final_color = if opt? and score >= 0.9999 * opt
      'gold'
    else
      'black'
    scene.animate_overlay {
      fps: 40, duration: 400,
      on_tick: (elapsed) =>
        return SVG.attrs shape.svg(), {
          opacity: (0.1 + 0.8 * (ease elapsed)),
          fill: color, stroke: 'black'
        }
      on_end: =>
        return SVG.g {}, [
          SVG.attrs shape.svg(), {
            opacity: 0.9,
            fill: color, stroke: final_color
          }
          text_elt
        ]
    }

  ($ '.right-panel').prepend ($ '<div class="app-title">Slice</div>')
  ($ '.right-panel').append sm.elt()



