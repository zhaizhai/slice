mustache = require 'mustache'
SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

render_to_jq = (tmpl, params) ->
  html = mustache.to_html tmpl, params
  return $ html

make_closed_path = (pts) ->
  ret = Path().moveto pts[0]
  for pt in pts[1..]
    ret = ret.lineto pt
  return ret.closepath().print()

class ShapeDisplay
  constructor: ->
    root = SVG.root 200, 200
    children = [
      SVG.path {
        d: (make_closed_path [
          {x: 150, y: 150}
          {x: 50, y: 150}
          {x: 50, y: 50}
          {x: 150, y: 50}
        ])
        stroke: 'black'
        fill: 'none'
      }
      SVG.circle {
        cx: 100, cy: 100, r: 3, stroke: 'none', fill: 'gray'
      }
    ]
    for child in children
      root.appendChild child
    @_elt = $ root

  elt: -> @_elt


class CoordsInput
  TMPL = '''
  <div>
    {{input_txt}}
    <input type="text" class="x-input"></input>
    <input type="text" class="y-input"></input>
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
    <input type="text" class="len-input"></input>
  </div>
  '''

  constructor: (input_txt) ->
    @_elt = render_to_jq TMPL, {input_txt}
  elt: -> @_elt

  get: ->
    len = (@_elt.find 'input.len-input').val()
    len = parseFloat len
    return len


class ShapeMaker
  TMPL = '''<div></div>'''

  constructor: (@_handler) ->
    @_disp = new ShapeDisplay()
    @_center = new CoordsInput 'Center:'
    @_length = new LengthInput 'Side length:'

    @_elt = $ TMPL
    @_elt.append @_disp.elt()
    @_elt.append @_center.elt()
    @_elt.append @_length.elt()

    submit = ($ '<button>Submit</button>').click =>
      @_on_submit()
    @_elt.append submit

  elt: -> @_elt

  _make_square: (center, length) ->
    pts = []
    for [dx, dy] in [[1, 1], [-1, 1], [-1, -1], [1, -1]]
      pt = center.shift (dx * length / 2), (dy * length / 2)
      pts.push pt
    return new Polygon pts

  _on_submit: ->
    center = @_center.get()
    length = @_length.get()
    shape = @_make_square center, length
    @_handler {
      center: center
      shape: shape
    }


exports.ShapeMaker = ShapeMaker