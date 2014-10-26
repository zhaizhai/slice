SVG = require 'svg.coffee'
{EventEmitter} = require 'events'

class Locator extends EventEmitter
  constructor: (@level) ->
    @_selected = null
    @_hover = null
    @_highlight = null

  icon_elt: ->
    ret = ($ '<div></div>').css {
      'background-color': 'yellow'
      width: 30
      height: 30
    }
    return ret

  select: (id) ->
    if @_selected is id
      @_selected = null
    else
      @_selected = id
    @emit 'change'
  hover: (id) ->
    @_hover = id
    @emit 'change'

  highlight: (id) ->
    @_highlight = id
    @emit 'change'

  render: (container) ->
    container.appendChild @level.background()
    container.appendChild @level.render_figure()
    container.appendChild @_render_nodes()

  _render_nodes: ->
    fig = @level.entities.figure
    nodes = []
    for pt, idx in fig.points()
      pt_id = 'p' + idx
      do (pt, idx, pt_id) =>
        color = if @_highlight?
          if pt_id is @_highlight
            'yellow'
          else
            'red'
        else if pt_id is @_selected
          'purple'
        else if pt_id is @_hover
          'green'
        else
          'red'

        nodes.push (SVG.circle {
          cx: pt.x, cy: pt.y, r: 6,
          fill: color, stroke: 'black'

          mouseenter: (e) =>
            @hover pt_id
          mouseleave: (e) =>
            @hover null
          click: (e) =>
            @select pt_id
        })
    return SVG.g {}, nodes

  can_measure: -> @_selected?

  measure: ->
    if not @_selected? then return

    pt = @level.entities[@_selected]
    sel = @_selected

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
  constructor: (@scene, @tools, default_tool = null) ->
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
      tool.measure()

    @_measurements = []
    @select default_tool

  elt: -> @_elt

  select: (name) ->
    if @_cur_tool?
      @_icon_elts[@_cur_tool].css 'border', 'none'

    if @_cur_tool is name
      @_cur_tool = null
      # TODO: set @scene.set_renderer to default
      return

    @_cur_tool = name
    @_icon_elts[name].css 'border', 'solid 1px'

    tool = @tools[name]
    @scene.set_renderer tool

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