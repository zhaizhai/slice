{ToolContainer} = require 'shop/toolshop.coffee'
{LevelContainer} = require 'level_container.coffee'

class LevelInfo
  constructor: ({
    @level_id, @name, @stars, @completed
  }) ->


class PlayerInfo
  constructor: ({
    @tools, @gold
  }) ->

ICONS = {
  locator: (require 'toolbox/locator_icon.coffee')
  ruler: (require 'toolbox/ruler_icon.coffee')
  radius_finder: (require 'toolbox/radius_finder_icon.coffee')
}

window.onload = ->
  ($ document.body).find('.logged-in-name').text JS_DATA.UserDisplayName

  levels = []
  for info in JS_DATA.LevelData
    name = "Level " + info.LevelID.slice(1) # TODO
    level_info = new LevelInfo {
      level_id: info.LevelID
      name: name # TODO
      stars: info.Stars
    }
    levels.push level_info

  levels_container = new LevelContainer levels
  ($ document.body).find('.home-levels').append levels_container.elt()

  player_info = new PlayerInfo {
    gold: JS_DATA.UserInfo.Gold
    tools: JS_DATA.UserInfo.Tools ? [] # TODO
  }
  ($ document.body).find('.gold-count').text "Gold: #{player_info.gold}"

  tool_container = new ToolContainer player_info
  ($ document.body).find('.home-tools').append tool_container.elt()

