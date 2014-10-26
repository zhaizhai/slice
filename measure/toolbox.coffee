SVG = require 'svg.coffee'
{EventEmitter} = require 'events'

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


{Locator} = require 'measure/locator.coffee'
exports.setup_tools = (level, scene) ->
  TOOLS =
    locator: Locator

  tools = {}
  for name, tool_type of TOOLS
    tool = new tool_type level

    # TODO: only do this for some tools
    tool.activate() # TODO
    tool.on 'change', =>
      scene.render()

    tools[name] = tool

  return {
    toolbox: new ToolBox {
      tools: tools
      scene: scene
      default_tool: 'locator'
      ap: 1
    }
  }

exports.ToolBox = ToolBox