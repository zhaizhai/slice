SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{EventEmitter} = require 'events'
{HookBinding} = require 'levels/base.coffee'

{ToolGraphics} = require 'toolbox/graphics.coffee'
{SELECTED_ICON, UNSELECTED_ICON} = require 'toolbox/radius_finder_icon.coffee'

class RadiusFinder extends EventEmitter
  constructor: (@level, @level_data, @scene) ->
    @_selected = new HookBinding @level, 3, (circ_id) =>
      return @_make_circ circ_id, 'selected' # TODO
    @_hover = new HookBinding @level, 1, (circ_id) =>
      return @_make_circ circ_id, 'hover' # TODO
    @_gfx = new ToolGraphics @level

  icons:
    selected: SELECTED_ICON
    unselected: UNSELECTED_ICON

  activate: ->
    for circ_id in @level_data.circles
      console.log 'circ', circ_id
      do (circ_id) =>
        @level.set_render_hook circ_id, {
          precedence: 0
          render: =>
            return @_make_circ circ_id, 'default'
        }

  deactivate: ->
    @_selected.set null
    @_hover.set null

  cost: 1

  select: (id) ->
    if @_selected.get() is id
      @_selected.set null
    else
      @_selected.set id
    @emit 'change'
  hover: (id) ->
    @_hover.set id
    @emit 'change'

  highlight: (id) ->
    @_highlight.set id
    @emit 'change'

  _make_circ: (circ_id, status) ->
    return @_gfx.make_circle circ_id, {
      status: status
      mouseenter: (e) =>
        @hover circ_id
      mouseleave: (e) =>
        @hover null
      click: (e) =>
        @select circ_id
    }

  measure: ->
    sel = @_selected.get()
    if not sel? then return null

    circ = @level.get sel
    return {
      ref: circ
      mesg: "Circle of radius #{circ.radius}"
      mouseover: =>
        # @highlight sel
      mouseout: =>
        # @highlight null
    }


exports.RadiusFinder = RadiusFinder
