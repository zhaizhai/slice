assert = require 'assert'

exports.$ajax = $ajax = (endpoint, data, req_type, cb) ->
  assert req_type is 'get' or req_type is 'post'

  if req_type is 'post'
    data = JSON.stringify data

  on_success = (res, status, xhr) ->
    # TODO: if server gives 500 will this be called?
    err = if xhr.status is 200 then null else xhr.status
    return cb err, res

  # status is one of 'timeout', 'error', 'abort', 'parsererror'
  on_error = (xhr, status, mesg) ->
    code = xhr.status
    return cb {code, status, mesg}

  return $.ajax {
    url: endpoint
    type: req_type
    contentType: "application/json"
    data: data
    success: on_success
    error: on_error
  }

$ajax.get = (endpoint, data, cb) ->
  return $ajax endpoint, data, 'get', cb

$ajax.post = (endpoint, data, cb) ->
  return $ajax endpoint, data, 'post', cb
