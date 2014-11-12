SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon, Circle} = require 'geometry.coffee'

{make_axes, DEFAULT_RENDERERS} = require 'levels/render.coffee'

class BaseLevel
  REQUIRED_PROPS = [
    'dims', 'generate', 'evaluate', 'allowed_tools',
    'input_shape',
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

  render: (container) ->
    layer_names = ['shape', 'circle', 'node']
    layers = {}
    for name in layer_names
      layers[name] = []

    ENTITY_TYPE = (ent) ->
      if ent instanceof Point
        return 'node'
      else if ent instanceof Polygon
        return 'shape'
      else if ent instanceof Circle
        return 'circle'
      # TODO
      console.log 'invalid', ent
      throw new Error "Invalid entity #{ent}"

    for k, v of @entities
      type = ENTITY_TYPE v
      hook = @get_hook k
      elt = if hook?
        hook.render()
      else
        DEFAULT_RENDERERS[type] v
      layers[type].push elt

    container.appendChild @render_background()
    for name in layer_names
      layer = SVG.g {}, layers[name]
      container.appendChild layer


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