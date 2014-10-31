assert = require 'assert'
util = require 'util'

TOKENS = {
  OPERATION:  '^*/+-'
  FUNCTION:   'fgh'
  VARIABLE:   'xyzw'
  CONSTANT:   '01234567890.'
  OPEN_PAREN:  '('
  CLOSE_PAREN: ')'
}

PRECEDENCE = {
  '^' : 3
  '*' : 2
  '/' : 2
  '+' : 1
  '-' : 1
}

token_type = (token_char) ->
  for k,v of TOKENS
    if token_char in v then return k
  assert false, "token type invalid"
  return 'INVALID'

# deal with spaces in the expression_str
# deal with functions other than fgh & variables other than xyz.
# right now does sanity asserts for valid input.
#     in future, give better debug/helpful msgs, maybe don't assert.
# optimize tree.. addition can have more than 2 args (children).
# optimize products without the * sign. e.g. abc is product a*b*c.
# allow other functions like: sin cos tan (csc sec cot) log...
get_syntax_tree = (expression_str) ->
  # console.log "get syntax tree of " , expression_str
  # assert that it has only valid characters in it.
  assert expression_str.length > 0
  nesting_depth = 0

  best_token_index = -1
  best_token = ''
  best_nesting_depth = -1
  for i in [0...expression_str.length]
    c = expression_str[i]
    switch token_type(c)
      when 'OPEN_PAREN' then nesting_depth += 1
      when 'CLOSE_PAREN' then nesting_depth -= 1
      when 'OPERATION'
        if best_nesting_depth == -1 or nesting_depth < best_nesting_depth or (nesting_depth == best_nesting_depth and PRECEDENCE[c] <= PRECEDENCE[best_token])
          best_token_index = i
          best_token = c
          best_nesting_depth = nesting_depth
    assert nesting_depth >= 0
  assert nesting_depth == 0

  if best_nesting_depth == 0
    assert best_token_index > 0
    assert best_token_index < expression_str.length
    left_str = expression_str.substring(0, best_token_index)
    right_str = expression_str.substring(best_token_index + 1, expression_str.length)
    return {token_type: token_type(best_token), token_name: best_token, children: [get_syntax_tree(left_str), get_syntax_tree(right_str)]}

  switch token_type(expression_str[0])
    when 'FUNCTION'
      assert token_type(expression_str[1]) == 'OPEN_PAREN'
      assert token_type(expression_str[expression_str.length - 1]) == 'CLOSE_PAREN'
      function_args = expression_str.substring(2, expression_str.length - 1).split ","
      return {token_type: 'FUNCTION', token_name: expression_str[0], children: (get_syntax_tree(elt) for elt in function_args)}
    when 'OPEN_PAREN'
      assert token_type(expression_str[expression_str.length - 1]) == 'CLOSE_PAREN'
      return get_syntax_tree(expression_str.substring(1, expression_str.length - 1))
    when 'VARIABLE' then return {token_type: 'VARIABLE', token_name: expression_str}
    when 'CONSTANT' then return {token_type: 'CONSTANT', token_name: expression_str}

  assert false, "invalid"

# assume function and variable namespace don't collide for now.
evaluate = (syntax_tree, functions, variables) ->
  # console.log "evaluate ", syntax_tree, functions, variables
  switch syntax_tree.token_type
    when 'CONSTANT' then return parseFloat(syntax_tree.token_name)
    when 'VARIABLE'
      assert syntax_tree.token_name of variables
      return variables[syntax_tree.token_name]
    when 'OPERATION'
      evaluated_children = (evaluate(elt, functions, variables) for elt in syntax_tree.children)
      switch syntax_tree.token_name
        when '+' then return evaluated_children.reduce (t, s) -> t+s
        when '*' then return evaluated_children.reduce (t, s) -> t*s
        when '^'
          assert evaluated_children.length == 2
          return Math.pow(evaluated_children[0], evaluated_children[1])
        when '/'
          assert evaluated_children.length == 2
          assert evaluated_children[1] != 0
          return evaluated_children[0] / evaluated_children[1]
        when '-'
          assert evaluated_children.length == 2
          return evaluated_children[0] - evaluated_children[1]
    when 'FUNCTION'
      assert syntax_tree.token_name of functions
      fn = functions[syntax_tree.token_name]
      assert fn.inputs.length == syntax_tree.children.length

      evaluated_children = (evaluate(elt, functions, variables) for elt in syntax_tree.children)
      sub_tree = get_syntax_tree(fn.output_expression_str)
      more_variables = variables
      for i in [0...fn.inputs.length]
        more_variables[fn.inputs[i]] = evaluated_children[i]
      return evaluate(sub_tree, functions, more_variables)
  assert false



# example usage.
funz = {f: {inputs: ["z"], output_expression_str: "z+1"} }
varz = {x: 0.5, y: 5}
tree = get_syntax_tree("x^2+f(1+3/y)*(y)")
console.log util.inspect(tree, {depth:null})
console.log "eval", evaluate(tree, funz, varz)


t = get_syntax_tree("30.5+5*x-2+x^6")
console.log util.inspect(t, {depth:null})
console.log "eval", evaluate(t, funz, varz)
