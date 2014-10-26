{Level1} = require 'levels/level1.coffee'

rand_int = (n) ->
  return Math.floor (Math.random() * n)
rand_choice = (list) ->
  return list[(rand_int list.length)]

LEVELS =
  l1: Level1

exports.load = (lname) ->
  level = LEVELS[lname]

  possible = ((100 + 2 * i) for i in [0..50])
  w = rand_choice possible
  level.generate {w}
  return level
