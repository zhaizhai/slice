assert = require 'assert'
Path = require 'paths-js/path'
{Point} = require 'geometry.coffee'

class SVG
  MOUSE_EVTS = [
    'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
    'click'
  ]

  # TODO: is there something more recent?
  svg_ns = "http://www.w3.org/2000/svg"

  create_elt = (type, attrs, children = []) ->
    ret = document.createElementNS svg_ns, type
    for k, v of attrs
      if k in MOUSE_EVTS
        do (v) ->
          ret.addEventListener k, (args...) ->
            return v.apply ret, args
        continue
      ret.setAttribute k, v

    for child in children
      console.log 'child', child
      ret.appendChild child
    return ret

  @root = (width, height) ->
    ret = document.createElementNS svg_ns, 'svg'
    ret.setAttribute 'width', width
    ret.setAttribute 'height', height
    return ret

  make_primitive = (prim) =>
    @[prim] = (attrs, children) ->
      create_elt prim, attrs, children
  for prim in ['g', 'circle', 'path']
    make_primitive prim


to_radians = (deg) -> Math.PI * deg / 180

exports.util =
  arrow: (p, opts) ->
    {tip, length, angle, direction} = opts

    assert (tip? and length? and angle? and
            direction? and (tip instanceof Point))

    direction = to_radians direction
    angle = to_radians angle

    th1 = Math.PI + direction - angle
    start = tip.shift (length * (Math.cos th1)),
              (length * (Math.sin th1))
    th2 = Math.PI + direction + angle
    end = tip.shift (length * (Math.cos th2)),
              (length * (Math.sin th2))

    p = p.moveto(start).lineto(tip).lineto(end)
    return p

  make_closed_path: (pts) ->
    ret = Path().moveto pts[0]
    for pt in pts[1..]
      ret = ret.lineto pt
    return ret.closepath().print()

for k, v of SVG
  exports[k] = v
