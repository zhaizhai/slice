

class ToolInfo
  constructor: ({@cost, @icon}) ->


TOOLS = [
  locator:
    icon: (require 'toolbox/locator_icon.coffee')
    cost: 0

  ruler:
    icon: (require 'toolbox/ruler_icon.coffee')
    cost: 0

  variables:
    icon: {}
    cost: 600

  calculator:
    icon: {} # TODO
    cost: 1000
}
