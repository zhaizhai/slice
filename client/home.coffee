{evaluate, get_syntax_tree} = require 'input/eval.coffee'

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
}

window.onload = ->
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

  tool_container = ($ '<div></div>').css {
    width: 500
    height: 600
    position: 'absolute'
  }

  [cell_w, cell_h] = [60, 60]
  [row, col] = [0, 0]
  entries_per_row = 5
  for tool in player_info.tools
    icon = ICONS[tool].SELECTED_ICON
    icon.css {
      position: 'absolute'
      top: row * cell_h + (cell_h - icon.height()) / 2
      left: col * cell_w + (cell_w - icon.width()) / 2
    }
    tool_container.append icon
    col += 1
    if col >= entries_per_row
      col = 0
      row += 1

  ($ document.body).find('.home-tools').append tool_container


  # # testing
  # x = $ '''
  #   <div>
  #     <input type="text"></input>
  #     <button>Evaluate!</button>
  #     <div class="result"></div>
  #   </div>
  # '''

  # (x.find 'button').click =>
  #   input = (x.find 'input').val()
  #   input = input.replace /\ /g, ''
  #   ast = get_syntax_tree input
  #   result = evaluate ast, {}, {}
  #   (x.find 'div.result').text result
  # ($ document.body).append x