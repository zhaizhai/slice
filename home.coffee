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
  <div>
    <div class="tc level-name"></div>
    <div class="tc level-progress"></div>
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

window.onload = ->
  for id, info of LEVELS
    level_info = new LevelInfo {
      level_id: id
      name: info.name
      stars: info.stars
      completed: info.completed
    }
    ($ document.body).append (new LevelDisplay level_info).elt()

  # testing
  x = $ '''
    <div>
      <input type="text"></input>
      <button>Evaluate!</button>
      <div class="result"></div>
    </div>
  '''

  (x.find 'button').click =>
    input = (x.find 'input').val()
    input = input.replace /\ /g, ''
    ast = get_syntax_tree input
    result = evaluate ast, {}, {}
    (x.find 'div.result').text result
  ($ document.body).append x