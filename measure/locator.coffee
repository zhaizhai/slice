SVG = require 'svg.coffee'
{EventEmitter} = require 'events'
{HookBinding} = require 'levels/base.coffee'

class Locator extends EventEmitter
  constructor: (@level) ->
    @_selected = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'purple'
    @_hover = new HookBinding @level, 1, (pt_id) =>
      return @_make_node pt_id, 'green'
    @_highlight = new HookBinding @level, 5, (pt_id) =>
      return @_make_node pt_id, 'yellow'

  activate: ->
    for i in [0...4]
      pt_id = 'p' + i
      do (pt_id) =>
        @level.set_render_hook pt_id, {
          precedence: 0
          render: =>
            return @_make_node pt_id, 'red'
        }

  cost: 1

  icon_elt: ->
    ret = ($ '<div></div>').css {
      'background-color': 'yellow'
      width: 30
      height: 30
    }
    return ret

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

  can_measure: -> @_selected.get()?

  measure: ->
    sel = @_selected.get()
    if not sel? then return

    pt = @level.get sel
    @emit 'measurement', {
      ref: sel
      mesg: "Point at (#{pt.x}, #{pt.y})"
      mouseover: =>
        @highlight sel
      mouseout: =>
        @highlight null
    }


exports.Locator = Locator
