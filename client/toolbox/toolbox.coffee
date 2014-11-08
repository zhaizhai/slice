SVG = require 'svg.coffee'
{EventEmitter} = require 'events'

class ToolBox
  TMPL = '''
  <div>
    <div class="toolbox-section tool-selection-area">
      <div class="tool-title">Tools</div>
      <div class="tool-selection"></div>
    </div>
    <div class="toolbox-section tool-measurement-area">
      <div class="tool-action-points"></div>
      <div class="tool-status"></div>
      <div class="tool-notebook"></div>
    </div>
  </div>
  '''
  constructor: ({
    @level, @scene, @tools, @disabled_tools,
    default_tool
  }) ->
    default_tool ?= null
    @disabled_tools ?= [] # TODO
    @ap_used = 0

    @_elt = $ TMPL
    @_cur_tool = null
    @_icon_elts = {}

    sel_elt = (@_elt.find '.tool-selection')
    for name, tool of @tools
      available = (name not in @disabled_tools)
      do (name, tool) =>
        icon = if available then tool.icons.selected else tool.icons.unselected
        container = ($ '<div></div>')
          .addClass('tool-icon').append icon
        @_icon_elts[name] = container

        container.css {opacity: 0.5}
        if available
          container.click =>
            @select name

        sel_elt.append container

    @_measurements = []
    @select default_tool
    @_update()

    @_on_tool_change = null

  elt: -> @_elt

  _do_measure: ->
    if not @_cur_tool? then return
    tool = @tools[@_cur_tool]

    result = tool.measure()
    if not result? then return
    @ap_used += tool.cost

    @_on_measure result
    @_update()

  _update: ->
    # TODO: do more updating here
    pts_txt = if @ap_used is 1
      "1 action point used"
    else
      "#{@ap_used} action points used"
    (@_elt.find '.tool-action-points').text pts_txt

  _deactivate: (name) ->
    tool = @tools[name]
    @_icon_elts[name].css {opacity: 0.5}

    @level.clear_render_hooks()
    @scene.mousemove null
    @scene.set_overlay null
    console.log 'deactivating', name
    tool.deactivate()
    if @_on_tool_change?
      tool.removeListener 'change', @_on_tool_change

  _activate: (name) ->
    console.log 'activating', name

    tool = @tools[name]
    @_icon_elts[name].css {opacity: 1.0}
    tool.activate()

    @_on_tool_change = =>
      status_elt = @_elt.find '.tool-status'
      status_elt.empty()
      button = ($ '<button>Measure!</button>').click(@_do_measure.bind @)
      if not tool.measure()?
        button.prop 'disabled', true
      status_elt.append button
    tool.on 'change', @_on_tool_change
    @_on_tool_change()

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


{Locator} = require 'toolbox/locator.coffee'
{Ruler} = require 'toolbox/ruler.coffee'
{RadiusFinder} = require 'toolbox/radius_finder.coffee'

exports.setup_tools = (scene, level, player_tools) ->
  TOOLS =
    locator: Locator
    ruler: Ruler
    radius_finder: RadiusFinder

  tools = {}
  disabled_tools = []
  for name, tool_type of TOOLS
    tool_data = level.allowed_tools[name]
    if not tool_data? then continue

    if name not in player_tools
      disabled_tools.push name

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
      disabled_tools: disabled_tools
      # default_tool: 'locator'
    }
  }

exports.ToolBox = ToolBox