SVG = require 'svg.coffee'
{EventEmitter} = require 'events'

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


class ToolBox
  TMPL = '''
  <div>
    <div class="tool-selection"></div>
    <button>Measure!</button>
    <div class="tool-notebook"></div>
  </div>
  '''
  constructor: ({
    @scene, @tools, default_tool,
    @ap
  }) ->
    default_tool ?= null

    @_elt = $ TMPL
    @_cur_tool = null
    @_icon_elts = {}

    sel_elt = (@_elt.find '.tool-selection')
    for name, tool of @tools
      do (name, tool) =>
        tool.on 'measurement', (@on_measure.bind @)

        icon = tool.icon_elt()
        icon.click =>
          @select name
        @_icon_elts[name] = icon
        sel_elt.append icon

    (@_elt.find 'button').click =>
      if not @_cur_tool? then return
      tool = @tools[@_cur_tool]
      if @ap < tool.cost
        console.log "not enough ap!"
        return

      @ap -= tool.cost
      tool.measure()

    @_measurements = []
    @select default_tool

  elt: -> @_elt

  select: (name) ->
    if @_cur_tool?
      @_icon_elts[@_cur_tool].css 'border', 'none'

    if @_cur_tool is name
      @_cur_tool = null
      return

    @_cur_tool = name
    @_icon_elts[name].css 'border', 'solid 1px'

    tool = @tools[name] # TODO

  # on_change: ->
  #   if not @_cur_tool? then return
  #   tool = @tools[@_cur_tool]
  #   (@_elt.find 'button').prop 'disabled', tool.can_measure()

  on_measure: (measurement) ->
    @_measurements.push measurement
    elt = $ "<div>#{measurement.mesg}</div>"
    elt.hover (-> measurement.mouseover()),
      (-> measurement.mouseout())
    (@_elt.find 'div.tool-notebook').append elt


exports.Locator = Locator
exports.ToolBox = ToolBox