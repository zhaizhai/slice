SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{EventEmitter} = require 'events'
{HookBinding} = require 'levels/base.coffee'

{SELECTED_ICON, UNSELECTED_ICON} = require 'toolbox/locator_icon.coffee'

class Locator extends EventEmitter
  constructor: (@level, @level_data, @scene) ->
    @_selected = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'purple'
    @_hover = new HookBinding @level, 1, (pt_id) =>
      return @_make_node pt_id, 'green'
    @_highlight = new HookBinding @level, 5, (pt_id) =>
      return @_make_node pt_id, 'yellow'

  icons:
    selected: SELECTED_ICON
    unselected: UNSELECTED_ICON

  activate: ->
    for pt_id in @level_data.points
      do (pt_id) =>
        @level.set_render_hook pt_id, {
          precedence: 0
          render: =>
            return @_make_node pt_id, 'red'
        }

  deactivate: ->
    @_selected.set null
    @_hover.set null
    @_highlight.set null

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

  _make_node: (pt_id, color) ->
    pt = @level.get pt_id
    return SVG.circle {
      cx: pt.x, cy: pt.y, r: 6,
      fill: color, stroke: 'black'

      mouseenter: (e) =>
        @hover pt_id
      mouseleave: (e) =>
        @hover null
      click: (e) =>
        @select pt_id
    }

  measure: ->
    sel = @_selected.get()
    if not sel? then return null

    pt = @level.get sel
    return {
      ref: sel
      mesg: "Point at (#{pt.x}, #{pt.y})"
      mouseover: =>
        @highlight sel
      mouseout: =>
        @highlight null
    }


exports.Locator = Locator
