mustache = require 'mustache'
SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{$ajax} = require 'http_util.coffee'

render_to_jq = (tmpl, params) ->
  html = mustache.to_html tmpl, params
  return $ html

ALL_TOOLS = ['locator', 'ruler', 'radius_finder']
ICONS = {
  locator: (require 'toolbox/locator_icon.coffee')
  ruler: (require 'toolbox/ruler_icon.coffee')
  radius_finder: (require 'toolbox/radius_finder_icon.coffee')
}


class ToolContainer
  TMPL = '''
  <div class="disp-t">
    <div class="disp-tc tool-grid"></div>
    <div class="disp-tc tool-description"></div>
  </div>
  '''
  TOOL_DESC = '''
  <div class="tool-name">{{name}}</div>
  <div class="tool-text">{{desc}}</div>
  '''

  [CELL_W, CELL_H] = [60, 80]
  ENTRIES_PER_ROW = 4

  constructor: (@player_info) ->
    @_selection = null
    @_elt = $ TMPL

    @_tool_desc = (@_elt.find '.tool-description').css {
      width: 250
    }
    @_tool_container = ($ '<div></div>').css {
      width: ENTRIES_PER_ROW * CELL_W
      height: 600
      position: 'absolute'
    }
    @_elt.find('.tool-grid').css({
      width: @_tool_container.width()
      'min-width': @_tool_container.width()
    }).append @_tool_container

    @refresh()

  elt: -> @_elt

  select: (tool_name) ->
    if tool_name is @_selection
      @_selection = null
    else
      @_selection = tool_name

  _set_description: (tool_name, tool_info) ->
    @_tool_desc.empty()

    desc = render_to_jq TOOL_DESC, {
      name: tool_info.name
      desc: tool_info.description
    }
    @_tool_desc.append desc

    if tool_name in @player_info.tools
      return

    buy_button = ($ '<button>Buy</button>').click =>
      @_buy tool_name
    @_tool_desc.append buy_button
    if not (@_can_buy tool_name)
      buy_button.prop 'disabled', true

  _can_buy: (tool_name) ->
    tool_info = JS_DATA.ToolMap[tool_name]
    owned = tool_name in @player_info.tools
    return (not owned and @player_info.gold >= tool_info.price)

  _buy: (tool_name) ->
    $ajax.post '/buy', {
      tool_id: tool_name
    }, (err, res) =>
      console.log err, res
      {success, message, new_user_info} = JSON.parse res
      if not success
        throw new Error message

      # TODO: temporary hacks
      @player_info.tools = new_user_info.Tools
      @player_info.gold = new_user_info.Gold
      ($ document.body).find('.gold-count').text "Gold: #{@player_info.gold}"

      @refresh()

  refresh: ->
    @_tool_container.empty()
    @_tool_desc.empty()

    [row, col] = [0, 0]
    for tool_name in ALL_TOOLS
      tool_info = JS_DATA.ToolMap[tool_name]
      owned = tool_name in @player_info.tools
      highlighted = (owned or @player_info.gold >= tool_info.price)
      icon = new ToolIcon tool_name, tool_info, {owned, highlighted}
      icon_elt = icon.elt()

      @_tool_container.append icon_elt
      # if not owned and highlighted
      do (tool_name) =>
        icon_elt.click =>
          @select tool_name
          @refresh()
      # TODO: for some reason icon_elt.width() and .height() return 0
      # at this stage
      icon_elt.css {
        position: 'absolute'
        top: row * CELL_H #+ (CELL_H - icon_elt.height()) / 2
        left: col * CELL_W #+ (CELL_W - icon_elt.width()) / 2
      }

      if tool_name is @_selection
        @_set_description tool_name, tool_info
        icon_elt.css {'background-color': '#bbbbbb'}

      col += 1
      if col >= ENTRIES_PER_ROW
        col = 0
        row += 1


CHECKMARK_SVG = (x, y, r) ->
  path = Path().moveto(-0.1, -0.15)
    .qcurveto(-0.04, -0.08, 0, 0)
    .qcurveto(0.20, -0.30, 0.5, -0.5)
    .lineto(0.5, -0.47)
    .qcurveto(0.2, -0.15, 0.0, 0.25)
    .qcurveto(-0.1, 0.1, -0.25, -0.05)
    .closepath()
  return SVG.path {
    d: path.print()
    fill: 'green'
    'stroke-width': 2
    transform: "translate(#{x}, #{y}) scale(#{r}, #{r})"
  }


class ToolIcon
  DEFAULT_OPTS =
    owned: false
    highlighted: false
  constructor: (@tool_name, @tool_info, @opts = {}) ->
    for k, v of DEFAULT_OPTS
      @opts[k] ?= v

    icon_svg = if @opts.highlighted
      ICONS[@tool_name].SELECTED_ICON
    else
      ICONS[@tool_name].UNSELECTED_ICON

    # icon_svg.find('svg')[0].appendChild (CHECKMARK_SVG 35, 40, 40)

    @_elt = ($ '<div></div>').css {
      padding: 4
      'border-radius': 6
    }
    if @opts.highlighted and not @opts.owned
      # TODO: this globally alters the icon css...
      icon_svg.css {
        border: '1px solid rgb(86, 180, 239)'
        'border-radius': 8
        'box-shadow': '0px 1px 3px rgba(0, 0, 0, 0.05) inset, 0px 0px 8px rgba(82, 168, 236, 0.6)'
      }
    @_elt.append icon_svg

    price_elt = if @opts.owned
      root = SVG.root 20, 20
      root.appendChild (CHECKMARK_SVG 8, 12, 20)
      ($ '<div></div>').append root
    else
      $ "<div>#{@tool_info.price}</div>"
    price_elt.addClass('disp-tc').css {
      'text-align': 'center'
    }

    price_container = $('<div></div>').addClass('disp-t').css {
      width: '100%'
      'border-spacing': 0
    }

    price_container.append price_elt
    @_elt.append price_container

  elt: -> @_elt


exports.ToolContainer = ToolContainer