SVG = require 'svg.coffee'
Path = require 'paths-js/path'

LOCATOR_SVG_PATHS = ->
  r = 6
  s = 50
  border = Path().moveto(s - r, 0)
    .arc(r, r, 0, 0, 1, s, r).lineto(s, s - r)
    .arc(r, r, 0, 0, 1, s - r, s).lineto(r, s)
    .arc(r, r, 0, 0, 1, 0, s - r).lineto(0, r)
    .arc(r, r, 0, 0, 1, r, 0).closepath()

  l = 0.35 * s
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

  return {border, cross, ticks}


make_icon = (svg) ->
  ret = $ '<div></div>'
  svg_container = SVG.root 52, 52
  svg_container.appendChild svg
  ret.append(svg_container)
  return ret

{border, cross, ticks} = LOCATOR_SVG_PATHS()

exports.GRAY_ICON = make_icon (SVG.g {transform: "translate(1, 1)"}, [
    SVG.path {d: border.print(), fill: 'none', stroke: 'gray', 'stroke-width': 2}
    SVG.path {d: cross.print(), fill: 'none', stroke: 'gray', 'stroke-width': 3}
    SVG.path {d: ticks.print(), fill: 'none', stroke: 'gray', 'stroke-width': 2}
])

exports.COLOR_ICON = make_icon (SVG.g {transform: "translate(1, 1)"}, [
    SVG.path {d: border.print(), fill: '#ffffaa', stroke: 'black', 'stroke-width': 2}
    SVG.path {d: cross.print(), fill: 'none', stroke: 'black', 'stroke-width': 3}
    SVG.path {d: ticks.print(), fill: 'none', stroke: 'black', 'stroke-width': 2}
])
