#!/bin/bash

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR=${SCRIPT_DIR}

if [ "$SLICE_DEV" == "true" ]; then
    echo "Already in a slice-dev shell!"
    exit 1
fi

# detects non-interactive because no PS1
if [ "x$PS1" = "x" ]; then
    exec bash --rcfile "${SCRIPT_DIR}/dev.sh"
fi

if [ -e ~/.bashrc ]; then
    set +e
    source ~/.bashrc
    set -e
fi

export SLICE_DEV=true
export PATH=${PATH}:/usr/local/lib/go_appengine:${ROOT_DIR}/scripts

function setup_node_path {
    project_dirs=""

    # TODO: this default path is probably system dependent...
    default_path=/usr/local/lib/node_modules

    np=${NODE_PATH}:${default_path}:${ROOT_DIR}/client
    for x in $project_dirs; do
        np=${np}:${ROOT_DIR}/$x
    done
    export NODE_PATH=$np
}

setup_node_path

export GOPATH=${GOPATH}:${ROOT_DIR}/server

PS1="\[\e[5;31;1m\]slice-dev\[\e[0m\] $PS1"
export PS1

unset SCRIPT_DIR
set +e