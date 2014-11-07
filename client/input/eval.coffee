assert = require 'assert'
util = require 'util'

DEFAULT_FUNCTIONS = ['sin','cos','tan','sec','csc','cot', \
                     'log','sqrt','ceil','floor']

TOKEN_REGEX = {
  VARIABLE:    /^[a-zA-Z][a-zA-Z0-9]*/
  FUNCTION:    /^[a-zA-Z][a-zA-Z0-9]*\(/
  NUMBER:      /^[-+]?[0-9]*\.?[0-9]+/
  OPERATION:   /^[\^*/+-]/
  OPEN_PAREN:  /^\(/
  CLOSE_PAREN: /^\)/
  COMMA:       /^,/
}

PRECEDENCE = {
  '^' : 3
  '*' : 2
  '/' : 2
  '+' : 1
  '-' : 1
}

# returns the longest prefix of some token type.
get_prefix = (expression_str, token_type) ->
  return "" unless match = TOKEN_REGEX[token_type].exec(expression_str)
  [prefix] = match
  return prefix

# do sanity checks when tokenizing.
# check matched parentheses, make sure # ) never gt. than # (
# check no empty parens.
# allow commas, parse function args properly
# right now does sanity asserts for valid input.
#     in future, give better debug/helpful msgs, maybe don't assert.
# assert that it has only valid characters in it.
tokenize = (expression_str) ->
  token_list = []
  ix = 0
  while ix < expression_str.length
    substr = expression_str.slice(ix, expression_str.length)
    c = expression_str[ix]

    if c == ' '
      ix += 1
      continue

    function_prefix = get_prefix(substr, 'FUNCTION')
    if function_prefix.length > 0
      token_list.push({token_type: 'FUNCTION', token_name: function_prefix.slice(0, function_prefix.length-1)})
      token_list.push({token_type: 'OPEN_PAREN', token_name: '('})
      ix += function_prefix.length
      continue

    variable_prefix = get_prefix(substr, 'VARIABLE')
    if variable_prefix.length > 0
      token_list.push({token_type: 'VARIABLE', token_name: variable_prefix})
      ix += variable_prefix.length
      continue

    number_prefix = get_prefix(substr, 'NUMBER')
    if (number_prefix.length > 0 and
        (token_list.length == 0 or \
         token_list[token_list.length - 1].token_type in \
             ['OPERATION','OPEN_PAREN','CLOSE_PAREN','COMMA']))
      token_list.push({token_type: 'NUMBER', token_name: number_prefix})
      ix += number_prefix.length
      continue

    token_type_matched = false
    for k,v of TOKEN_REGEX
      if v.exec(c)?
        token_list.push({token_type: k, token_name: c})
        ix += 1
        token_type_matched = true
        break
    if token_type_matched
      continue

    assert false, "Token invalid #{substr}"
  return token_list

# optimize tree.. addition can have more than 2 args (children).
# deal with functions with multiple args (parse commas)
get_syntax_tree = (expression_str) ->
  assert expression_str.length > 0
  token_list = tokenize(expression_str)
  return get_syntax_tree_helper(token_list)

get_syntax_tree_helper = (token_list) ->
  assert token_list.length > 0
  # this is the number of nested parentheses around a token
  depth = 0

  # find the outermost operation for the root node.
  # this is the lowest precedence operation (or rightmost if all precedences are equal)
  best_token_index = -1
  best_depth = -1
  for i in [0...token_list.length]
    t = token_list[i]
    switch t.token_type
      when 'OPEN_PAREN' then depth += 1
      when 'CLOSE_PAREN' then depth -= 1
      when 'OPERATION'
        if (best_token_index == -1 or depth < best_depth or \
            (depth == best_depth and \
             PRECEDENCE[t.token_name] <= \
                 PRECEDENCE[token_list[best_token_index].token_name]))
          best_token_index = i
          best_depth = depth
    assert depth >= 0
  assert depth == 0
  # if there exists an operation outside all parentheses, choose it for the root.
  if best_depth == 0
    assert best_token_index > 0
    assert best_token_index < token_list.length
    left_token_list = token_list.slice(0, best_token_index)
    right_token_list = token_list.slice(best_token_index + 1, token_list.length)
    best_token = token_list[best_token_index]
    return {token_type: best_token.token_type, token_name: best_token.token_name, \
            children: [get_syntax_tree_helper(left_token_list), \
                       get_syntax_tree_helper(right_token_list)]}

  # if there is no operation at depth zero, then check what else it could be.

  t = token_list[0]
  if t.token_type in ['FUNCTION']
    assert token_list.length >= 3
    assert token_list[1].token_type == 'OPEN_PAREN'
    assert token_list[token_list.length - 1].token_type == 'CLOSE_PAREN'
    # for now, assume there's only one function arg. fix later.
    function_args = token_list.slice(2, token_list.length - 1)
    return {token_type: t.token_type, \
            token_name: t.token_name, \
            children: [get_syntax_tree_helper(function_args)]}
  if t.token_type in ['VARIABLE', 'NUMBER']
    assert token_list.length == 1
    return {token_type: t.token_type, token_name: t.token_name}
  if t.token_type in ['OPEN_PAREN']
    assert token_list[token_list.length-1].token_type == 'CLOSE_PAREN'
    return get_syntax_tree_helper(token_list.slice(1, token_list.length - 1))
  assert false, "invalid"

# assume function and variable namespace don't collide for now.
evaluate = (syntax_tree, user_functions, user_variables) ->
  switch syntax_tree.token_type
    when 'NUMBER' then return parseFloat(syntax_tree.token_name)
    when 'VARIABLE'
      assert syntax_tree.token_name of user_variables
      return user_variables[syntax_tree.token_name]
    when 'OPERATION'
      evaluated_children = (evaluate(elt, user_functions, user_variables) for elt in syntax_tree.children)
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
      assert syntax_tree.token_name of user_functions
      fn = user_functions[syntax_tree.token_name]
      assert fn.inputs.length == syntax_tree.children.length

      evaluated_children = (evaluate(elt, user_functions, user_variables) for elt in syntax_tree.children)
      sub_tree = get_syntax_tree(fn.output_expression_str)
      more_variables = user_variables
      for i in [0...fn.inputs.length]
        more_variables[fn.inputs[i]] = evaluated_children[i]
      return evaluate(sub_tree, user_functions, more_variables)
  assert false

exports.tokenize = tokenize
exports.get_syntax_tree = get_syntax_tree
exports.get_syntax_tree_helper = get_syntax_tree_helper
exports.evaluate = evaluate

exports.evaluate_string = (s) ->
  try
    ast = get_syntax_tree s
    return evaluate ast, {}, {}
  catch e
    throw new Error "Syntax error in input: \"#{s}\""

