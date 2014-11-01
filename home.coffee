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
    (@_elt.find 'div.level-progress').text "#{@level_info.stars} out of 5"

    @_elt.click =>
      window.location.href = "index.html\##{@level_info.level_id}"

  elt: -> @_elt

LEVELS = {
  l1: {name: "Level 1", stars: 3, completed: false}
  l2: {name: "Level 2", stars: 3, completed: false}
}

ICONS = {
  locator: (require 'toolbox/locator_icon.coffee')
  ruler: (require 'toolbox/ruler_icon.coffee')
}

window.onload = ->
  levels_container = ($ document.body).find '.home-levels'

  for id, info of LEVELS
    level_info = new LevelInfo {
      level_id: id
      name: info.name
      stars: info.stars
      completed: info.completed
    }
    levels_container.append (new LevelDisplay level_info).elt()

  player_info = new PlayerInfo {
    gold: 0
    tools: [
      'locator', 'ruler'
    ]
  }


  tool_container = ($ '<div></div>').css {
    width: 500
    height: 600
    position: 'absolute'
  }

  [cell_w, cell_h] = [60, 60]
  [row, col] = [0, 0]
  for tool in player_info.tools
    icon = ICONS[tool].SELECTED_ICON
    icon.css {
      position: 'absolute'
      top: row * cell_h + (cell_h - icon.height()) / 2
      left: col * cell_w + (cell_w - icon.width()) / 2
    }
    tool_container.append icon
    col += 1 # TODO
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