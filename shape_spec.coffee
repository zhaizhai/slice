mustache = require 'mustache'

SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'


render_to_jq = (tmpl, params) ->
  html = mustache.to_html tmpl, params
  return $ html



class CoordsInput
  TMPL = '''
  <div>
    {{input_txt}}
    <input type="text" class="x-input" placeholder="x-coordinate"></input>
    <input type="text" class="y-input" placeholder="y-coordinate"></input>
  </div>
  '''

  constructor: (input_txt) ->
    @_elt = render_to_jq TMPL, {input_txt}
  elt: -> @_elt

  get: ->
    x = (@_elt.find 'input.x-input').val()
    y = (@_elt.find 'input.y-input').val()
    [x, y] = [(parseFloat x), (parseFloat y)]
    return (new Point x, y)


class LengthInput
  TMPL = '''
  <div>
    {{input_txt}}
    <input type="text" class="len-input" placeholder="length"></input>
  </div>
  '''

  constructor: (input_txt) ->
    @_elt = render_to_jq TMPL, {input_txt}
  elt: -> @_elt

  get: ->
    len = (@_elt.find 'input.len-input').val()
    len = parseFloat len
    return len


Coords = (label) ->
  return -> new CoordsInput (label + ':')
Length = (label) ->
  return -> new LengthInput (label + ':')


exports.SquareShape =
  params:
    center: Coords 'Center'
    side: Length 'Side length'

  svg: ->
    d = SVG.util.make_closed_path @polygon().points
    return SVG.path {d}

  label: -> @center

  methods:
    polygon: ->
      DIRS = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
      halfside = @side / 2

      pts = []
      for [dx, dy] in DIRS
        pt = @center.shift (dx * halfside), (dy * halfside)
        pts.push pt
      return new Polygon pts


exports.CircleShape =
  params:
    center: Coords 'Center'
    radius: Length 'Radius'

  svg: ->
    SVG.circle {
      cx: @center.x, cy: @center.y, r: @radius
    }

  label: -> @center
  methods: {}
