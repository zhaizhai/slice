SVG = require 'svg.coffee'
Path = require 'paths-js/path'


RULER_SVG_PATHS = ->
  r = 6
  s = 50
  border = Path().moveto(s - r, 0)
    .arc(r, r, 0, 0, 1, s, r).lineto(s, s - r)
    .arc(r, r, 0, 0, 1, s - r, s).lineto(r, s)
    .arc(r, r, 0, 0, 1, 0, s - r).lineto(0, r)
    .arc(r, r, 0, 0, 1, r, 0).closepath()

  [a, b] = [0.15 * s, 0.05 * s]
  ruler = Path().moveto(a - b, s - a - b).lineto(a + b, s - a + b)
    .lineto(s - a + b, a + b).lineto(s - a - b, a - b).closepath()

  k = 8
  ticks = Path()
  t = 0.04 * s
  [start_x, start_y] = [a + b, s - a + b]
  gap = s - 2 * a
  for i in [1...k]
    offset = i * gap / k
    ticks = ticks.moveto(start_x + offset, start_y - offset)
      .lineto(start_x + offset - t, start_y - offset - t)

  return {border, ruler, ticks}


make_icon = (svg) ->
  ret = $ '<div></div>'
  svg_container = SVG.root 52, 52
  svg_container.appendChild svg
  ret.append(svg_container)
  return ret

{border, ruler, ticks} = RULER_SVG_PATHS()

exports.GRAY_ICON = make_icon (SVG.g {transform: "translate(1, 1)"}, [
  SVG.path {d: border.print(), fill: 'none', stroke: 'gray', 'stroke-width': 2}
  SVG.path {d: ruler.print(), fill: 'none', stroke: 'gray', 'stroke-width': 2}
  SVG.path {d: ticks.print(), fill: 'none', stroke: 'gray', 'stroke-width': 2}
])

exports.COLOR_ICON = make_icon (SVG.g {transform: "translate(1, 1)"}, [
  SVG.path {d: border.print(), fill: '#aaaaff', stroke: 'black', 'stroke-width': 2}
  SVG.path {d: ruler.print(), fill: '#ffdd00', stroke: 'black', 'stroke-width': 2}
  SVG.path {d: ticks.print(), fill: 'none', stroke: 'black', 'stroke-width': 2}
])


