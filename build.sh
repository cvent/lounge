RAW="https://raw.githubusercontent.com"

files=("intro" "modeling" "middleware" "extend" "embedded" "docops" "population" "indexes" "events" "errors")

for i in "${files[@]}"
do
	curl -s ${RAW}/bojand/lounge/master/guide/${i}.md > public/${i}.md
done

./node_modules/jade/bin/jade views/index.jade -o .

rm ./public/*.md
