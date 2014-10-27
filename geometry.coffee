assert = require 'assert'

class Point
  @dist = (p1, p2) ->
    dx = p1.x - p2.x
    dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)

  @cross_area = (p1, p2) ->
    return p1.x * p2.y - p1.y * p2.x

  constructor: (@x, @y) ->

  shift: (x, y) ->
    return new Point (@x + x), (@y + y)

  diff: (pt) ->
    return new Point (@x - pt.x), (@y - pt.y)


class Segment
  @crosses = (seg1, seg2, tolerance = 0.001) ->
    # TODO: tolerance
    # TODO: handle degenerate cases

    a1 = Point.cross_area (seg2.start.diff seg1.start),
           (seg2.start.diff seg1.end)
    a2 = Point.cross_area (seg2.end.diff seg1.start),
           (seg2.end.diff seg1.end)
    if (a1 is 0) or (a2 is 0) or ((a1 < 0) is (a2 < 0))
      return false

    b1 = Point.cross_area (seg1.start.diff seg2.start),
           (seg1.start.diff seg2.end)
    b2 = Point.cross_area (seg1.end.diff seg2.start),
           (seg1.end.diff seg2.end)
    if (b1 is 0) or (b2 is 0) or ((b1 < 0) is (b2 < 0))
      return false

    return true

  constructor: (@start, @end) ->


class Polygon
  constructor: (@pts) ->
    assert @pts.length >= 3, "Must have at least 3 points!"

  points: -> @pts

  segments: ->
    segs = []
    for cur, idx in @pts
      next = @pts[(idx + 1) % @pts.length]
      segs.push (new Segment cur, next)
    return segs

  intersects: (poly) ->
    other_segs = poly.segments()
    for seg1 in @segments()
      for seg2 in other_segs
        if Segment.crosses seg1, seg2
          console.log seg1, 'crosses', seg2
          return true
    return false

  contains: (pt) ->
    sign = null
    for seg in @segments()
      s = seg.start.diff(pt)
      e = seg.end.diff(pt)
      cur_sign = ((Point.cross_area s, e) < 0)
      if not sign?
        sign = cur_sign
      else if cur_sign isnt sign
        return false
    return true

  area: ->
    pts = @pts.slice()
    pts.push @pts[0]

    ret = 0
    for cur, idx in @pts
      next = pts[idx + 1]
      ret +=  Point.cross_area cur, next
    return Math.abs(ret) / 2



exports.Point = Point
exports.Segment = Segment
exports.Polygon = Polygon


# # test code
# seg1 = new Segment (new Point 100, 0), (new Point 0, 100)
# seg2 = new Segment (new Point 55, -45), (new Point 55, 55)

# console.log (Segment.crosses seg1, seg2)