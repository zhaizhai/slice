(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var Circle, EPSILON, Point, Polygon, Segment, assert;

  assert = require('assert');

  exports.EPSILON = EPSILON = 0.001;

  Point = (function() {
    Point.dot = function(p1, p2) {
      return p1.x * p2.x + p1.y * p2.y;
    };

    Point.dist = function(p1, p2) {
      var dx, dy;
      dx = p1.x - p2.x;
      dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    Point.cross_area = function(p1, p2) {
      return p1.x * p2.y - p1.y * p2.x;
    };

    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    Point.prototype.plus = function(pt) {
      return new Point(this.x + pt.x, this.y + pt.y);
    };

    Point.prototype.shift = function(x, y) {
      return new Point(this.x + x, this.y + y);
    };

    Point.prototype.diff = function(pt) {
      return new Point(this.x - pt.x, this.y - pt.y);
    };

    Point.prototype.length = function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    Point.prototype.scale = function(r) {
      return new Point(this.x * r, this.y * r);
    };

    return Point;

  })();

  Segment = (function() {
    Segment.crosses = function(seg1, seg2, tolerance) {
      var a1, a2, b1, b2, eps;
      if (tolerance == null) {
        tolerance = EPSILON;
      }
      a1 = Point.cross_area(seg2.start.diff(seg1.start), seg2.start.diff(seg1.end));
      a2 = Point.cross_area(seg2.end.diff(seg1.start), seg2.end.diff(seg1.end));
      eps = tolerance * seg1.length();
      if (Math.abs(a1) < eps || Math.abs(a2) < eps) {
        return false;
      }
      if ((a1 < 0) === (a2 < 0)) {
        return false;
      }
      b1 = Point.cross_area(seg1.start.diff(seg2.start), seg1.start.diff(seg2.end));
      b2 = Point.cross_area(seg1.end.diff(seg2.start), seg1.end.diff(seg2.end));
      eps = tolerance * seg2.length();
      if (Math.abs(b1) < eps || Math.abs(b2) < eps) {
        return false;
      }
      if ((b1 < 0) === (b2 < 0)) {
        return false;
      }
      return true;
    };

    Segment.dist_to_pt = function(seg, pt) {
      var a, de, ds, e, s, v;
      s = seg.start.diff(pt);
      e = seg.end.diff(pt);
      v = seg.end.diff(seg.start);
      ds = Point.dot(s, v);
      de = Point.dot(e, v);
      if (ds < 0 && de < 0) {
        return Point.dist(pt, seg.end);
      }
      if (ds > 0 && de > 0) {
        return Point.dist(pt, seg.start);
      }
      a = Point.cross_area(s, e);
      return Math.abs(a / v.length());
    };

    function Segment(start, end) {
      this.start = start;
      this.end = end;
    }

    Segment.prototype.length = function() {
      return (this.end.diff(this.start)).length();
    };

    return Segment;

  })();

  Polygon = (function() {
    function Polygon(pts) {
      this.pts = pts;
      assert(this.pts.length >= 3, "Must have at least 3 points!");
    }

    Polygon.prototype.points = function() {
      return this.pts;
    };

    Polygon.prototype.segments = function() {
      var cur, idx, next, segs, _i, _len, _ref;
      segs = [];
      _ref = this.pts;
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        cur = _ref[idx];
        next = this.pts[(idx + 1) % this.pts.length];
        segs.push(new Segment(cur, next));
      }
      return segs;
    };

    Polygon.prototype.intersects = function(poly) {
      var other_segs, seg1, seg2, _i, _j, _len, _len1, _ref;
      other_segs = poly.segments();
      _ref = this.segments();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        seg1 = _ref[_i];
        for (_j = 0, _len1 = other_segs.length; _j < _len1; _j++) {
          seg2 = other_segs[_j];
          if (Segment.crosses(seg1, seg2)) {
            console.log(seg1, 'crosses', seg2);
            return true;
          }
        }
      }
      return false;
    };

    Polygon.prototype.contains = function(pt, opts) {
      var a, buffer, d, e, has_neg, has_pos, s, seg, _i, _len, _ref, _ref1;
      if (opts == null) {
        opts = {};
      }
      buffer = opts.buffer;
      if (buffer == null) {
        buffer = 0;
      }
      assert(buffer >= 0, "Can't have negative buffer");
      _ref = [false, false], has_pos = _ref[0], has_neg = _ref[1];
      _ref1 = this.segments();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        seg = _ref1[_i];
        s = seg.start.diff(pt);
        e = seg.end.diff(pt);
        a = Point.cross_area(s, e);
        d = Segment.dist_to_pt(seg, pt);
        if (d < buffer) {
          return false;
        }
        if (a < 0) {
          has_neg = true;
        } else if (a > 0) {
          has_pos = true;
        }
      }
      if (has_neg && has_pos) {
        return false;
      }
      return true;
    };

    Polygon.prototype.area = function() {
      var cur, idx, next, pts, ret, _i, _len, _ref;
      pts = this.pts.slice();
      pts.push(this.pts[0]);
      ret = 0;
      _ref = this.pts;
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        cur = _ref[idx];
        next = pts[idx + 1];
        ret += Point.cross_area(cur, next);
      }
      return Math.abs(ret) / 2;
    };

    return Polygon;

  })();

  Circle = (function() {
    function Circle(center, radius) {
      this.center = center;
      this.radius = radius;
    }

    return Circle;

  })();

  exports.Point = Point;

  exports.Segment = Segment;

  exports.Polygon = Polygon;

  exports.Circle = Circle;

}).call(this);

},{"assert":7}],2:[function(require,module,exports){
(function() {
  var DEFAULT_FUNCTIONS, PRECEDENCE, TOKEN_REGEX, assert, evaluate, get_prefix, get_syntax_tree, get_syntax_tree_helper, tokenize, util;

  assert = require('assert');

  util = require('util');

  DEFAULT_FUNCTIONS = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'sqrt', 'ceil', 'floor'];

  TOKEN_REGEX = {
    VARIABLE: /^[a-zA-Z][a-zA-Z0-9]*/,
    FUNCTION: /^[a-zA-Z][a-zA-Z0-9]*\(/,
    NUMBER: /^[-+]?[0-9]*\.?[0-9]+/,
    OPERATION: /^[\^*/+-]/,
    OPEN_PAREN: /^\(/,
    CLOSE_PAREN: /^\)/,
    COMMA: /^,/
  };

  PRECEDENCE = {
    '^': 3,
    '*': 2,
    '/': 2,
    '+': 1,
    '-': 1
  };

  get_prefix = function(expression_str, token_type) {
    var match, prefix;
    if (!(match = TOKEN_REGEX[token_type].exec(expression_str))) {
      return "";
    }
    prefix = match[0];
    return prefix;
  };

  tokenize = function(expression_str) {
    var c, function_prefix, ix, k, number_prefix, substr, token_list, token_type_matched, v, variable_prefix, _ref;
    token_list = [];
    ix = 0;
    while (ix < expression_str.length) {
      substr = expression_str.slice(ix, expression_str.length);
      c = expression_str[ix];
      if (c === ' ') {
        ix += 1;
        continue;
      }
      function_prefix = get_prefix(substr, 'FUNCTION');
      if (function_prefix.length > 0) {
        token_list.push({
          token_type: 'FUNCTION',
          token_name: function_prefix.slice(0, function_prefix.length - 1)
        });
        token_list.push({
          token_type: 'OPEN_PAREN',
          token_name: '('
        });
        ix += function_prefix.length;
        continue;
      }
      variable_prefix = get_prefix(substr, 'VARIABLE');
      if (variable_prefix.length > 0) {
        token_list.push({
          token_type: 'VARIABLE',
          token_name: variable_prefix
        });
        ix += variable_prefix.length;
        continue;
      }
      number_prefix = get_prefix(substr, 'NUMBER');
      if (number_prefix.length > 0 && (token_list.length === 0 || ((_ref = token_list[token_list.length - 1].token_type) === 'OPERATION' || _ref === 'OPEN_PAREN' || _ref === 'CLOSE_PAREN' || _ref === 'COMMA'))) {
        token_list.push({
          token_type: 'NUMBER',
          token_name: number_prefix
        });
        ix += number_prefix.length;
        continue;
      }
      token_type_matched = false;
      for (k in TOKEN_REGEX) {
        v = TOKEN_REGEX[k];
        if (v.exec(c) != null) {
          token_list.push({
            token_type: k,
            token_name: c
          });
          ix += 1;
          token_type_matched = true;
          break;
        }
      }
      if (token_type_matched) {
        continue;
      }
      assert(false, "Token invalid " + substr);
    }
    return token_list;
  };

  get_syntax_tree = function(expression_str) {
    var token_list;
    assert(expression_str.length > 0);
    token_list = tokenize(expression_str);
    return get_syntax_tree_helper(token_list);
  };

  get_syntax_tree_helper = function(token_list) {
    var best_depth, best_token, best_token_index, depth, function_args, i, left_token_list, right_token_list, t, _i, _ref, _ref1, _ref2, _ref3;
    assert(token_list.length > 0);
    depth = 0;
    best_token_index = -1;
    best_depth = -1;
    for (i = _i = 0, _ref = token_list.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      t = token_list[i];
      switch (t.token_type) {
        case 'OPEN_PAREN':
          depth += 1;
          break;
        case 'CLOSE_PAREN':
          depth -= 1;
          break;
        case 'OPERATION':
          if (best_token_index === -1 || depth < best_depth || (depth === best_depth && PRECEDENCE[t.token_name] <= PRECEDENCE[token_list[best_token_index].token_name])) {
            best_token_index = i;
            best_depth = depth;
          }
      }
      assert(depth >= 0);
    }
    assert(depth === 0);
    if (best_depth === 0) {
      assert(best_token_index > 0);
      assert(best_token_index < token_list.length);
      left_token_list = token_list.slice(0, best_token_index);
      right_token_list = token_list.slice(best_token_index + 1, token_list.length);
      best_token = token_list[best_token_index];
      return {
        token_type: best_token.token_type,
        token_name: best_token.token_name,
        children: [get_syntax_tree_helper(left_token_list), get_syntax_tree_helper(right_token_list)]
      };
    }
    t = token_list[0];
    if ((_ref1 = t.token_type) === 'FUNCTION') {
      assert(token_list.length >= 3);
      assert(token_list[1].token_type === 'OPEN_PAREN');
      assert(token_list[token_list.length - 1].token_type === 'CLOSE_PAREN');
      function_args = token_list.slice(2, token_list.length - 1);
      return {
        token_type: t.token_type,
        token_name: t.token_name,
        children: [get_syntax_tree_helper(function_args)]
      };
    }
    if ((_ref2 = t.token_type) === 'VARIABLE' || _ref2 === 'NUMBER') {
      assert(token_list.length === 1);
      return {
        token_type: t.token_type,
        token_name: t.token_name
      };
    }
    if ((_ref3 = t.token_type) === 'OPEN_PAREN') {
      assert(token_list[token_list.length - 1].token_type === 'CLOSE_PAREN');
      return get_syntax_tree_helper(token_list.slice(1, token_list.length - 1));
    }
    return assert(false, "invalid");
  };

  evaluate = function(syntax_tree, user_functions, user_variables) {
    var elt, evaluated_children, fn, i, more_variables, sub_tree, _i, _ref;
    switch (syntax_tree.token_type) {
      case 'NUMBER':
        return parseFloat(syntax_tree.token_name);
      case 'VARIABLE':
        assert(syntax_tree.token_name in user_variables);
        return user_variables[syntax_tree.token_name];
      case 'OPERATION':
        evaluated_children = (function() {
          var _i, _len, _ref, _results;
          _ref = syntax_tree.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elt = _ref[_i];
            _results.push(evaluate(elt, user_functions, user_variables));
          }
          return _results;
        })();
        switch (syntax_tree.token_name) {
          case '+':
            return evaluated_children.reduce(function(t, s) {
              return t + s;
            });
          case '*':
            return evaluated_children.reduce(function(t, s) {
              return t * s;
            });
          case '^':
            assert(evaluated_children.length === 2);
            return Math.pow(evaluated_children[0], evaluated_children[1]);
          case '/':
            assert(evaluated_children.length === 2);
            assert(evaluated_children[1] !== 0);
            return evaluated_children[0] / evaluated_children[1];
          case '-':
            assert(evaluated_children.length === 2);
            return evaluated_children[0] - evaluated_children[1];
        }
        break;
      case 'FUNCTION':
        assert(syntax_tree.token_name in user_functions);
        fn = user_functions[syntax_tree.token_name];
        assert(fn.inputs.length === syntax_tree.children.length);
        evaluated_children = (function() {
          var _i, _len, _ref, _results;
          _ref = syntax_tree.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elt = _ref[_i];
            _results.push(evaluate(elt, user_functions, user_variables));
          }
          return _results;
        })();
        sub_tree = get_syntax_tree(fn.output_expression_str);
        more_variables = user_variables;
        for (i = _i = 0, _ref = fn.inputs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          more_variables[fn.inputs[i]] = evaluated_children[i];
        }
        return evaluate(sub_tree, user_functions, more_variables);
    }
    return assert(false);
  };

  exports.tokenize = tokenize;

  exports.get_syntax_tree = get_syntax_tree;

  exports.get_syntax_tree_helper = get_syntax_tree_helper;

  exports.evaluate = evaluate;

  exports.evaluate_string = function(s) {
    var ast, e;
    try {
      ast = get_syntax_tree_helper(s);
      return evaluate(ast, {}, {});
    } catch (_error) {
      e = _error;
      throw new Error("Syntax error in input: \"" + s + "\"");
    }
  };

}).call(this);

},{"assert":7,"util":11}],3:[function(require,module,exports){
(function() {
  var Path, Point, SVG, assert, k, to_radians, v,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  assert = require('assert');

  Path = require('paths-js/path');

  Point = require('geometry.coffee').Point;

  SVG = (function() {
    var MOUSE_EVTS, PRIMITIVES, SVG_NS, create_elt, make_primitive, prim, _i, _len;

    function SVG() {}

    SVG_NS = "http://www.w3.org/2000/svg";

    MOUSE_EVTS = ['mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'click'];

    PRIMITIVES = ['g', 'circle', 'path', 'animate', 'text'];

    create_elt = function(type, attrs, children) {
      var child, k, ret, v, _i, _len;
      if (children == null) {
        children = [];
      }
      ret = document.createElementNS(SVG_NS, type);
      for (k in attrs) {
        v = attrs[k];
        if (__indexOf.call(MOUSE_EVTS, k) >= 0) {
          (function(v) {
            return ret.addEventListener(k, function() {
              var args;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return v.apply(ret, args);
            });
          })(v);
          continue;
        }
        ret.setAttribute(k, v);
      }
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        ret.appendChild(child);
      }
      return ret;
    };

    SVG.attrs = function(elt, new_attrs) {
      var k, v;
      for (k in new_attrs) {
        v = new_attrs[k];
        elt.setAttribute(k, v);
      }
      return elt;
    };

    SVG.root = function(width, height) {
      var ret;
      ret = document.createElementNS(SVG_NS, 'svg');
      ret.setAttribute('width', width);
      ret.setAttribute('height', height);
      return ret;
    };

    make_primitive = function(prim) {
      return SVG[prim] = function(attrs, children) {
        return create_elt(prim, attrs, children);
      };
    };

    for (_i = 0, _len = PRIMITIVES.length; _i < _len; _i++) {
      prim = PRIMITIVES[_i];
      make_primitive(prim);
    }

    return SVG;

  })();

  to_radians = function(deg) {
    return Math.PI * deg / 180;
  };

  exports.util = {
    arrow: function(p, opts) {
      var angle, direction, end, length, start, th1, th2, tip;
      tip = opts.tip, length = opts.length, angle = opts.angle, direction = opts.direction;
      assert((tip != null) && (length != null) && (angle != null) && (direction != null) && (tip instanceof Point));
      direction = to_radians(direction);
      angle = to_radians(angle);
      th1 = Math.PI + direction - angle;
      start = tip.shift(length * (Math.cos(th1)), length * (Math.sin(th1)));
      th2 = Math.PI + direction + angle;
      end = tip.shift(length * (Math.cos(th2)), length * (Math.sin(th2)));
      p = p.moveto(start).lineto(tip).lineto(end);
      return p;
    },
    make_closed_path: function(pts) {
      var pt, ret, _i, _len, _ref;
      ret = Path().moveto(pts[0]);
      _ref = pts.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pt = _ref[_i];
        ret = ret.lineto(pt);
      }
      return ret.closepath().print();
    }
  };

  for (k in SVG) {
    v = SVG[k];
    exports[k] = v;
  }

}).call(this);

},{"assert":7,"geometry.coffee":1,"paths-js/path":6}],4:[function(require,module,exports){
(function() {
  var LOCATOR_SVG_PATHS, Path, SVG, border, cross, make_icon, ticks, _ref;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  LOCATOR_SVG_PATHS = function() {
    var border, corners, cross, cur_x, cur_y, dk, dx, dy, i, k, l, lambda, next_x, next_y, offset, r, s, tick_x, tick_y, ticks, x, y, _i, _j, _ref, _ref1, _ref2, _ref3, _ref4;
    r = 6;
    s = 50;
    border = Path().moveto(s - r, 0).arc(r, r, 0, 0, 1, s, r).lineto(s, s - r).arc(r, r, 0, 0, 1, s - r, s).lineto(r, s).arc(r, r, 0, 0, 1, 0, s - r).lineto(0, r).arc(r, r, 0, 0, 1, r, 0).closepath();
    l = 0.35 * s;
    cross = Path().moveto(s / 2 - l, s / 2).lineto(s / 2 + l, s / 2).moveto(s / 2, s / 2 - l).lineto(s / 2, s / 2 + l);
    k = 5;
    corners = [[0, 0], [s, 0], [s, s], [0, s]];
    ticks = Path();
    for (i = _i = 0; _i < 4; i = ++_i) {
      _ref = corners[i], cur_x = _ref[0], cur_y = _ref[1];
      _ref1 = corners[(i + 1) % 4], next_x = _ref1[0], next_y = _ref1[1];
      _ref2 = [next_x - cur_x, next_y - cur_y], dx = _ref2[0], dy = _ref2[1];
      _ref3 = [-5 * dy / s, 5 * dx / s], tick_x = _ref3[0], tick_y = _ref3[1];
      for (i = _j = 0; 0 <= k ? _j < k : _j > k; i = 0 <= k ? ++_j : --_j) {
        dk = i - Math.floor(k / 2);
        offset = dk / (k - 1) * (s - 3 * r);
        lambda = 1 / 2 + offset / s;
        _ref4 = [cur_x + lambda * dx, cur_y + lambda * dy], x = _ref4[0], y = _ref4[1];
        ticks = ticks.moveto(x, y).lineto(x + tick_x, y + tick_y);
      }
    }
    return {
      border: border,
      cross: cross,
      ticks: ticks
    };
  };

  make_icon = function(svg) {
    var ret, svg_container;
    ret = $('<div></div>');
    svg_container = SVG.root(52, 52);
    svg_container.appendChild(svg);
    ret.append(svg_container);
    return ret;
  };

  _ref = LOCATOR_SVG_PATHS(), border = _ref.border, cross = _ref.cross, ticks = _ref.ticks;

  exports.UNSELECTED_ICON = make_icon(SVG.g({
    transform: "translate(1, 1)"
  }, [
    SVG.path({
      d: border.print(),
      fill: 'none',
      stroke: 'gray',
      'stroke-width': 2
    }), SVG.path({
      d: cross.print(),
      fill: 'none',
      stroke: 'gray',
      'stroke-width': 3
    }), SVG.path({
      d: ticks.print(),
      fill: 'none',
      stroke: 'gray',
      'stroke-width': 2
    })
  ]));

  exports.SELECTED_ICON = make_icon(SVG.g({
    transform: "translate(1, 1)"
  }, [
    SVG.path({
      d: border.print(),
      fill: '#ffffaa',
      stroke: 'black',
      'stroke-width': 2
    }), SVG.path({
      d: cross.print(),
      fill: 'none',
      stroke: 'black',
      'stroke-width': 3
    }), SVG.path({
      d: ticks.print(),
      fill: 'none',
      stroke: 'black',
      'stroke-width': 2
    })
  ]));

}).call(this);

},{"paths-js/path":6,"svg.coffee":3}],5:[function(require,module,exports){
(function() {
  var Path, RULER_SVG_PATHS, SVG, border, make_icon, ruler, ticks, _ref;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  RULER_SVG_PATHS = function() {
    var a, b, border, gap, i, k, offset, r, ruler, s, start_x, start_y, t, ticks, _i, _ref, _ref1;
    r = 6;
    s = 50;
    border = Path().moveto(s - r, 0).arc(r, r, 0, 0, 1, s, r).lineto(s, s - r).arc(r, r, 0, 0, 1, s - r, s).lineto(r, s).arc(r, r, 0, 0, 1, 0, s - r).lineto(0, r).arc(r, r, 0, 0, 1, r, 0).closepath();
    _ref = [0.15 * s, 0.05 * s], a = _ref[0], b = _ref[1];
    ruler = Path().moveto(a - b, s - a - b).lineto(a + b, s - a + b).lineto(s - a + b, a + b).lineto(s - a - b, a - b).closepath();
    k = 8;
    ticks = Path();
    t = 0.04 * s;
    _ref1 = [a + b, s - a + b], start_x = _ref1[0], start_y = _ref1[1];
    gap = s - 2 * a;
    for (i = _i = 1; 1 <= k ? _i < k : _i > k; i = 1 <= k ? ++_i : --_i) {
      offset = i * gap / k;
      ticks = ticks.moveto(start_x + offset, start_y - offset).lineto(start_x + offset - t, start_y - offset - t);
    }
    return {
      border: border,
      ruler: ruler,
      ticks: ticks
    };
  };

  make_icon = function(svg) {
    var ret, svg_container;
    ret = $('<div></div>');
    svg_container = SVG.root(52, 52);
    svg_container.appendChild(svg);
    ret.append(svg_container);
    return ret;
  };

  _ref = RULER_SVG_PATHS(), border = _ref.border, ruler = _ref.ruler, ticks = _ref.ticks;

  exports.UNSELECTED_ICON = make_icon(SVG.g({
    transform: "translate(1, 1)"
  }, [
    SVG.path({
      d: border.print(),
      fill: 'none',
      stroke: 'gray',
      'stroke-width': 2
    }), SVG.path({
      d: ruler.print(),
      fill: 'none',
      stroke: 'gray',
      'stroke-width': 2
    }), SVG.path({
      d: ticks.print(),
      fill: 'none',
      stroke: 'gray',
      'stroke-width': 2
    })
  ]));

  exports.SELECTED_ICON = make_icon(SVG.g({
    transform: "translate(1, 1)"
  }, [
    SVG.path({
      d: border.print(),
      fill: '#aaaaff',
      stroke: 'black',
      'stroke-width': 2
    }), SVG.path({
      d: ruler.print(),
      fill: '#ffdd00',
      stroke: 'black',
      'stroke-width': 2
    }), SVG.path({
      d: ticks.print(),
      fill: 'none',
      stroke: 'black',
      'stroke-width': 2
    })
  ]));

}).call(this);

},{"paths-js/path":6,"svg.coffee":3}],6:[function(require,module,exports){
(function (global){
// Generated by uRequire v{NO_VERSION} - template: 'nodejs' 
(function (window, global) {
  
var __isAMD = !!(typeof define === 'function' && define.amd),
    __isNode = (typeof exports === 'object'),
    __isWeb = !__isNode;
;

module.exports = (function () {
  var Path;
  Path = function (init) {
    var areEqualPoints, instructions, plus, point, printInstrunction, push, verbosify;
    instructions = init || [];
    push = function (arr, el) {
      var copy;
      copy = arr.slice(0, arr.length);
      copy.push(el);
      return copy;
    };
    areEqualPoints = function (p1, p2) {
      return p1[0] === p2[0] && p1[1] === p2[1];
    };
    printInstrunction = function (_arg) {
      var command, params;
      command = _arg.command, params = _arg.params;
      return "" + command + " " + params.join(" ");
    };
    point = function (_arg, _arg1) {
      var command, params, prev_x, prev_y;
      command = _arg.command, params = _arg.params;
      prev_x = _arg1[0], prev_y = _arg1[1];
      switch (command) {
      case "M":
        return [
          params[0],
          params[1]
        ];
      case "L":
        return [
          params[0],
          params[1]
        ];
      case "H":
        return [
          params[0],
          prev_y
        ];
      case "V":
        return [
          prev_x,
          params[0]
        ];
      case "Z":
        return null;
      case "C":
        return [
          params[4],
          params[5]
        ];
      case "S":
        return [
          params[2],
          params[3]
        ];
      case "Q":
        return [
          params[2],
          params[3]
        ];
      case "T":
        return [
          params[0],
          params[1]
        ];
      case "A":
        return [
          params[5],
          params[6]
        ];
      }
    };
    verbosify = function (keys, f) {
      return function (a) {
        var args;
        args = typeof a === "object" ? keys.map(function (k) {
          return a[k];
        }) : arguments;
        return f.apply(null, args);
      };
    };
    plus = function (instruction) {
      return Path(push(instructions, instruction));
    };
    return {
      moveto: verbosify([
        "x",
        "y"
      ], function (x, y) {
        return plus({
          command: "M",
          params: [
            x,
            y
          ]
        });
      }),
      lineto: verbosify([
        "x",
        "y"
      ], function (x, y) {
        return plus({
          command: "L",
          params: [
            x,
            y
          ]
        });
      }),
      hlineto: verbosify(["x"], function (x) {
        return plus({
          command: "H",
          params: [x]
        });
      }),
      vlineto: verbosify(["y"], function (y) {
        return plus({
          command: "V",
          params: [y]
        });
      }),
      closepath: function () {
        return plus({
          command: "Z",
          params: []
        });
      },
      curveto: verbosify([
        "x1",
        "y1",
        "x2",
        "y2",
        "x",
        "y"
      ], function (x1, y1, x2, y2, x, y) {
        return plus({
          command: "C",
          params: [
            x1,
            y1,
            x2,
            y2,
            x,
            y
          ]
        });
      }),
      smoothcurveto: verbosify([
        "x2",
        "y2",
        "x",
        "y"
      ], function (x2, y2, x, y) {
        return plus({
          command: "S",
          params: [
            x2,
            y2,
            x,
            y
          ]
        });
      }),
      qcurveto: verbosify([
        "x1",
        "y1",
        "x",
        "y"
      ], function (x1, y1, x, y) {
        return plus({
          command: "Q",
          params: [
            x1,
            y1,
            x,
            y
          ]
        });
      }),
      smoothqcurveto: verbosify([
        "x",
        "y"
      ], function (x, y) {
        return plus({
          command: "T",
          params: [
            x,
            y
          ]
        });
      }),
      arc: verbosify([
        "rx",
        "ry",
        "xrot",
        "large_arc_flag",
        "sweep_flag",
        "x",
        "y"
      ], function (rx, ry, xrot, large_arc_flag, sweep_flag, x, y) {
        return plus({
          command: "A",
          params: [
            rx,
            ry,
            xrot,
            large_arc_flag,
            sweep_flag,
            x,
            y
          ]
        });
      }),
      print: function () {
        return instructions.map(printInstrunction).join(" ");
      },
      points: function () {
        var instruction, prev, ps, _fn, _i, _len;
        ps = [];
        prev = [
          0,
          0
        ];
        _fn = function () {
          var p;
          p = point(instruction, prev);
          prev = p;
          if (p) {
            return ps.push(p);
          }
        };
        for (_i = 0, _len = instructions.length; _i < _len; _i++) {
          instruction = instructions[_i];
          _fn();
        }
        return ps;
      },
      instructions: function () {
        return instructions.slice(0, instructions.length);
      },
      connect: function (path) {
        var first, last, newInstructions;
        last = this.points().slice(-1)[0];
        first = path.points()[0];
        newInstructions = path.instructions().slice(1);
        if (!areEqualPoints(last, first)) {
          newInstructions.unshift({
            command: "L",
            params: first
          });
        }
        return Path(this.instructions().concat(newInstructions));
      }
    };
  };
  return function () {
    return Path();
  };
}).call(this);


}).call(this, (typeof exports === 'object' ? global : window), (typeof exports === 'object' ? global : window))
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":11}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":10,"_process":9,"inherits":8}],12:[function(require,module,exports){
(function() {
  var ICONS, LevelDisplay, LevelInfo, PlayerInfo, evaluate, get_syntax_tree, _ref;

  _ref = require('input/eval.coffee'), evaluate = _ref.evaluate, get_syntax_tree = _ref.get_syntax_tree;

  LevelInfo = (function() {
    function LevelInfo(_arg) {
      this.level_id = _arg.level_id, this.name = _arg.name, this.stars = _arg.stars, this.completed = _arg.completed;
    }

    return LevelInfo;

  })();

  PlayerInfo = (function() {
    function PlayerInfo(_arg) {
      this.tools = _arg.tools, this.gold = _arg.gold;
    }

    return PlayerInfo;

  })();

  LevelDisplay = (function() {
    var TMPL;

    TMPL = '<div class="level-row">\n  <div class="disp-tc level-name"></div>\n  <div class="disp-tc level-progress"></div>\n</div>';

    function LevelDisplay(level_info) {
      var i, progress_txt, _i;
      this.level_info = level_info;
      this._elt = $(TMPL);
      (this._elt.find('div.level-name')).text(this.level_info.name);
      progress_txt = "";
      for (i = _i = 0; _i < 3; i = ++_i) {
        if (this.level_info.stars > i) {
          progress_txt += "\u2605";
        } else {
          progress_txt += "\u2606";
        }
      }
      (this._elt.find('div.level-progress')).text(progress_txt);
      this._elt.click((function(_this) {
        return function() {
          return window.location.href = "level\#" + _this.level_info.level_id;
        };
      })(this));
    }

    LevelDisplay.prototype.elt = function() {
      return this._elt;
    };

    return LevelDisplay;

  })();

  ICONS = {
    locator: require('toolbox/locator_icon.coffee'),
    ruler: require('toolbox/ruler_icon.coffee')
  };

  window.onload = function() {
    var cell_h, cell_w, col, entries_per_row, icon, info, level_info, levels_container, name, player_info, row, tool, tool_container, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4, _ref5;
    ($(document.body)).find('.logged-in-name').text(JS_DATA.UserDisplayName);
    levels_container = ($(document.body)).find('.home-levels');
    _ref1 = JS_DATA.LevelData;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      info = _ref1[_i];
      name = "Level " + info.LevelID.slice(1);
      level_info = new LevelInfo({
        level_id: info.LevelID,
        name: name,
        stars: info.Stars
      });
      levels_container.append((new LevelDisplay(level_info)).elt());
    }
    player_info = new PlayerInfo({
      gold: JS_DATA.UserInfo.Gold,
      tools: (_ref2 = JS_DATA.UserInfo.Tools) != null ? _ref2 : []
    });
    ($(document.body)).find('.gold-count').text("Gold: " + player_info.gold);
    tool_container = ($('<div></div>')).css({
      width: 500,
      height: 600,
      position: 'absolute'
    });
    _ref3 = [60, 60], cell_w = _ref3[0], cell_h = _ref3[1];
    _ref4 = [0, 0], row = _ref4[0], col = _ref4[1];
    entries_per_row = 5;
    _ref5 = player_info.tools;
    for (_j = 0, _len1 = _ref5.length; _j < _len1; _j++) {
      tool = _ref5[_j];
      icon = ICONS[tool].SELECTED_ICON;
      icon.css({
        position: 'absolute',
        top: row * cell_h + (cell_h - icon.height()) / 2,
        left: col * cell_w + (cell_w - icon.width()) / 2
      });
      tool_container.append(icon);
      col += 1;
      if (col >= entries_per_row) {
        col = 0;
        row += 1;
      }
    }
    return ($(document.body)).find('.home-tools').append(tool_container);
  };

}).call(this);

},{"input/eval.coffee":2,"toolbox/locator_icon.coffee":4,"toolbox/ruler_icon.coffee":5}]},{},[12]);

