{Level1} = require 'levels/level1.coffee'
{Level2} = require 'levels/level2.coffee'

rand_int = (n) ->
  return Math.floor (Math.random() * n)
rand_choice = (list) ->
  return list[(rand_int list.length)]

LEVELS =
  l1: Level1
  l2: Level2

exports.load = (lname) ->
  level = LEVELS[lname]
  if not level? then return null

  params = {}
  for k, choices of level.param_choices
    params[k] = rand_choice choices
  level.generate params
  return level
