SVG = require 'svg.coffee'
Path = require 'paths-js/path'
{EventEmitter} = require 'events'
{HookBinding} = require 'levels/base.coffee'
{Point} = require 'geometry.coffee'

{ToolGraphics} = require 'toolbox/graphics.coffee'
{SELECTED_ICON, UNSELECTED_ICON} = require 'toolbox/ruler_icon.coffee'

class Ruler extends EventEmitter
  constructor: (@level, @level_data, @scene) ->
    @_start = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'selected'
    @_end = new HookBinding @level, 3, (pt_id) =>
      return @_make_node pt_id, 'selected'
    @_gfx = new ToolGraphics @level

  _rule_overlay: (start, end) ->
    u = end.diff start
    if u.x is 0 and u.y is 0
      throw new Error "start and end can't coincide!"
    v = new Point u.y, -u.x
    v = v.scale (1 / v.length())

    gap = 7
    width = 6
    [l1, l2, l3] = [gap, (gap + width), (gap + 2 * width)]

    d = Path()
    d = d.moveto(start.plus (v.scale l1))
         .lineto(start.plus (v.scale l3))
    d = d.moveto(end.plus (v.scale l1))
         .lineto(end.plus (v.scale l3))
    d = d.moveto(start.plus (v.scale l2))
         .lineto(end.plus (v.scale l2))

    return SVG.path {
      d: d.print()
      stroke: 'black'
      'stroke-width': 2
    }

  icons:
    selected: SELECTED_ICON
    unselected: UNSELECTED_ICON

  activate: ->
    for pt_id in @level_data.points
      do (pt_id) =>
        @level.set_render_hook pt_id, {
          precedence: 0
          render: =>
            return @_make_node pt_id, 'default'
        }

    @scene.mousemove (e) =>
      if not @_start.get()? or @_end.get()?
        return

      start_pt = @level.get @_start.get()
      overlay = @_rule_overlay start_pt, (new Point e.x, e.y)
      @scene.set_overlay overlay

  deactivate: ->
    @_start.set null
    @_end.set null

  cost: 1

  set_start: (id) ->
    @_start.set id

  set_end: (id) ->
    if not id?
      @_end.set null
      return

    if @_start.get() is id
      # deselecting
      @_start.set null
      @scene.set_overlay null

    else
      @_end.set id
      start_pt = @level.get @_start.get()
      end_pt = @level.get @_end.get()
      @scene.set_overlay (@_rule_overlay start_pt, end_pt)

  _make_node: (pt_id, status) ->
    return @_gfx.make_node pt_id, {
      status: status
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
    if not start? or not end? then return null

    start = @level.get start
    end = @level.get end
    len = Point.dist start, end

    return {
      ref: start # TODO
      mesg: "Length is #{len}"
      mouseover: =>
      mouseout: =>
    }


exports.Ruler = Ruler
