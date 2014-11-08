SVG = require 'svg.coffee'
Path = require 'paths-js/path'

RF_SVG_PATHS = ->
  r = 6
  s = 50
  border = Path().moveto(s - r, 0)
    .arc(r, r, 0, 0, 1, s, r).lineto(s, s - r)
    .arc(r, r, 0, 0, 1, s - r, s).lineto(r, s)
    .arc(r, r, 0, 0, 1, 0, s - r).lineto(0, r)
    .arc(r, r, 0, 0, 1, r, 0).closepath()
  dotted_radius = Path().moveto(s/2, s/2).lineto(5*s/6, s/2)
  return {border, dotted_radius}

make_icon = (svg) ->
  ret = $ '<div></div>'
  svg_container = SVG.root 52, 52
  svg_container.appendChild svg
  ret.append(svg_container)
  return ret

{border, dotted_radius} = RF_SVG_PATHS()

s = 50 # TODO
exports.GRAY_ICON = make_icon (SVG.g {transform: "translate(1, 1)"}, [
  SVG.path {d: border.print(), fill: 'none', stroke: 'gray', 'stroke-width': 2}
  SVG.circle {cx: (s/2), cy: (s/2), r: (s/3), fill: 'none', stroke: 'gray', 'stroke-width': 2}
  SVG.path {d: dotted_radius.print(), stroke: 'gray', 'stroke-dasharray': '2,2', 'stroke-width': 2}
])

# TODO: less ugly colors
exports.COLOR_ICON = make_icon (SVG.g {transform: "translate(1, 1)"}, [
  SVG.path {d: border.print(), fill: '#aaaaff', stroke: 'black', 'stroke-width': 2}
  SVG.circle {cx: (s/2), cy: (s/2), r: (s/3), fill: '#28bda9', stroke: 'black', 'stroke-width': 2}
  SVG.path {d: dotted_radius.print(), stroke: 'black', 'stroke-dasharray': '2,2', 'stroke-width': 2}
])


