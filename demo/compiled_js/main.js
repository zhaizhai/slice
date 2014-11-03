(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var EPSILON, Point, Polygon, Segment, assert;

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

  exports.Point = Point;

  exports.Segment = Segment;

  exports.Polygon = Polygon;

}).call(this);

},{"assert":19}],2:[function(require,module,exports){
(function() {
  var PRECEDENCE, TOKENS, assert, evaluate, get_syntax_tree, token_type, util,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  assert = require('assert');

  util = require('util');

  TOKENS = {
    OPERATION: '^*/+-',
    FUNCTION: 'fgh',
    VARIABLE: 'xyzw',
    CONSTANT: '01234567890.',
    OPEN_PAREN: '(',
    CLOSE_PAREN: ')'
  };

  PRECEDENCE = {
    '^': 3,
    '*': 2,
    '/': 2,
    '+': 1,
    '-': 1
  };

  token_type = function(token_char) {
    var k, v;
    for (k in TOKENS) {
      v = TOKENS[k];
      if (__indexOf.call(v, token_char) >= 0) {
        return k;
      }
    }
    assert(false, "token type invalid");
    return 'INVALID';
  };

  get_syntax_tree = function(expression_str) {
    var best_nesting_depth, best_token, best_token_index, c, elt, function_args, i, left_str, nesting_depth, right_str, _i, _ref;
    assert(expression_str.length > 0);
    nesting_depth = 0;
    best_token_index = -1;
    best_token = '';
    best_nesting_depth = -1;
    for (i = _i = 0, _ref = expression_str.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      c = expression_str[i];
      switch (token_type(c)) {
        case 'OPEN_PAREN':
          nesting_depth += 1;
          break;
        case 'CLOSE_PAREN':
          nesting_depth -= 1;
          break;
        case 'OPERATION':
          if (best_nesting_depth === -1 || nesting_depth < best_nesting_depth || (nesting_depth === best_nesting_depth && PRECEDENCE[c] <= PRECEDENCE[best_token])) {
            best_token_index = i;
            best_token = c;
            best_nesting_depth = nesting_depth;
          }
      }
      assert(nesting_depth >= 0);
    }
    assert(nesting_depth === 0);
    if (best_nesting_depth === 0) {
      assert(best_token_index > 0);
      assert(best_token_index < expression_str.length);
      left_str = expression_str.substring(0, best_token_index);
      right_str = expression_str.substring(best_token_index + 1, expression_str.length);
      return {
        token_type: token_type(best_token),
        token_name: best_token,
        children: [get_syntax_tree(left_str), get_syntax_tree(right_str)]
      };
    }
    switch (token_type(expression_str[0])) {
      case 'FUNCTION':
        assert(token_type(expression_str[1]) === 'OPEN_PAREN');
        assert(token_type(expression_str[expression_str.length - 1]) === 'CLOSE_PAREN');
        function_args = expression_str.substring(2, expression_str.length - 1).split(",");
        return {
          token_type: 'FUNCTION',
          token_name: expression_str[0],
          children: (function() {
            var _j, _len, _results;
            _results = [];
            for (_j = 0, _len = function_args.length; _j < _len; _j++) {
              elt = function_args[_j];
              _results.push(get_syntax_tree(elt));
            }
            return _results;
          })()
        };
      case 'OPEN_PAREN':
        assert(token_type(expression_str[expression_str.length - 1]) === 'CLOSE_PAREN');
        return get_syntax_tree(expression_str.substring(1, expression_str.length - 1));
      case 'VARIABLE':
        return {
          token_type: 'VARIABLE',
          token_name: expression_str
        };
      case 'CONSTANT':
        return {
          token_type: 'CONSTANT',
          token_name: expression_str
        };
    }
    return assert(false, "invalid");
  };

  evaluate = function(syntax_tree, functions, variables) {
    var elt, evaluated_children, fn, i, more_variables, sub_tree, _i, _ref;
    switch (syntax_tree.token_type) {
      case 'CONSTANT':
        return parseFloat(syntax_tree.token_name);
      case 'VARIABLE':
        assert(syntax_tree.token_name in variables);
        return variables[syntax_tree.token_name];
      case 'OPERATION':
        evaluated_children = (function() {
          var _i, _len, _ref, _results;
          _ref = syntax_tree.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elt = _ref[_i];
            _results.push(evaluate(elt, functions, variables));
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
        assert(syntax_tree.token_name in functions);
        fn = functions[syntax_tree.token_name];
        assert(fn.inputs.length === syntax_tree.children.length);
        evaluated_children = (function() {
          var _i, _len, _ref, _results;
          _ref = syntax_tree.children;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elt = _ref[_i];
            _results.push(evaluate(elt, functions, variables));
          }
          return _results;
        })();
        sub_tree = get_syntax_tree(fn.output_expression_str);
        more_variables = variables;
        for (i = _i = 0, _ref = fn.inputs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          more_variables[fn.inputs[i]] = evaluated_children[i];
        }
        return evaluate(sub_tree, functions, more_variables);
    }
    return assert(false);
  };

  exports.get_syntax_tree = get_syntax_tree;

  exports.evaluate = evaluate;

  exports.evaluate_string = function(s) {
    var ast, e;
    s = s.replace(/\ /g, '');
    try {
      ast = get_syntax_tree(s);
      return evaluate(ast, {}, {});
    } catch (_error) {
      e = _error;
      throw new Error("Syntax error in input: \"" + s + "\"");
    }
  };

}).call(this);

},{"assert":19,"util":24}],3:[function(require,module,exports){
(function() {
  var Path, Point, Polygon, SVG, ShapeMaker, _ref;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  _ref = require('geometry.coffee'), Point = _ref.Point, Polygon = _ref.Polygon;

  ShapeMaker = (function() {
    var TMPL;

    TMPL = '<div class="toolbox-section">\n  <div class="input-title"></div>\n  <div class="container"></div>\n</div>';

    function ShapeMaker(_shape, _handler) {
      var container, k, submit, v, _ref1;
      this._shape = _shape;
      this._handler = _handler;
      this._elt = $(TMPL);
      (this._elt.find('.input-title')).text(this._shape.title);
      container = this._elt.find('.container');
      this._inputs = {};
      _ref1 = this._shape.params;
      for (k in _ref1) {
        v = _ref1[k];
        this._inputs[k] = v();
        container.append(this._inputs[k].elt());
      }
      submit = ($('<button>Submit</button>')).click((function(_this) {
        return function() {
          return _this._on_submit();
        };
      })(this));
      container.append(submit);
    }

    ShapeMaker.prototype.elt = function() {
      return this._elt;
    };

    ShapeMaker.prototype._on_submit = function() {
      var elt, func, k, shape_data, _ref1, _ref2;
      shape_data = {};
      _ref1 = this._inputs;
      for (k in _ref1) {
        elt = _ref1[k];
        shape_data[k] = elt.get();
      }
      _ref2 = this._shape.methods;
      for (k in _ref2) {
        func = _ref2[k];
        shape_data[k] = func;
      }
      return this._handler(shape_data);
    };

    return ShapeMaker;

  })();

  exports.ShapeMaker = ShapeMaker;

}).call(this);

},{"geometry.coffee":1,"paths-js/path":11,"svg.coffee":12}],4:[function(require,module,exports){
(function() {
  var Coords, CoordsInput, Length, LengthInput, Path, Point, Polygon, SVG, evaluate_string, mustache, render_to_jq, _ref;

  mustache = require('mustache');

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  _ref = require('geometry.coffee'), Point = _ref.Point, Polygon = _ref.Polygon;

  evaluate_string = require('input/eval.coffee').evaluate_string;

  render_to_jq = function(tmpl, params) {
    var html;
    html = mustache.to_html(tmpl, params);
    return $(html);
  };

  CoordsInput = (function() {
    var TMPL;

    TMPL = '<div class="disp-t input-param">\n  <div class="disp-tc input-label">{{input_txt}}</div>\n  <div class="disp-tc input-container">\n    <input type="text" class="shape-text-input x-input" placeholder="x-coordinate"></input>\n    <input type="text" class="shape-text-input y-input" placeholder="y-coordinate"></input>\n  </div>\n</div>';

    function CoordsInput(input_txt) {
      this._elt = render_to_jq(TMPL, {
        input_txt: input_txt
      });
    }

    CoordsInput.prototype.elt = function() {
      return this._elt;
    };

    CoordsInput.prototype.get = function() {
      var x, y, _ref1;
      x = (this._elt.find('input.x-input')).val();
      y = (this._elt.find('input.y-input')).val();
      _ref1 = [evaluate_string(x), evaluate_string(y)], x = _ref1[0], y = _ref1[1];
      return new Point(x, y);
    };

    return CoordsInput;

  })();

  LengthInput = (function() {
    var TMPL;

    TMPL = '<div class="disp-t input-param">\n  <div class="disp-tc input-label">{{input_txt}}</div>\n  <div class="disp-tc input-container">\n    <input type="text" class="shape-text-input len-input" placeholder="length"></input>\n  </div>\n</div>';

    function LengthInput(input_txt) {
      this._elt = render_to_jq(TMPL, {
        input_txt: input_txt
      });
    }

    LengthInput.prototype.elt = function() {
      return this._elt;
    };

    LengthInput.prototype.get = function() {
      var len;
      len = (this._elt.find('input.len-input')).val();
      len = evaluate_string(len);
      return len;
    };

    return LengthInput;

  })();

  Coords = function(label) {
    return function() {
      return new CoordsInput(label + ':');
    };
  };

  Length = function(label) {
    return function() {
      return new LengthInput(label + ':');
    };
  };

  exports.SquareShape = {
    title: 'Slice the biggest square that fits!',
    params: {
      center: Coords('Center'),
      side: Length('Side length')
    },
    methods: {
      polygon: function() {
        var DIRS, dx, dy, halfside, pt, pts, _i, _len, _ref1;
        DIRS = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
        halfside = this.side / 2;
        pts = [];
        for (_i = 0, _len = DIRS.length; _i < _len; _i++) {
          _ref1 = DIRS[_i], dx = _ref1[0], dy = _ref1[1];
          pt = this.center.shift(dx * halfside, dy * halfside);
          pts.push(pt);
        }
        return new Polygon(pts);
      },
      svg: function() {
        var d;
        d = SVG.util.make_closed_path(this.polygon().points());
        return SVG.path({
          d: d
        });
      },
      label: function() {
        return this.center;
      }
    }
  };

  exports.CircleShape = {
    title: 'Slice the biggest circle that fits!',
    params: {
      center: Coords('Center'),
      radius: Length('Radius')
    },
    methods: {
      svg: function() {
        return SVG.circle({
          cx: this.center.x,
          cy: this.center.y,
          r: this.radius
        });
      },
      label: function() {
        return this.center;
      }
    }
  };

}).call(this);

},{"geometry.coffee":1,"input/eval.coffee":2,"mustache":10,"paths-js/path":11,"svg.coffee":12}],5:[function(require,module,exports){
(function() {
  var BaseLevel, HookBinding, Path, Point, Polygon, SVG, make_axes, _ref;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  _ref = require('geometry.coffee'), Point = _ref.Point, Polygon = _ref.Polygon;

  exports.make_axes = make_axes = function(dims) {
    var bottom, left, right, top, x_axis, y_axis, _ref1, _ref2, _ref3, _ref4;
    _ref1 = [-dims.offset_x, dims.width - dims.offset_x], left = _ref1[0], right = _ref1[1];
    _ref2 = [-dims.height + dims.offset_y, dims.offset_y], bottom = _ref2[0], top = _ref2[1];
    _ref3 = [left + 2, right - 2], left = _ref3[0], right = _ref3[1];
    _ref4 = [bottom + 2, top - 2], bottom = _ref4[0], top = _ref4[1];
    x_axis = Path().moveto(left, 0);
    x_axis = x_axis.lineto(right, 0);
    x_axis = SVG.util.arrow(x_axis, {
      tip: new Point(right, 0),
      length: 8,
      angle: 20,
      direction: 0
    });
    x_axis = SVG.util.arrow(x_axis, {
      tip: new Point(left, 0),
      length: 8,
      angle: 20,
      direction: 180
    });
    y_axis = Path().moveto(0, bottom);
    y_axis = y_axis.lineto(0, top);
    y_axis = SVG.util.arrow(y_axis, {
      tip: new Point(0, top),
      length: 8,
      angle: 20,
      direction: 90
    });
    y_axis = SVG.util.arrow(y_axis, {
      tip: new Point(0, bottom),
      length: 8,
      angle: 20,
      direction: 270
    });
    return SVG.g({}, [
      SVG.path({
        d: x_axis.print(),
        stroke: 'black',
        opacity: 0.4
      }), SVG.path({
        d: y_axis.print(),
        stroke: 'black',
        opacity: 0.4
      })
    ]);
  };

  BaseLevel = (function() {
    var REQUIRED_PROPS;

    REQUIRED_PROPS = ['dims', 'generate', 'evaluate', 'allowed_tools', 'input_shape'];

    function BaseLevel(opts) {
      var k, prop, v, _i, _len;
      this.params = null;
      this._render_hooks = {};
      this.entities = {};
      for (_i = 0, _len = REQUIRED_PROPS.length; _i < _len; _i++) {
        prop = REQUIRED_PROPS[_i];
        if (!prop in opts) {
          throw new Error("Level is missing property " + prop + "!");
        }
      }
      for (k in opts) {
        v = opts[k];
        this[k] = v;
      }
    }

    BaseLevel.prototype.set_render_hook = function(k, hook) {
      var _base;
      if ((_base = this._render_hooks)[k] == null) {
        _base[k] = [];
      }
      return this._render_hooks[k].push(hook);
    };

    BaseLevel.prototype.remove_render_hook = function(k, hook) {
      var h, new_hooks, old_hooks, _i, _len;
      old_hooks = this._render_hooks[k];
      if (old_hooks == null) {
        return;
      }
      new_hooks = [];
      for (_i = 0, _len = old_hooks.length; _i < _len; _i++) {
        h = old_hooks[_i];
        if (h !== hook) {
          new_hooks.push(h);
        }
      }
      return this._render_hooks[k] = new_hooks;
    };

    BaseLevel.prototype.clear_render_hooks = function() {
      return this._render_hooks = {};
    };

    BaseLevel.prototype.get_hook = function(k) {
      var best_hook, hook, hooks, _i, _len, _ref1;
      best_hook = null;
      hooks = (_ref1 = this._render_hooks[k]) != null ? _ref1 : [];
      for (_i = 0, _len = hooks.length; _i < _len; _i++) {
        hook = hooks[_i];
        if ((best_hook != null) && hook.precedence <= best_hook.precedence) {
          continue;
        }
        best_hook = hook;
      }
      return hook;
    };

    BaseLevel.prototype.add = function(k, v) {
      return this.entities[k] = v;
    };

    BaseLevel.prototype.get = function(k) {
      return this.entities[k];
    };

    BaseLevel.prototype.render_background = function() {
      return make_axes(this.dims);
    };

    return BaseLevel;

  })();

  HookBinding = (function() {
    function HookBinding(level, precedence, hook_fn) {
      this.level = level;
      this.precedence = precedence;
      this.hook_fn = hook_fn;
      this._val = null;
      this._hook = {
        precedence: this.precedence,
        render: (function(_this) {
          return function() {
            return _this.hook_fn(_this._val);
          };
        })(this)
      };
    }

    HookBinding.prototype.set = function(v) {
      if (this._val != null) {
        this.level.remove_render_hook(this._val, this._hook);
      }
      this._val = v;
      if (v == null) {
        return;
      }
      return this.level.set_render_hook(this._val, this._hook);
    };

    HookBinding.prototype.get = function() {
      return this._val;
    };

    return HookBinding;

  })();

  exports.BaseLevel = BaseLevel;

  exports.HookBinding = HookBinding;

}).call(this);

},{"geometry.coffee":1,"paths-js/path":11,"svg.coffee":12}],6:[function(require,module,exports){
(function() {
  var BaseLevel, Level1Tools, Path, Point, Polygon, SVG, SquareShape, i, idx, _ref;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  _ref = require('geometry.coffee'), Point = _ref.Point, Polygon = _ref.Polygon;

  BaseLevel = require('levels/base.coffee').BaseLevel;

  SquareShape = require('input/shape_spec.coffee').SquareShape;

  Level1Tools = {
    locator: {
      points: (function() {
        var _i, _results;
        _results = [];
        for (idx = _i = 0; _i < 4; idx = ++_i) {
          _results.push('p' + idx);
        }
        return _results;
      })()
    },
    ruler: {
      points: (function() {
        var _i, _results;
        _results = [];
        for (idx = _i = 0; _i < 4; idx = ++_i) {
          _results.push('p' + idx);
        }
        return _results;
      })()
    }
  };

  exports.Level1 = new BaseLevel({
    allowed_tools: Level1Tools,
    input_shape: SquareShape,
    dims: {
      width: 500,
      height: 500,
      offset_x: 250,
      offset_y: 250
    },
    param_choices: {
      w: (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i <= 50; i = ++_i) {
          _results.push(100 + 2 * i);
        }
        return _results;
      })()
    },
    generate: function(params) {
      var fig, pt, w, _i, _len, _ref1, _results;
      this.params = params;
      w = this.params.w;
      fig = new Polygon([new Point(w, 0), new Point(0, w), new Point(-w, 0), new Point(0, -w)]);
      this.add('figure', fig);
      _ref1 = fig.points();
      _results = [];
      for (idx = _i = 0, _len = _ref1.length; _i < _len; idx = ++_i) {
        pt = _ref1[idx];
        _results.push(this.add('p' + idx, pt));
      }
      return _results;
    },
    render_figure: function() {
      var d;
      d = SVG.util.make_closed_path(this.entities.figure.points());
      return SVG.path({
        d: d,
        fill: 'blue',
        opacity: 0.2
      });
    },
    render_nodes: function() {
      var hook, nodes, pt, _i, _len, _ref1;
      nodes = [];
      _ref1 = this.entities.figure.points();
      for (idx = _i = 0, _len = _ref1.length; _i < _len; idx = ++_i) {
        pt = _ref1[idx];
        hook = this.get_hook('p' + idx);
        if (hook != null) {
          nodes.push(hook.render());
        } else {
          nodes.push(SVG.circle({
            cx: pt.x,
            cy: pt.y,
            r: 5,
            fill: 'red',
            stroke: 'black'
          }));
        }
      }
      return SVG.g({}, nodes);
    },
    render: function(container) {
      container.appendChild(this.render_background());
      container.appendChild(this.render_figure());
      return container.appendChild(this.render_nodes());
    },
    _score: function(area) {
      var EPS, opt, r;
      opt = this.params.w * this.params.w;
      r = area / opt;
      EPS = 0.001;
      if (r >= (1 + EPS)) {
        console.log("What?? should be impossible");
      }
      if (r >= (1 - EPS)) {
        return 3;
      }
      if (r >= 0.95) {
        return 2;
      }
      if (r >= 0.7) {
        return 1;
      }
      return 0;
    },
    evaluate: function(shape) {
      var fig, poly, pt, _i, _len, _ref1;
      poly = shape.polygon();
      fig = this.entities.figure;
      if (fig.intersects(poly)) {
        return {
          score: -1
        };
      }
      _ref1 = fig.points();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pt = _ref1[_i];
        if (poly.contains(pt)) {
          return {
            score: -1
          };
        }
      }
      return {
        score: this._score(poly.area())
      };
    }
  });

}).call(this);

},{"geometry.coffee":1,"input/shape_spec.coffee":4,"levels/base.coffee":5,"paths-js/path":11,"svg.coffee":12}],7:[function(require,module,exports){
(function() {
  var BaseLevel, Level2Tools, Path, Point, Polygon, SVG, SquareShape, i, idx, _i, _j, _ref, _results, _results1;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  _ref = require('geometry.coffee'), Point = _ref.Point, Polygon = _ref.Polygon;

  BaseLevel = require('levels/base.coffee').BaseLevel;

  SquareShape = require('input/shape_spec.coffee').SquareShape;

  Level2Tools = {
    locator: {
      points: (function() {
        var _i, _results;
        _results = [];
        for (idx = _i = 0; _i < 4; idx = ++_i) {
          _results.push('p' + idx);
        }
        return _results;
      })()
    },
    ruler: {
      points: (function() {
        var _i, _results;
        _results = [];
        for (idx = _i = 0; _i < 4; idx = ++_i) {
          _results.push('p' + idx);
        }
        return _results;
      })()
    }
  };

  exports.Level2 = new BaseLevel({
    allowed_tools: Level2Tools,
    input_shape: SquareShape,
    dims: {
      width: 500,
      height: 500,
      offset_x: 250,
      offset_y: 250
    },
    param_choices: {
      w: (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; _i <= 30; i = ++_i) {
          _results.push(100 + 2 * i);
        }
        return _results;
      })(),
      x: (function() {
        _results = [];
        for (_i = 5; _i <= 50; _i++){ _results.push(_i); }
        return _results;
      }).apply(this),
      y: (function() {
        _results1 = [];
        for (_j = 5; _j <= 50; _j++){ _results1.push(_j); }
        return _results1;
      }).apply(this)
    },
    generate: function(params) {
      var fig, pt, w, x, y, _k, _len, _ref1, _ref2, _results2;
      this.params = params;
      _ref1 = this.params, w = _ref1.w, x = _ref1.x, y = _ref1.y;
      fig = new Polygon([new Point(x + w, y), new Point(x, y + w), new Point(x - w, y), new Point(x, y - w)]);
      this.add('figure', fig);
      _ref2 = fig.points();
      _results2 = [];
      for (idx = _k = 0, _len = _ref2.length; _k < _len; idx = ++_k) {
        pt = _ref2[idx];
        _results2.push(this.add('p' + idx, pt));
      }
      return _results2;
    },
    render_figure: function() {
      var d;
      d = SVG.util.make_closed_path(this.entities.figure.points());
      return SVG.path({
        d: d,
        fill: 'blue',
        opacity: 0.2
      });
    },
    render_nodes: function() {
      var hook, nodes, pt, _k, _len, _ref1;
      nodes = [];
      _ref1 = this.entities.figure.points();
      for (idx = _k = 0, _len = _ref1.length; _k < _len; idx = ++_k) {
        pt = _ref1[idx];
        hook = this.get_hook('p' + idx);
        if (hook != null) {
          nodes.push(hook.render());
        } else {
          nodes.push(SVG.circle({
            cx: pt.x,
            cy: pt.y,
            r: 5,
            fill: 'red',
            stroke: 'black'
          }));
        }
      }
      return SVG.g({}, nodes);
    },
    render: function(container) {
      container.appendChild(this.render_background());
      container.appendChild(this.render_figure());
      return container.appendChild(this.render_nodes());
    },
    _score: function(area) {
      var EPS, opt, r;
      opt = this.params.w * this.params.w;
      r = area / opt;
      EPS = 0.001;
      if (r >= (1 + EPS)) {
        console.log("What?? should be impossible");
      }
      if (r >= (1 - EPS)) {
        return 3;
      }
      if (r >= 0.95) {
        return 2;
      }
      if (r >= 0.7) {
        return 1;
      }
      return 0;
    },
    evaluate: function(shape) {
      var fig, poly, pt, _k, _len, _ref1;
      poly = shape.polygon();
      fig = this.entities.figure;
      if (fig.intersects(poly)) {
        return {
          score: -1
        };
      }
      _ref1 = fig.points();
      for (_k = 0, _len = _ref1.length; _k < _len; _k++) {
        pt = _ref1[_k];
        if (poly.contains(pt)) {
          return {
            score: -1
          };
        }
      }
      return {
        score: this._score(poly.area())
      };
    }
  });

}).call(this);

},{"geometry.coffee":1,"input/shape_spec.coffee":4,"levels/base.coffee":5,"paths-js/path":11,"svg.coffee":12}],8:[function(require,module,exports){
(function() {
  var BaseLevel, CircleShape, EPS, Path, Point, Polygon, SVG, idx, _i, _j, _ref, _results, _results1;

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  _ref = require('geometry.coffee'), Point = _ref.Point, Polygon = _ref.Polygon;

  BaseLevel = require('levels/base.coffee').BaseLevel;

  CircleShape = require('input/shape_spec.coffee').CircleShape;

  EPS = 0.0001;

  exports.Level3 = new BaseLevel({
    allowed_tools: {
      locator: {
        points: (function() {
          var _i, _results;
          _results = [];
          for (idx = _i = 0; _i < 3; idx = ++_i) {
            _results.push('p' + idx);
          }
          return _results;
        })()
      }
    },
    input_shape: CircleShape,
    dims: {
      width: 500,
      height: 500,
      offset_x: 100,
      offset_y: 400
    },
    param_choices: {
      x: (function() {
        _results = [];
        for (_i = 150; _i <= 350; _i++){ _results.push(_i); }
        return _results;
      }).apply(this),
      y: (function() {
        _results1 = [];
        for (_j = 150; _j <= 350; _j++){ _results1.push(_j); }
        return _results1;
      }).apply(this)
    },
    generate: function(params) {
      var fig, pt, x, y, _k, _len, _ref1, _ref2, _results2;
      this.params = params;
      _ref1 = this.params, x = _ref1.x, y = _ref1.y;
      fig = new Polygon([new Point(0, 0), new Point(x, 0), new Point(0, y)]);
      this.add('figure', fig);
      _ref2 = fig.points();
      _results2 = [];
      for (idx = _k = 0, _len = _ref2.length; _k < _len; idx = ++_k) {
        pt = _ref2[idx];
        _results2.push(this.add('p' + idx, pt));
      }
      return _results2;
    },
    render_figure: function() {
      var d;
      d = SVG.util.make_closed_path(this.entities.figure.points());
      return SVG.path({
        d: d,
        fill: 'blue',
        opacity: 0.2
      });
    },
    render_nodes: function() {
      var hook, nodes, pt, _k, _len, _ref1;
      nodes = [];
      _ref1 = this.entities.figure.points();
      for (idx = _k = 0, _len = _ref1.length; _k < _len; idx = ++_k) {
        pt = _ref1[idx];
        hook = this.get_hook('p' + idx);
        if (hook != null) {
          nodes.push(hook.render());
        } else {
          nodes.push(SVG.circle({
            cx: pt.x,
            cy: pt.y,
            r: 5,
            fill: 'red',
            stroke: 'black'
          }));
        }
      }
      return SVG.g({}, nodes);
    },
    render: function(container) {
      container.appendChild(this.render_background());
      container.appendChild(this.render_figure());
      return container.appendChild(this.render_nodes());
    },
    _score: function(r) {
      var opt, x, y, _ref1;
      _ref1 = this.params, x = _ref1.x, y = _ref1.y;
      opt = (x * y) / (x + y + Math.sqrt(x * x + y * y));
      console.log('performance =', r / opt);
      if (r >= (1 + 2 * EPS) * opt) {
        console.log("What?? should be impossible");
      }
      if (r >= (1 - 2 * EPS) * opt) {
        return 3;
      }
      if (r >= 0.95 * opt) {
        return 2;
      }
      if (r >= 0.7 * opt) {
        return 1;
      }
      return 0;
    },
    evaluate: function(shape) {
      var SCORE_TO_MESG, fig, result;
      SCORE_TO_MESG = {
        1: 'Good \u2605\u2606\u2606',
        2: 'Great! \u2605\u2605\u2606',
        3: 'Perfect! \u2605\u2605\u2605'
      };
      fig = this.entities.figure;
      result = {};
      if (!(fig.contains(shape.center, {
        buffer: shape.radius - EPS
      }))) {
        result.score = -1;
      } else {
        result.score = this._score(shape.radius);
      }
      return result;
    }
  });

}).call(this);

},{"geometry.coffee":1,"input/shape_spec.coffee":4,"levels/base.coffee":5,"paths-js/path":11,"svg.coffee":12}],9:[function(require,module,exports){
(function() {
  var LEVELS, Level1, Level2, Level3, rand_choice, rand_int;

  Level1 = require('levels/level1.coffee').Level1;

  Level2 = require('levels/level2.coffee').Level2;

  Level3 = require('levels/level3.coffee').Level3;

  rand_int = function(n) {
    return Math.floor(Math.random() * n);
  };

  rand_choice = function(list) {
    return list[rand_int(list.length)];
  };

  LEVELS = {
    l1: Level1,
    l2: Level2,
    l3: Level3
  };

  exports.load = function(lname) {
    var choices, k, level, params, _ref;
    level = LEVELS[lname];
    if (level == null) {
      return null;
    }
    params = {};
    _ref = level.param_choices;
    for (k in _ref) {
      choices = _ref[k];
      params[k] = rand_choice(choices);
    }
    level.generate(params);
    return level;
  };

}).call(this);

},{"levels/level1.coffee":6,"levels/level2.coffee":7,"levels/level3.coffee":8}],10:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function escapeTags(tags) {
    if (!isArray(tags) || tags.length !== 2) {
      throw new Error('Invalid tags: ' + tags);
    }

    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate(template, tags) {
    tags = tags || mustache.tags;
    template = template || '';

    if (typeof tags === 'string') {
      tags = tags.split(spaceRe);
    }

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n') {
            stripSpace();
          }
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) {
        throw new Error('Unclosed tag at ' + scanner.pos);
      }

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }
        if (openSection[1] !== value) {
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
        }
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tagRes = escapeTags(tags = value.split(spaceRe));
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();
    if (openSection) {
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
      case '^':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      var string = match[0];
      this.tail = this.tail.substring(string.length);
      this.pos += string.length;
      return string;
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context(view, parentContext) {
    this.view = view == null ? {} : view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function (name) {
    var value;
    if (name in this.cache) {
      value = this.cache[name];
    } else {
      var context = this;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;

          var names = name.split('.'), i = 0;
          while (value != null && i < names.length) {
            value = value[names[i++]];
          }
        } else {
          value = context.view[name];
        }

        if (value != null) break;

        context = context.parent;
      }

      this.cache[name] = value;
    }

    if (isFunction(value)) {
      value = value.call(this.view);
    }

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer() {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null) {
      tokens = cache[template] = parseTemplate(template, tags);
    }

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
    var buffer = '';

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    var self = this;
    function subRender(template) {
      return self.render(template, context, partials);
    }

    var token, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
        value = context.lookup(token[1]);
        if (!value) continue;

        if (isArray(value)) {
          for (var j = 0, jlen = value.length; j < jlen; ++j) {
            buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
          }
        } else if (typeof value === 'object' || typeof value === 'string') {
          buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
        } else if (isFunction(value)) {
          if (typeof originalTemplate !== 'string') {
            throw new Error('Cannot use higher-order sections without the original template');
          }

          // Extract the portion of the original template that the section contains.
          value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

          if (value != null) buffer += value;
        } else {
          buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }

        break;
      case '^':
        value = context.lookup(token[1]);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }

        break;
      case '>':
        if (!partials) continue;
        value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
        if (value != null) buffer += this.renderTokens(this.parse(value), context, partials, value);
        break;
      case '&':
        value = context.lookup(token[1]);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(token[1]);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += token[1];
        break;
      }
    }

    return buffer;
  };

  mustache.name = "mustache.js";
  mustache.version = "0.8.1";
  mustache.tags = [ "{{", "}}" ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));

},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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

},{"assert":19,"geometry.coffee":1,"paths-js/path":11}],13:[function(require,module,exports){
(function() {
  var SVG, ToolGraphics;

  SVG = require('svg.coffee');

  ToolGraphics = (function() {
    function ToolGraphics(level) {
      this.level = level;
    }

    ToolGraphics.prototype.make_node = function(pt_id, opts) {
      var DEFAULT_OPTS, STATUS_STYLES, click, k, mouseenter, mouseleave, pt, status, style, v;
      DEFAULT_OPTS = {
        status: 'default',
        mouseenter: function() {},
        mouseleave: function() {},
        click: function() {}
      };
      for (k in DEFAULT_OPTS) {
        v = DEFAULT_OPTS[k];
        if (opts[k] == null) {
          opts[k] = v;
        }
      }
      status = opts.status, mouseenter = opts.mouseenter, mouseleave = opts.mouseleave, click = opts.click;
      STATUS_STYLES = {
        "default": {
          color: 'red',
          r: 4
        },
        hover: {
          color: 'red',
          r: 6
        },
        selected: {
          color: 'purple',
          r: 6
        }
      };
      style = STATUS_STYLES[status];
      pt = this.level.get(pt_id);
      return SVG.circle({
        cx: pt.x,
        cy: pt.y,
        r: style.r,
        fill: style.color,
        stroke: 'black',
        mouseenter: mouseenter,
        mouseleave: mouseleave,
        click: click
      });
    };

    return ToolGraphics;

  })();

  exports.ToolGraphics = ToolGraphics;

}).call(this);

},{"svg.coffee":12}],14:[function(require,module,exports){
(function() {
  var EventEmitter, HookBinding, Locator, Path, SELECTED_ICON, SVG, ToolGraphics, UNSELECTED_ICON, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  EventEmitter = require('events').EventEmitter;

  HookBinding = require('levels/base.coffee').HookBinding;

  ToolGraphics = require('toolbox/graphics.coffee').ToolGraphics;

  _ref = require('toolbox/locator_icon.coffee'), SELECTED_ICON = _ref.SELECTED_ICON, UNSELECTED_ICON = _ref.UNSELECTED_ICON;

  Locator = (function(_super) {
    __extends(Locator, _super);

    function Locator(level, level_data, scene) {
      this.level = level;
      this.level_data = level_data;
      this.scene = scene;
      this._selected = new HookBinding(this.level, 3, (function(_this) {
        return function(pt_id) {
          return _this._make_node(pt_id, 'selected');
        };
      })(this));
      this._hover = new HookBinding(this.level, 1, (function(_this) {
        return function(pt_id) {
          return _this._make_node(pt_id, 'hover');
        };
      })(this));
      this._highlight = new HookBinding(this.level, 5, (function(_this) {
        return function(pt_id) {
          return _this._make_node(pt_id, 'hover');
        };
      })(this));
      this._gfx = new ToolGraphics(this.level);
    }

    Locator.prototype.icons = {
      selected: SELECTED_ICON,
      unselected: UNSELECTED_ICON
    };

    Locator.prototype.activate = function() {
      var pt_id, _i, _len, _ref1, _results;
      _ref1 = this.level_data.points;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pt_id = _ref1[_i];
        _results.push((function(_this) {
          return function(pt_id) {
            return _this.level.set_render_hook(pt_id, {
              precedence: 0,
              render: function() {
                return _this._make_node(pt_id, 'default');
              }
            });
          };
        })(this)(pt_id));
      }
      return _results;
    };

    Locator.prototype.deactivate = function() {
      this._selected.set(null);
      this._hover.set(null);
      return this._highlight.set(null);
    };

    Locator.prototype.cost = 1;

    Locator.prototype.select = function(id) {
      if (this._selected.get() === id) {
        this._selected.set(null);
      } else {
        this._selected.set(id);
      }
      return this.emit('change');
    };

    Locator.prototype.hover = function(id) {
      this._hover.set(id);
      return this.emit('change');
    };

    Locator.prototype.highlight = function(id) {
      this._highlight.set(id);
      return this.emit('change');
    };

    Locator.prototype._make_node = function(pt_id, status) {
      return this._gfx.make_node(pt_id, {
        status: status,
        mouseenter: (function(_this) {
          return function(e) {
            return _this.hover(pt_id);
          };
        })(this),
        mouseleave: (function(_this) {
          return function(e) {
            return _this.hover(null);
          };
        })(this),
        click: (function(_this) {
          return function(e) {
            return _this.select(pt_id);
          };
        })(this)
      });
    };

    Locator.prototype.measure = function() {
      var pt, sel;
      sel = this._selected.get();
      if (sel == null) {
        return null;
      }
      pt = this.level.get(sel);
      return {
        ref: sel,
        mesg: "Point at (" + pt.x + ", " + pt.y + ")",
        mouseover: (function(_this) {
          return function() {
            return _this.highlight(sel);
          };
        })(this),
        mouseout: (function(_this) {
          return function() {
            return _this.highlight(null);
          };
        })(this)
      };
    };

    return Locator;

  })(EventEmitter);

  exports.Locator = Locator;

}).call(this);

},{"events":20,"levels/base.coffee":5,"paths-js/path":11,"svg.coffee":12,"toolbox/graphics.coffee":13,"toolbox/locator_icon.coffee":15}],15:[function(require,module,exports){
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

},{"paths-js/path":11,"svg.coffee":12}],16:[function(require,module,exports){
(function() {
  var EventEmitter, HookBinding, Path, Point, Ruler, SELECTED_ICON, SVG, ToolGraphics, UNSELECTED_ICON, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SVG = require('svg.coffee');

  Path = require('paths-js/path');

  EventEmitter = require('events').EventEmitter;

  HookBinding = require('levels/base.coffee').HookBinding;

  Point = require('geometry.coffee').Point;

  ToolGraphics = require('toolbox/graphics.coffee').ToolGraphics;

  _ref = require('toolbox/ruler_icon.coffee'), SELECTED_ICON = _ref.SELECTED_ICON, UNSELECTED_ICON = _ref.UNSELECTED_ICON;

  Ruler = (function(_super) {
    __extends(Ruler, _super);

    function Ruler(level, level_data, scene) {
      this.level = level;
      this.level_data = level_data;
      this.scene = scene;
      this._start = new HookBinding(this.level, 3, (function(_this) {
        return function(pt_id) {
          return _this._make_node(pt_id, 'selected');
        };
      })(this));
      this._end = new HookBinding(this.level, 3, (function(_this) {
        return function(pt_id) {
          return _this._make_node(pt_id, 'selected');
        };
      })(this));
      this._gfx = new ToolGraphics(this.level);
    }

    Ruler.prototype._rule_overlay = function(start, end) {
      var d, gap, l1, l2, l3, u, v, width, _ref1;
      u = end.diff(start);
      if (u.x === 0 && u.y === 0) {
        throw new Error("start and end can't coincide!");
      }
      v = new Point(u.y, -u.x);
      v = v.scale(1 / v.length());
      gap = 7;
      width = 6;
      _ref1 = [gap, gap + width, gap + 2 * width], l1 = _ref1[0], l2 = _ref1[1], l3 = _ref1[2];
      d = Path();
      d = d.moveto(start.plus(v.scale(l1))).lineto(start.plus(v.scale(l3)));
      d = d.moveto(end.plus(v.scale(l1))).lineto(end.plus(v.scale(l3)));
      d = d.moveto(start.plus(v.scale(l2))).lineto(end.plus(v.scale(l2)));
      return SVG.path({
        d: d.print(),
        stroke: 'black',
        'stroke-width': 2
      });
    };

    Ruler.prototype.icons = {
      selected: SELECTED_ICON,
      unselected: UNSELECTED_ICON
    };

    Ruler.prototype.activate = function() {
      var pt_id, _fn, _i, _len, _ref1;
      _ref1 = this.level_data.points;
      _fn = (function(_this) {
        return function(pt_id) {
          return _this.level.set_render_hook(pt_id, {
            precedence: 0,
            render: function() {
              return _this._make_node(pt_id, 'default');
            }
          });
        };
      })(this);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pt_id = _ref1[_i];
        _fn(pt_id);
      }
      return this.scene.mousemove((function(_this) {
        return function(e) {
          var overlay, start_pt;
          if ((_this._start.get() == null) || (_this._end.get() != null)) {
            return;
          }
          start_pt = _this.level.get(_this._start.get());
          overlay = _this._rule_overlay(start_pt, new Point(e.x, e.y));
          return _this.scene.set_overlay(overlay);
        };
      })(this));
    };

    Ruler.prototype.deactivate = function() {
      this._start.set(null);
      return this._end.set(null);
    };

    Ruler.prototype.cost = 1;

    Ruler.prototype.set_start = function(id) {
      return this._start.set(id);
    };

    Ruler.prototype.set_end = function(id) {
      var end_pt, start_pt;
      if (id == null) {
        this._end.set(null);
        return;
      }
      if (this._start.get() === id) {
        this._start.set(null);
        return this.scene.set_overlay(null);
      } else {
        this._end.set(id);
        start_pt = this.level.get(this._start.get());
        end_pt = this.level.get(this._end.get());
        return this.scene.set_overlay(this._rule_overlay(start_pt, end_pt));
      }
    };

    Ruler.prototype._make_node = function(pt_id, status) {
      return this._gfx.make_node(pt_id, {
        status: status,
        click: (function(_this) {
          return function(e) {
            var end, start;
            start = _this._start.get();
            end = _this._end.get();
            console.log('click', start, end, pt_id);
            if (start == null) {
              _this.set_start(pt_id);
            } else if (end == null) {
              _this.set_end(pt_id);
            } else {
              _this.set_start(pt_id);
              _this.set_end(null);
              _this.scene.set_overlay(null);
            }
            return _this.emit('change');
          };
        })(this)
      });
    };

    Ruler.prototype.measure = function() {
      var end, len, start;
      start = this._start.get();
      end = this._end.get();
      if ((start == null) || (end == null)) {
        return null;
      }
      start = this.level.get(start);
      end = this.level.get(end);
      len = Point.dist(start, end);
      return {
        ref: start,
        mesg: "Length is " + len,
        mouseover: (function(_this) {
          return function() {};
        })(this),
        mouseout: (function(_this) {
          return function() {};
        })(this)
      };
    };

    return Ruler;

  })(EventEmitter);

  exports.Ruler = Ruler;

}).call(this);

},{"events":20,"geometry.coffee":1,"levels/base.coffee":5,"paths-js/path":11,"svg.coffee":12,"toolbox/graphics.coffee":13,"toolbox/ruler_icon.coffee":17}],17:[function(require,module,exports){
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

},{"paths-js/path":11,"svg.coffee":12}],18:[function(require,module,exports){
(function() {
  var EventEmitter, Locator, Ruler, SVG, ToolBox;

  SVG = require('svg.coffee');

  EventEmitter = require('events').EventEmitter;

  ToolBox = (function() {
    var TMPL;

    TMPL = '<div>\n  <div class="toolbox-section tool-selection-area">\n    <div class="tool-title">Tools</div>\n    <div class="tool-selection"></div>\n  </div>\n  <div class="toolbox-section tool-measurement-area">\n    <div class="tool-action-points"></div>\n    <div class="tool-status"></div>\n    <div class="tool-notebook"></div>\n  </div>\n</div>';

    function ToolBox(_arg) {
      var default_tool, name, sel_elt, tool, _fn, _ref;
      this.level = _arg.level, this.scene = _arg.scene, this.tools = _arg.tools, default_tool = _arg.default_tool;
      if (default_tool == null) {
        default_tool = null;
      }
      this.ap_used = 0;
      this._elt = $(TMPL);
      this._cur_tool = null;
      this._icon_elts = {};
      sel_elt = this._elt.find('.tool-selection');
      _ref = this.tools;
      _fn = (function(_this) {
        return function(name, tool) {
          var container, icon;
          icon = tool.icons.unselected;
          container = ($('<div></div>')).addClass('tool-icon').append(icon);
          container.click(function() {
            return _this.select(name);
          });
          _this._icon_elts[name] = container;
          return sel_elt.append(container);
        };
      })(this);
      for (name in _ref) {
        tool = _ref[name];
        _fn(name, tool);
      }
      this._measurements = [];
      this.select(default_tool);
      this._update();
      this._on_tool_change = null;
    }

    ToolBox.prototype.elt = function() {
      return this._elt;
    };

    ToolBox.prototype._do_measure = function() {
      var result, tool;
      if (this._cur_tool == null) {
        return;
      }
      tool = this.tools[this._cur_tool];
      result = tool.measure();
      if (result == null) {
        return;
      }
      this.ap_used += tool.cost;
      this._on_measure(result);
      return this._update();
    };

    ToolBox.prototype._update = function() {
      var pts_txt;
      pts_txt = this.ap_used === 1 ? "1 action point used" : "" + this.ap_used + " action points used";
      return (this._elt.find('.tool-action-points')).text(pts_txt);
    };

    ToolBox.prototype._deactivate = function(name) {
      var tool;
      tool = this.tools[name];
      this._icon_elts[name].empty();
      this._icon_elts[name].append(tool.icons.unselected);
      this.level.clear_render_hooks();
      this.scene.mousemove(null);
      this.scene.set_overlay(null);
      console.log('deactivating', name);
      tool.deactivate();
      if (this._on_tool_change != null) {
        return tool.removeListener('change', this._on_tool_change);
      }
    };

    ToolBox.prototype._activate = function(name) {
      var tool;
      tool = this.tools[name];
      this._icon_elts[name].empty();
      this._icon_elts[name].append(tool.icons.selected);
      console.log('activating', name);
      tool.activate();
      this._on_tool_change = (function(_this) {
        return function() {
          var button, status_elt;
          status_elt = _this._elt.find('.tool-status');
          status_elt.empty();
          button = ($('<button>Measure!</button>')).click(_this._do_measure.bind(_this));
          if (tool.measure() == null) {
            button.prop('disabled', true);
          }
          return status_elt.append(button);
        };
      })(this);
      tool.on('change', this._on_tool_change);
      this._on_tool_change();
      return this.scene.render();
    };

    ToolBox.prototype.select = function(name) {
      if (this._cur_tool != null) {
        this._deactivate(this._cur_tool);
      }
      if (this._cur_tool === name) {
        this._cur_tool = null;
        return;
      }
      this._cur_tool = name;
      return this._activate(this._cur_tool);
    };

    ToolBox.prototype._on_measure = function(result) {
      var elt;
      this._measurements.push(result);
      elt = $("<div>" + result.mesg + "</div>");
      elt.hover((function() {
        return result.mouseover();
      }), (function() {
        return result.mouseout();
      }));
      return (this._elt.find('div.tool-notebook')).append(elt);
    };

    return ToolBox;

  })();

  Locator = require('toolbox/locator.coffee').Locator;

  Ruler = require('toolbox/ruler.coffee').Ruler;

  exports.setup_tools = function(level, scene) {
    var TOOLS, name, tool, tool_data, tool_type, tools;
    TOOLS = {
      locator: Locator,
      ruler: Ruler
    };
    tools = {};
    for (name in TOOLS) {
      tool_type = TOOLS[name];
      tool_data = level.allowed_tools[name];
      if (tool_data == null) {
        continue;
      }
      tool = new tool_type(level, tool_data, scene);
      tools[name] = tool;
      tool.on('change', (function(_this) {
        return function() {
          return scene.render();
        };
      })(this));
    }
    return {
      toolbox: new ToolBox({
        level: level,
        tools: tools,
        scene: scene,
        default_tool: 'locator'
      })
    };
  };

  exports.ToolBox = ToolBox;

}).call(this);

},{"events":20,"svg.coffee":12,"toolbox/locator.coffee":14,"toolbox/ruler.coffee":16}],19:[function(require,module,exports){
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

},{"util/":24}],20:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],24:[function(require,module,exports){
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
},{"./support/isBuffer":23,"_process":22,"inherits":21}],25:[function(require,module,exports){
(function() {
  var LevelLoader, SVG, Scene, ShapeMaker, ToolBox, setup_tools, _ref;

  SVG = require('svg.coffee');

  LevelLoader = require('levels/loader.coffee');

  ShapeMaker = require('input/shape_maker.coffee').ShapeMaker;

  _ref = require('toolbox/toolbox.coffee'), ToolBox = _ref.ToolBox, setup_tools = _ref.setup_tools;

  Scene = (function() {
    var standardize_evt;

    standardize_evt = function(e) {
      var _ref1, _ref2;
      return {
        x: (_ref1 = e.offsetX) != null ? _ref1 : e.clientX - $(e.target).offset().left,
        y: (_ref2 = e.offsetY) != null ? _ref2 : e.clientY - $(e.target).offset().top,
        right: e.which === 3
      };
    };

    function Scene(level) {
      var xform_str;
      this.level = level;
      this.svg = SVG.root(this.level.dims.width, this.level.dims.height);
      xform_str = "translate(" + this.level.dims.offset_x + ", " + this.level.dims.offset_y + ") scale(1, -1)";
      this.xform = SVG.g({
        transform: xform_str
      });
      this.svg.appendChild(this.xform);
      this._overlay = null;
      this._mousemove_handler = null;
      ($(this.svg)).mousemove((function(_this) {
        return function(e) {
          if (_this._mousemove_handler != null) {
            e = standardize_evt(e);
            e.x -= _this.level.dims.offset_x;
            e.y -= _this.level.dims.offset_y;
            e.y = -e.y;
            return _this._mousemove_handler(e);
          }
        };
      })(this));
    }

    Scene.prototype.mousemove = function(_mousemove_handler) {
      this._mousemove_handler = _mousemove_handler;
    };

    Scene.prototype.svg_elt = function() {
      return this.svg;
    };

    Scene.prototype.render = function() {
      while (this.xform.firstChild) {
        this.xform.removeChild(this.xform.firstChild);
      }
      this.level.render(this.xform);
      if (this._overlay != null) {
        return this.xform.appendChild(this._overlay);
      }
    };

    Scene.prototype.set_overlay = function(_overlay) {
      this._overlay = _overlay;
      return this.render();
    };

    Scene.prototype.animate_overlay = function(_arg) {
      var duration, fps, interval_id, on_end, on_tick, start, tick;
      fps = _arg.fps, duration = _arg.duration, on_tick = _arg.on_tick, on_end = _arg.on_end;
      if (fps == null) {
        fps = 40;
      }
      tick = 1000 / fps;
      start = (new Date).valueOf();
      this._overlay = SVG.g({});
      interval_id = setInterval(((function(_this) {
        return function() {
          var elapsed, now;
          now = (new Date).valueOf();
          elapsed = (now - start) / duration;
          _this._overlay = on_tick(elapsed);
          return _this.render();
        };
      })(this)), tick);
      return setTimeout(((function(_this) {
        return function() {
          clearInterval(interval_id);
          _this._overlay = on_end();
          return _this.render();
        };
      })(this)), duration);
    };

    return Scene;

  })();

  window.onload = function() {
    var RIGHT_GREEN, SCORE_TO_MESG, WRONG_RED, level, level_id, scene, sm, tb;
    level_id = window.location.hash.slice(1);
    level = LevelLoader.load(level_id);
    if (level == null) {
      console.log("Hash \"" + level_id + "\" does not specify a level, defaulting to l1");
      level = LevelLoader.load('l1');
    }
    window.level = level;
    scene = new Scene(level);
    tb = (setup_tools(level, scene)).toolbox;
    ($('.right-panel')).append(tb.elt());
    scene.render();
    ($('.left-panel'))[0].appendChild(scene.svg_elt());
    WRONG_RED = '#f2665c';
    RIGHT_GREEN = '#12e632';
    SCORE_TO_MESG = {
      '-1': "Doesn't fit!",
      0: '',
      1: 'Good \u2605\u2606\u2606',
      2: 'Great! \u2605\u2605\u2606',
      3: 'Perfect! \u2605\u2605\u2605'
    };
    sm = new ShapeMaker(level.input_shape, (function(_this) {
      return function(shape) {
        var color, disp_text, ease, final_color, label_pos, score, text_elt;
        score = level.evaluate(shape).score;
        color = score === -1 ? WRONG_RED : RIGHT_GREEN;
        disp_text = SCORE_TO_MESG[score];
        label_pos = shape.label();
        text_elt = SVG.text({
          x: label_pos.x,
          y: -label_pos.y,
          'font-family': 'sans-serif',
          'font-size': '16px',
          fill: 'black',
          transform: "scale(1, -1)",
          'text-anchor': 'middle'
        });
        text_elt.innerHTML = disp_text;
        ease = function(x) {
          var f;
          f = function(t) {
            return t * t * t;
          };
          return (f(x) - f(0)) / (f(1) - f(0));
        };
        final_color = (typeof opt !== "undefined" && opt !== null) && score >= 0.9999 * opt ? 'gold' : 'black';
        return scene.animate_overlay({
          fps: 40,
          duration: 400,
          on_tick: function(elapsed) {
            return SVG.attrs(shape.svg(), {
              opacity: 0.1 + 0.8 * (ease(elapsed)),
              fill: color,
              stroke: 'black'
            });
          },
          on_end: function() {
            return SVG.g({}, [
              SVG.attrs(shape.svg(), {
                opacity: 0.9,
                fill: color,
                stroke: final_color
              }), text_elt
            ]);
          }
        });
      };
    })(this));
    ($('.right-panel')).prepend($('<div class="app-title">Slice</div>'));
    return ($('.right-panel')).append(sm.elt());
  };

}).call(this);

},{"input/shape_maker.coffee":3,"levels/loader.coffee":9,"svg.coffee":12,"toolbox/toolbox.coffee":18}]},{},[25]);

