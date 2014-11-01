SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

exports.make_axes = make_axes = (dims) ->
  [left, right] = [-dims.offset_x, dims.width - dims.offset_x]
  [bottom, top] = [-dims.height + dims.offset_y, dims.offset_y]

  [left, right] = [left + 2, right - 2]
  [bottom, top] = [bottom + 2, top - 2]

  x_axis = Path().moveto left, 0
  x_axis = x_axis.lineto right, 0
  x_axis = SVG.util.arrow x_axis, {
    tip: (new Point right, 0),
    length: 8, angle: 20, direction: 0
  }
  x_axis = SVG.util.arrow x_axis, {
    tip: (new Point left, 0),
    length: 8, angle: 20, direction: 180
  }

  y_axis = Path().moveto 0, bottom
  y_axis = y_axis.lineto 0, top
  y_axis = SVG.util.arrow y_axis, {
    tip: (new Point 0, top),
    length: 8, angle: 20, direction: 90
  }
  y_axis = SVG.util.arrow y_axis, {
    tip: (new Point 0, bottom),
    length: 8, angle: 20, direction: 270
  }

  return SVG.g {}, [
    SVG.path {
      d: x_axis.print(), stroke: 'black',
      opacity: 0.4
    }
    SVG.path {
      d: y_axis.print(), stroke: 'black',
      opacity: 0.4
    }
  ]

class BaseLevel
  REQUIRED_PROPS = [
    'dims', 'generate', 'evaluate', 'allowed_tools', 'input_shape',
  ]

  constructor: (opts) ->
    @params = null
    @_render_hooks = {}
    @entities = {} # TODO: make private
    for prop in REQUIRED_PROPS
      if not prop of opts
        throw new Error "Level is missing property #{prop}!"
    for k, v of opts
      @[k] = v


  set_render_hook: (k, hook) ->
    # hook = {render(), precedence}
    @_render_hooks[k] ?= []
    @_render_hooks[k].push hook
  remove_render_hook: (k, hook) ->
    old_hooks = @_render_hooks[k]
    if not old_hooks? then return

    new_hooks = []
    for h in old_hooks
      if h isnt hook
        new_hooks.push h
    @_render_hooks[k] = new_hooks
  clear_render_hooks: ->
    @_render_hooks = {}
  get_hook: (k) ->
    best_hook = null
    hooks = @_render_hooks[k] ? []
    for hook in hooks
      if best_hook? and hook.precedence <= best_hook.precedence
        continue
      best_hook = hook
    return hook


  add: (k, v) ->
    @entities[k] = v
  get: (k) ->
    return @entities[k]

  render_background: ->
    return make_axes @dims

class HookBinding
  constructor: (@level, @precedence, @hook_fn) ->
    @_val = null
    @_hook =
      precedence: @precedence
      render: =>
        @hook_fn @_val

  set: (v) ->
    # TODO: if same value, deselect?
    if @_val?
      @level.remove_render_hook @_val, @_hook
    @_val = v
    if not v? then return

    @level.set_render_hook @_val, @_hook

  get: -> @_val

exports.BaseLevel = BaseLevel
exports.HookBinding = HookBinding