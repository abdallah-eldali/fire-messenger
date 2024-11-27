#!/bin/bash

#This script automatically creates the packages for the extension for both chrome and firefox and places them in build/ directory
package_extension() {
  jq -s '.[0] * .[1]' ./dist/common-manifest-template.json ./dist/$1/$1-manifest-template.json > ./src/manifest.json

  name=$(jq '.name' ./src/manifest.json | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-' | tr -d '"') 

  zip -j ./build/$1_$name.zip ./src/*
}

mkdir -p ./build

package_extension firefox
package_extension chrome

rm -f ./src/manifest.json
