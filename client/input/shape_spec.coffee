SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

{CoordsInput, LengthInput} = require 'input/inputs.coffee'

Coords = (label) ->
  return -> new CoordsInput (label + ':')
Length = (label) ->
  return -> new LengthInput (label + ':')
Area = (label) -> # TODO: should this be different from length?
  return -> new LengthInput (label + ':')



# exports.AreaShape = # TODO: not an actual shape
#   title: 'Find the area'
#   params:
#     area: Area 'Area'

#   methods:
#     svg: -> # TODO


exports.SquareShape =
  title: 'Slice the biggest square that fits!'
  params:
    center: Coords 'Center'
    side: Length 'Side length'

  methods:
    polygon: ->
      DIRS = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
      halfside = @side / 2

      pts = []
      for [dx, dy] in DIRS
        pt = @center.shift (dx * halfside), (dy * halfside)
        pts.push pt
      return new Polygon pts

    svg: ->
      d = SVG.util.make_closed_path @polygon().points()
      return SVG.path {d}
    label: -> @center



exports.CircleShape =
  title: 'Slice the biggest circle that fits!'
  params:
    center: Coords 'Center'
    radius: Length 'Radius'
  methods:
    svg: ->
      SVG.circle {
        cx: @center.x, cy: @center.y, r: @radius
      }
    label: -> @center

