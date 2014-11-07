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

    [cell_w, cell_h] = [60, 60]
    [row, col] = [0, 0]
    entries_per_row = 5
    for tool_name in ALL_TOOLS
      tool_info = JS_DATA.ToolMap[tool_name]

      owned = tool_name in @player_info.tools
      highlighted = (owned or @player_info.gold >= tool_info.price)
      icon = new ToolIcon tool_name, {owned, highlighted}
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

  elt: -> @_elt


class ToolIcon
  DEFAULT_OPTS =
    owned: false
    highlighted: false
  constructor: (@tool_name, @opts = {}) ->
    for k, v of DEFAULT_OPTS
      @opts[k] ?= v

    icon_svg = if @opts.highlighted
      ICONS[@tool_name].SELECTED_ICON
    else
      ICONS[@tool_name].UNSELECTED_ICON

    @_elt = $ '<div></div>'
    if not @opts.owned and @opts.highlighted
      @_elt.css {
        border: '1px solid rgb(86, 180, 239)'
        'box-shadow': '0px 1px 3px rgba(0, 0, 0, 0.05) inset, 0px 0px 8px rgba(82, 168, 236, 0.6)'
      }
    @_elt.append icon_svg

  elt: -> @_elt


exports.ToolContainer = ToolContainer