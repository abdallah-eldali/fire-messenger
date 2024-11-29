#!/bin/bash

#This script automatically creates the packages for the extension for both chrome and firefox and places them in build/ directory
package_extension() {
  jq -s '.[0] * .[1]' ./dist/common-manifest-template.json ./dist/$1/$1-manifest-template.json > ./src/manifest.json

  name=$(jq '.name' ./src/manifest.json | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-' | tr -d '"') 

  options=''
  if [ $1 = 'firefox' ]; then
    options='--exclude *polyfill*.js'
  fi

  if [ $1 = 'chrome' ]; then
    options='--exclude *.svg'
  fi

  (cd ./src/ ; zip -r -FS ../build/$1_$name.zip * $options ; cd -)
}

mkdir -p ./build

package_extension firefox
package_extension chrome

rm -f ./src/manifest.json
