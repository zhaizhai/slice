class TieredScorer
  constructor: (@tiers, @max = null) ->

  score: (x) ->
    if @max? and x > @max
      console.warn "Maximum score #{@max} exceeded (got #{x})"

    idx = @tiers.length - 1
    while idx >= 0
      if x > @tiers[idx]
        return idx + 1
      idx -= 1
    return 0


exports.TieredScorer = TieredScorer