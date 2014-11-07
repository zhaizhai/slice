SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{$ajax} = require 'http_util.coffee'

ALL_TOOLS = ['locator', 'ruler', 'radius_finder']
ICONS = {
  locator: (require 'toolbox/locator_icon.coffee')
  ruler: (require 'toolbox/ruler_icon.coffee')
  radius_finder: (require 'toolbox/radius_finder_icon.coffee')
}


class ToolContainer
  constructor: (@player_info) ->
    @_elt = ($ '<div></div>').css {
      width: 500
      height: 600
      position: 'absolute'
    }
    @refresh()

  refresh: ->
    @_elt.empty()

    [cell_w, cell_h] = [60, 60]
    [row, col] = [0, 0]
    entries_per_row = 5
    for tool_name in ALL_TOOLS
      tool_info = JS_DATA.ToolMap[tool_name]

      owned = tool_name in @player_info.tools
      highlighted = (owned or @player_info.gold >= tool_info.price)
      icon = new ToolIcon tool_name, tool_info, {owned, highlighted}
      icon_elt = icon.elt()

      if not owned and highlighted
        do (tool_name) =>
          icon_elt.click =>
            @buy tool_name

      icon_elt.css {
        position: 'absolute'
        top: row * cell_h + (cell_h - icon_elt.height()) / 2
        left: col * cell_w + (cell_w - icon_elt.width()) / 2
      }
      @_elt.append icon.elt()
      col += 1
      if col >= entries_per_row
        col = 0
        row += 1

  buy: (tool_name) ->
    $ajax.post '/buy', {
      tool_id: tool_name
    }, (err, res) =>
      console.log err, res
      {success, message, new_tools} = JSON.parse res
      if not success
        throw new Error message

      # TODO: temporary hack
      @player_info.tools = new_tools
      @refresh()

  elt: -> @_elt


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

    @_elt = $ '<div></div>'
    if not @opts.owned and @opts.highlighted
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