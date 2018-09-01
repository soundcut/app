#!/usr/bin/env bash

mkdir -p shared/views

for f in $(ls shared/templates); do
  echo 'module.exports = (render, props) => render`' > "shared/views/${f:0:-4}js"
  cat shared/templates/$f >> "shared/views/${f:0:-4}js"
  echo '`;' >> "shared/views/${f:0:-4}js"
done
