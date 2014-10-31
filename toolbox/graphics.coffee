SVG = require 'svg.coffee'

class ToolGraphics
  constructor: (@level) ->

  make_node: (pt_id, opts) ->
    DEFAULT_OPTS =
      status: 'default'
      mouseenter: ->
      mouseleave: ->
      click: ->
    for k, v of DEFAULT_OPTS
      opts[k] ?= v
    {
      status,
      mouseenter, mouseleave, click
    } = opts

    STATUS_STYLES =
      default:
        {color: 'red', r: 4}
      hover:
        {color: 'red', r: 6}
      selected:
        {color: 'purple', r: 6}
    style = STATUS_STYLES[status]

    pt = @level.get pt_id
    return SVG.circle {
      cx: pt.x, cy: pt.y, r: style.r,
      fill: style.color, stroke: 'black'

      mouseenter: mouseenter
      mouseleave: mouseleave
      click: click
    }

exports.ToolGraphics = ToolGraphics