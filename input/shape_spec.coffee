mustache = require 'mustache'

SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'
{evaluate_string} = require 'input/eval.coffee'

render_to_jq = (tmpl, params) ->
  html = mustache.to_html tmpl, params
  return $ html



class CoordsInput
  TMPL = '''
  <div class="disp-t input-param">
    <div class="disp-tc input-label">{{input_txt}}</div>
    <div class="disp-tc input-container">
      <input type="text" class="shape-text-input x-input" placeholder="x-coordinate"></input>
      <input type="text" class="shape-text-input y-input" placeholder="y-coordinate"></input>
    </div>
  </div>
  '''

  constructor: (input_txt) ->
    @_elt = render_to_jq TMPL, {input_txt}
  elt: -> @_elt

  get: ->
    x = (@_elt.find 'input.x-input').val()
    y = (@_elt.find 'input.y-input').val()
    [x, y] = [(evaluate_string x), (evaluate_string y)]
    return (new Point x, y)


class LengthInput
  TMPL = '''
  <div class="disp-t input-param">
    <div class="disp-tc input-label">{{input_txt}}</div>
    <div class="disp-tc input-container">
      <input type="text" class="shape-text-input len-input" placeholder="length"></input>
    </div>
  </div>
  '''

  constructor: (input_txt) ->
    @_elt = render_to_jq TMPL, {input_txt}
  elt: -> @_elt

  get: ->
    len = (@_elt.find 'input.len-input').val()
    len = evaluate_string len
    return len


Coords = (label) ->
  return -> new CoordsInput (label + ':')
Length = (label) ->
  return -> new LengthInput (label + ':')


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
      d = SVG.util.make_closed_path @polygon().points
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

