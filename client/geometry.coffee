assert = require 'assert'

exports.EPSILON = EPSILON = 0.001


class Point
  @dot = (p1, p2) ->
    return p1.x * p2.x + p1.y * p2.y

  @dist = (p1, p2) ->
    dx = p1.x - p2.x
    dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)

  @cross_area = (p1, p2) ->
    return p1.x * p2.y - p1.y * p2.x

  constructor: (@x, @y) ->

  plus: (pt) ->
    return new Point (@x + pt.x), (@y + pt.y)

  shift: (x, y) ->
    return new Point (@x + x), (@y + y)

  diff: (pt) ->
    return new Point (@x - pt.x), (@y - pt.y)

  length: ->
    return Math.sqrt(@x * @x + @y * @y)

  scale: (r) ->
    return new Point (@x * r), (@y * r)


class Segment
  @crosses = (seg1, seg2, tolerance = EPSILON) ->
    # TODO: handle degenerate cases

    a1 = Point.cross_area (seg2.start.diff seg1.start),
           (seg2.start.diff seg1.end)
    a2 = Point.cross_area (seg2.end.diff seg1.start),
           (seg2.end.diff seg1.end)

    eps = tolerance * seg1.length()
    if Math.abs(a1) < eps or Math.abs(a2) < eps
      return false
    if (a1 < 0) is (a2 < 0)
      return false

    b1 = Point.cross_area (seg1.start.diff seg2.start),
           (seg1.start.diff seg2.end)
    b2 = Point.cross_area (seg1.end.diff seg2.start),
           (seg1.end.diff seg2.end)

    eps = tolerance * seg2.length()
    if Math.abs(b1) < eps or Math.abs(b2) < eps
      return false
    if (b1 < 0) is (b2 < 0)
      return false

    return true

  @dist_to_pt = (seg, pt) ->
    s = seg.start.diff(pt)
    e = seg.end.diff(pt)
    v = seg.end.diff(seg.start)

    ds = Point.dot s, v
    de = Point.dot e, v
    if ds < 0 and de < 0
      return Point.dist pt, seg.end
    if ds > 0 and de > 0
      return Point.dist pt, seg.start

    a = Point.cross_area s, e
    return Math.abs (a / v.length())

  constructor: (@start, @end) ->

  length: -> (@end.diff @start).length()


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

  # TODO: this algorithm is not actually correct for non-convex shapes
  contains: (pt, opts = {}) ->
    {buffer} = opts
    buffer ?= 0
    assert buffer >= 0, "Can't have negative buffer"

    [has_pos, has_neg] = [false, false]
    for seg in @segments()
      s = seg.start.diff(pt)
      e = seg.end.diff(pt)
      a = Point.cross_area s, e

      d = Segment.dist_to_pt seg, pt
      if d < buffer
        return false

      if a < 0
        has_neg = true
      else if a > 0
        has_pos = true

    if has_neg and has_pos
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


class Circle
  constructor: (@center, @radius) ->


exports.Point = Point
exports.Segment = Segment
exports.Polygon = Polygon
exports.Circle = Circle

# # test code
# seg1 = new Segment (new Point 100, 0), (new Point 0, 100)
# seg2 = new Segment (new Point 55, -45), (new Point 55, 55)

# console.log (Segment.crosses seg1, seg2)