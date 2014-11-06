{
  EPSILON, Point, Polygon, Segment
} = require 'geometry.coffee'

A = new Point 0, 0
B = new Point 100, 0
C = new Point 0, 70
D = new Point 80, 30

E = new Point 15, 15
ABC = new Polygon [A, B, C]

TEST_CASES = [
  {
    func: Segment.dist_to_pt
    args: [(new Segment A, B), D]
    almost_expected: [30, 0.000001]
  }
  {
    func: ABC.contains.bind ABC
    args: [E, {buffer: 20}]
    expected: false
  }
  {
    func: ABC.contains.bind ABC
    args: [E, {buffer: 12}]
    expected: true
  }
]

for test_case in TEST_CASES
  {func, args} = test_case
  result = func.apply null, args

  if test_case.expected?
    if result isnt test_case.expected
      console.log test_case, result
      throw new Error "Test case failed!"

  else if test_case.almost_expected?
    [val, error] = test_case.almost_expected
    if Math.abs(result - val) > error
      console.log test_case
      throw new Error "Test case failed!"
