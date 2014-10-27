SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{EventEmitter} = require 'events'
{HookBinding} = require 'levels/base.coffee'
{Point} = require 'geometry.coffee'

class Ruler extends EventEmitter
  constructor: (@level, @scene) ->
    @_start = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'purple'
    @_end = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'purple'

  activate: ->
    for i in [0...4]
      pt_id = 'p' + i
      do (pt_id) =>
        @level.set_render_hook pt_id, {
          precedence: 0
          render: =>
            return @_make_node pt_id, 'red'
        }

    @scene.mousemove (e) =>
      if not @_start.get()? or @_end.get()?
        return

      start_pt = @level.get @_start.get()
      overlay = SVG.path {
        d: Path().moveto(start_pt).lineto(e).print()
        stroke: 'green'
      }
      @scene.set_overlay overlay

  deactivate: ->
    @_start.set null
    @_end.set null

  cost: 1

  icon_elt: ->
    ret = ($ '<div></div>').css {
      'background-color': 'blue'
      width: 30
      height: 30
    }
    return ret

  set_start: (id) ->
    @_start.set id

  set_end: (id) ->
    if not id?
      @_end.set null
      return

    if @_start.get() is id
      # deselecting
      @_start.set null

    else
      @_end.set id
      start_pt = @level.get @_start.get()
      end_pt = @level.get @_end.get()
      overlay = SVG.path {
        d: Path().moveto(start_pt).lineto(end_pt).print()
        stroke: 'green'
      }
      @scene.set_overlay overlay

  _make_node: (pt_id, color) ->
    pt = @level.get pt_id
    return SVG.circle {
      cx: pt.x, cy: pt.y, r: 6,
      fill: color, stroke: 'black'

      mouseenter: (e) =>
        console.log 'mouse enter', pt_id
        # @hover pt_id
      # mouseleave: (e) =>
      #   @hover null
      click: (e) =>
        start = @_start.get()
        end = @_end.get()

        console.log 'click', start, end, pt_id

        if not start?
          @set_start pt_id
        else if not end?
          @set_end pt_id
        else
          @set_start pt_id
          @set_end null
          @scene.set_overlay null
        @emit 'change'
    }

  measure: ->
    start = @_start.get()
    end = @_end.get()
    if not start? or not send? then return

    start = @level.get start
    end = @level.get end
    len = Point.dist start, end

    @emit 'measurement', {
      ref: start # TODO
      mesg: "Length is #{len}"
      # mouseover: =>
      #   @highlight sel
      # mouseout: =>
      #   @highlight null
    }


exports.Ruler = Ruler
