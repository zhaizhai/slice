SVG = require 'svg.coffee'
{EventEmitter} = require 'events'
{HookBinding} = require 'levels/base.coffee'

Path = require 'paths-js/path'

LOCATOR_SVG = ->
  r = 12
  s = 100
  border = Path().moveto(s - r, 0)
    .arc(r, r, 0, 0, 1, s, r).lineto(s, s - r)
    .arc(r, r, 0, 0, 1, s - r, s).lineto(r, s)
    .arc(r, r, 0, 0, 1, 0, s - r).lineto(0, r)
    .arc(r, r, 0, 0, 1, r, 0).closepath()

  l = 35
  cross = Path().moveto(s/2 - l, s/2).lineto(s/2 + l, s/2)
    .moveto(s/2, s/2 - l).lineto(s/2, s/2 + l)

  k = 5
  corners = [[0, 0], [s, 0], [s, s], [0, s]]
  ticks = Path()
  for i in [0...4]
    [cur_x, cur_y] = corners[i]
    [next_x, next_y] = corners[(i + 1) % 4]

    [dx, dy] = [next_x - cur_x, next_y - cur_y]
    [tick_x, tick_y] = [-5 * dy/s, 5 * dx/s]

    for i in [0...k]
      dk = i - Math.floor(k / 2)
      offset = dk / (k - 1) * (s - 3 * r)
      lambda = (1/2 + offset/s)

      [x, y] = [cur_x + lambda * dx, cur_y + lambda * dy]
      ticks = ticks.moveto(x, y).lineto(x + tick_x, y + tick_y)

  return SVG.g {}, [
    SVG.path {d: border.print(), fill: 'none', stroke: 'black'}
    SVG.path {d: cross.print(), fill: 'none', stroke: 'black'}
    SVG.path {d: ticks.print(), fill: 'none', stroke: 'black'}
  ]

class Locator extends EventEmitter
  constructor: (@level, @level_data, @scene) ->
    @_selected = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'purple'
    @_hover = new HookBinding @level, 1, (pt_id) =>
      return @_make_node pt_id, 'green'
    @_highlight = new HookBinding @level, 5, (pt_id) =>
      return @_make_node pt_id, 'yellow'

  activate: ->
    for pt_id in @level_data.points
      do (pt_id) =>
        @level.set_render_hook pt_id, {
          precedence: 0
          render: =>
            return @_make_node pt_id, 'red'
        }

  deactivate: ->
    @_selected.set null
    @_hover.set null
    @_highlight.set null

  cost: 1

  icon_elt: ->
    ret = ($ '<div>L</div>').css {
      'background-color': '#ffffaa'
      width: 30
      height: 30
      'text-align': 'center'
    }

    blah = LOCATOR_SVG()
    svg = SVG.root 100, 100
    svg.appendChild blah
    ret.append svg
    return ret

  select: (id) ->
    if @_selected.get() is id
      @_selected.set null
    else
      @_selected.set id
    @emit 'change'
  hover: (id) ->
    @_hover.set id
    @emit 'change'

  highlight: (id) ->
    @_highlight.set id
    @emit 'change'

  _make_node: (pt_id, color) ->
    pt = @level.get pt_id
    return SVG.circle {
      cx: pt.x, cy: pt.y, r: 6,
      fill: color, stroke: 'black'

      mouseenter: (e) =>
        @hover pt_id
      mouseleave: (e) =>
        @hover null
      click: (e) =>
        @select pt_id
    }

  measure: ->
    sel = @_selected.get()
    if not sel? then return null

    pt = @level.get sel
    return {
      ref: sel
      mesg: "Point at (#{pt.x}, #{pt.y})"
      mouseover: =>
        @highlight sel
      mouseout: =>
        @highlight null
    }


exports.Locator = Locator
