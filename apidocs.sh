#!/bin/bash
FILES=lib/*.js
for p in $FILES
do
  echo "Processing path $p..."
  file=${$(basename $p)%.*}
  echo "Processing file $f..."
  f=${file%.*}
  echo "Processing f $f..."
  # take action on each file. $f store current file name
  ./node_modules/jsdoc-to-markdown/bin/cli.js -f ./$p > ./docs/api/$f.md
done
