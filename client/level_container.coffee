
class LevelDisplay
  TMPL = '''
  <div class="level-row">
    <div class="disp-tc level-name"></div>
    <div class="disp-tc level-progress"></div>
  </div>
  '''

  constructor: (@level_info, @show_detail = false) ->
    @_elt = $ TMPL
    (@_elt.find 'div.level-name').text @level_info.name

    progress_txt = ""
    for i in [0...3]
      if @level_info.stars > i
        progress_txt += "\u2605"
      else
        progress_txt += "\u2606"

    if @show_detail
      attempt_button = ($ '<button>Attempt</button>').click =>
        window.location.href = "level\##{@level_info.level_id}"
      (@_elt.find 'div.level-progress').append attempt_button
      @_elt.css {'background-color': '#cccccc'}
    else
      (@_elt.find 'div.level-progress').text progress_txt

    @_elt.hover (=> @_hover_in()), (=> @_hover_out())

  elt: -> @_elt

  _hover_in: ->
    if @show_detail then return
    @_elt.css {'background-color': '#cccccc'}
  _hover_out: ->
    if @show_detail then return
    @_elt.css {'background-color': '#dddddd'}

class LevelContainer
  constructor: (@levels) ->
    @_elt = $ '<div></div>'
    @_selected = null

    @refresh()

  elt: -> @_elt

  select: (level_id) ->
    if @_selected is level_id
      @_selected = null
    else
      @_selected = level_id

  refresh: ->
    @_elt.empty()
    for info in @levels
      level_id = info.level_id
      show_detail = (@_selected is level_id)
      level_disp = new LevelDisplay info, show_detail

      do (level_id) =>
        level_disp.elt().click =>
          @select level_id
          @refresh()
      @_elt.append level_disp.elt()


exports.LevelContainer = LevelContainer