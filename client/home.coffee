{evaluate, get_syntax_tree} = require 'input/eval.coffee'
{ToolContainer} = require 'shop/toolshop.coffee'

class LevelInfo
  constructor: ({
    @level_id, @name, @stars, @completed
  }) ->


class PlayerInfo
  constructor: ({
    @tools, @gold
  }) ->


class LevelDisplay
  TMPL = '''
  <div class="level-row">
    <div class="disp-tc level-name"></div>
    <div class="disp-tc level-progress"></div>
  </div>
  '''

  constructor: (@level_info) ->
    @_elt = $ TMPL
    (@_elt.find 'div.level-name').text @level_info.name

    progress_txt = ""
    for i in [0...3]
      if @level_info.stars > i
        progress_txt += "\u2605"
      else
        progress_txt += "\u2606"
    (@_elt.find 'div.level-progress').text progress_txt

    @_elt.click =>
      window.location.href = "level\##{@level_info.level_id}"

  elt: -> @_elt

ICONS = {
  locator: (require 'toolbox/locator_icon.coffee')
  ruler: (require 'toolbox/ruler_icon.coffee')
  radius_finder: (require 'toolbox/radius_finder_icon.coffee')
}

window.onload = ->
  ($ document.body).find('.logged-in-name').text JS_DATA.UserDisplayName

  levels_container = ($ document.body).find '.home-levels'
  for info in JS_DATA.LevelData
    name = "Level " + info.LevelID.slice(1) # TODO

    level_info = new LevelInfo {
      level_id: info.LevelID
      name: name # TODO
      stars: info.Stars
    }
    levels_container.append (new LevelDisplay level_info).elt()

  player_info = new PlayerInfo {
    gold: JS_DATA.UserInfo.Gold
    tools: JS_DATA.UserInfo.Tools ? [] # TODO
  }
  ($ document.body).find('.gold-count').text "Gold: #{player_info.gold}"

  tool_container = new ToolContainer player_info
  ($ document.body).find('.home-tools').append tool_container.elt()

