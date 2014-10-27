SVG = require 'svg.coffee'
{EventEmitter} = require 'events'

class ToolBox
  TMPL = '''
  <div>
    <div class="tool-selection"></div>
    <div class="tool-action-points"></div>
    <button>Measure!</button>
    <div class="tool-notebook"></div>
  </div>
  '''
  constructor: ({
    @level, @scene, @tools,
    default_tool
  }) ->
    default_tool ?= null
    @ap_used = 0

    @_elt = $ TMPL
    @_cur_tool = null
    @_icon_elts = {}

    sel_elt = (@_elt.find '.tool-selection')
    for name, tool of @tools
      do (name, tool) =>
        icon = tool.icon_elt()
        icon.click =>
          @select name
        @_icon_elts[name] = icon
        sel_elt.append icon

    (@_elt.find 'button').click =>
      if not @_cur_tool? then return
      tool = @tools[@_cur_tool]

      result = tool.measure()
      if not result? then return
      @ap_used += tool.cost

      @_on_measure result
      @_update()

    @_measurements = []
    @select default_tool
    @_update()

  elt: -> @_elt

  _update: ->
    # TODO: do more updating here
    (@_elt.find '.tool-action-points').text "#{@ap_used} action points used"

  _deactivate: (name) ->
    @_icon_elts[name].css 'border', 'none'
    tool = @tools[name]
    @level.clear_render_hooks()
    @scene.mousemove null
    @scene.set_overlay null
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

  _on_measure: (result) ->
    @_measurements.push result
    elt = $ "<div>#{result.mesg}</div>"
    elt.hover (-> result.mouseover()),
      (-> result.mouseout())
    (@_elt.find 'div.tool-notebook').append elt


{Locator} = require 'measure/locator.coffee'
{Ruler} = require 'measure/ruler.coffee'

exports.setup_tools = (level, scene) ->
  TOOLS =
    locator: Locator
    ruler: Ruler

  tools = {}
  for name, tool_type of TOOLS
    tool_data = level.allowed_tools[name]
    if not tool_data? then continue

    tool = new tool_type level, tool_data, scene
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
    }
  }

exports.ToolBox = ToolBox