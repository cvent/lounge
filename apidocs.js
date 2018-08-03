#!/usr/bin/env node

const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs')
const path = require('path')

const inputDir = path.join(__dirname, 'lib')
const outputDir = path.join(__dirname, 'docs/api')

const files = fs.readdirSync(inputDir)

const sourceFiles = files.map(p => {
  const ext = path.extname(p)
  if (ext === '.js') {
    const inputPath = path.join(__dirname, 'lib', p)
    return inputPath
  }
})

/* get template data */
const templateData = jsdoc2md.getTemplateDataSync({ files: sourceFiles })

/* reduce templateData to an array of class names */
const classNames = templateData.reduce((classNames, identifier) => {
  if (identifier.kind === 'class') classNames.push(identifier.name)
  return classNames
}, [])

/* create a documentation file for each class */
for (const className of classNames) {
  const template = `---\nsidebarDepth: 0\n---\n{{#class name="${className}"}}{{>docs}}{{/class}}`

  const output = jsdoc2md.renderSync({ data: templateData, template: template })
  const outputFile = `${className}.md`
  console.log(`Writing ${outputDir}/${outputFile}`)
  fs.writeFileSync(path.join(outputDir, outputFile), output)
}
