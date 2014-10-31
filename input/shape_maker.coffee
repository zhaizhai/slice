SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{Point, Polygon} = require 'geometry.coffee'

# class ShapeDisplay
#   constructor: ->
#     root = SVG.root 200, 200
#     children = [
#       SVG.path {
#         d: (SVG.util.make_closed_path [
#           {x: 150, y: 150}
#           {x: 50, y: 150}
#           {x: 50, y: 50}
#           {x: 150, y: 50}
#         ])
#         stroke: 'black'
#         fill: 'none'
#       }
#       SVG.circle {
#         cx: 100, cy: 100, r: 3, stroke: 'none', fill: 'gray'
#       }
#     ]
#     for child in children
#       root.appendChild child
#     @_elt = $ root

#   elt: -> @_elt


class ShapeMaker
  TMPL = '''<div class="toolbox-section">
    <div class="input-title"></div>
    <div class="container"></div>
  </div>'''

  constructor: (@_shape, @_handler) ->
    # @_disp = new ShapeDisplay()

    @_elt = $ TMPL
    (@_elt.find '.input-title').text @_shape.title
    container = @_elt.find '.container'

    @_inputs = {}
    # TODO: params are in unspecified order
    for k, v of @_shape.params
      @_inputs[k] = v()
      container.append @_inputs[k].elt()

    submit = ($ '<button>Submit</button>').click =>
      @_on_submit()
    container.append submit

  elt: -> @_elt

  _on_submit: ->
    shape_data = {}
    for k, elt of @_inputs
      shape_data[k] = elt.get()

    # attach methods
    for k, func of @_shape.methods
      shape_data[k] = func
    return @_handler shape_data

exports.ShapeMaker = ShapeMaker