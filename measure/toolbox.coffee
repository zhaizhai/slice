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
    @level, @scene, @tools,
    @ap, default_tool
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

  _deactivate: (name) ->
    @_icon_elts[name].css 'border', 'none'
    tool = @tools[name]
    @level.clear_render_hooks()
    @scene.mousemove null
    console.log 'deactivating', name
    tool.deactivate()

  _activate: (name) ->
    @_icon_elts[name].css 'border', 'solid 1px'
    tool = @tools[name]
    console.log 'activating', name
    tool.activate()
    @scene.render()

  select: (name) ->
    if @_cur_tool?
      @_deactivate @_cur_tool

    if @_cur_tool is name
      @_cur_tool = null
      return

    @_cur_tool = name
    @_activate @_cur_tool

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
{Ruler} = require 'measure/ruler.coffee'

exports.setup_tools = (level, scene) ->
  TOOLS =
    locator: Locator
    ruler: Ruler

  tools = {}
  for name, tool_type of TOOLS
    tool = new tool_type level, scene
    tools[name] = tool

    # TODO: hopefully change events never fire when tool isn't active,
    # but better to prevent this more explicitly
    tool.on 'change', =>
      scene.render()

  return {
    toolbox: new ToolBox {
      level: level
      tools: tools
      scene: scene
      default_tool: 'locator'
      ap: 1
    }
  }

exports.ToolBox = ToolBox