var marked = require('marked');
var fs = require('fs');
var path = require('path');

var filenames = fs.readdirSync('./guide');

var header = fs.readFileSync('./guide/header.html', 'utf8');
var footer = fs.readFileSync('./guide/footer.html', 'utf8');

filenames.forEach(function (filename) {
  if (path.extname(filename) === '.md') {
    console.log('converting %s', filename);
    var content = fs.readFileSync('./guide/'.concat(filename), 'utf8');
    var html = marked(content);
    var output = header.concat(html, footer);
    fs.writeFileSync('./guide/'.concat(path.basename(filename, '.md'), '.html'), output);
  }
});
