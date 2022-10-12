import fs from 'fs'

const CSS_FONT_FILE = "fonts/inter.css"
const CSS_DOCS_DIR = "docs/assets/css"
const CSS_DOCS_FILE = `${CSS_DOCS_DIR}/main.css`

const fontFiles = fs.readdirSync("fonts")
fontFiles.splice(fontFiles.indexOf("inter.css"), 1)
console.log(fontFiles)

for(const name of fontFiles) {
  fs.copyFileSync(`fonts/${name}`, CSS_DOCS_DIR + `/${name}`)
}

const fontFile = fs.readFileSync(CSS_FONT_FILE).toString()
// console.log(content)

let newDocsContent = fs.readFileSync(CSS_DOCS_FILE).toString()
newDocsContent = fontFile + newDocsContent
newDocsContent = newDocsContent.replaceAll("font-family:sans-serif", "font-family: Inter, sans-serif")
newDocsContent = newDocsContent.replaceAll('font-family:"Segoe UI"', 'font-family: Inter, "Segoe UI"')

fs.writeFileSync(CSS_DOCS_FILE, newDocsContent)
