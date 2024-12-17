#!/bin/bash

#This script automatically creates the packages for the extension for both chrome and firefox and places them in build/ directory
package_extension() {

  mkdir -p ./tmp

  jq -s '.[0] * .[1]' ./dist/common-manifest-template.json ./dist/$1/$1-manifest-template.json > ./tmp/manifest.json

  name=$(jq '.name' ./tmp/manifest.json | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-' | tr -d '"')

  options=''
  if [ $1 = 'firefox' ]; then
    options='--exclude *polyfill*.js'
  fi

  if [ $1 = 'chrome' ]; then
    options='--exclude *.svg'
  fi

  cp -r ./src/* ./tmp/

  if [ $1 = 'firefox' ]; then
    sed -i '/browser-polyfill.js/d' ./tmp/popup.html
  fi

  (cd ./tmp/ ; zip -r -FS ../build/$1_$name.zip * $options ; cd -)
  rm -rf ./tmp/
}

mkdir -p ./build

package_extension firefox
package_extension chrome
