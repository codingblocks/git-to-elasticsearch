/* Get the git history as json */

let historyText = require('fs')
  .readFileSync('./history.txt', 'utf-8')
  .replace(/\r/g, `\n`) // get rid of carriage returns
  .replace(/\n\n+/g, ' ') // compress multi line items
  .replace(/(\w\n)|(\.\n)/g, ' ') // edge case

// because regex are hard, lets just do this last bit teh easy way
// go through and look for lines that have embedded quotes
let historyList = historyText.split(`\n`).map(l => {
  const matches = l.match(/\s+"(\w+)": "(.*".*)",/)
  if (matches && matches.length) {
    const result = `"${matches[1]}": "${matches[2].replace(/"/g, '')}",`
    return result
  } else {
    return l
  }
})

// fix the end character
historyList[historyList.length - 1] = '}'

const finalHistoryJsonText = `[${historyList.join(`\n`)}]`
require('fs').writeFileSync(`finaljson.json`, finalHistoryJsonText)

let history = JSON.parse(finalHistoryJsonText)

/* Get the file data */

const commitHash = history.reduce((hash, commit) => {
  hash[commit.commit] = commit
  return hash
}, {})

const fileDataLines = require('fs')
  .readFileSync('asciifiles.txt', 'utf-8')
  .split('\n')

let currentCommit = null
for (let i = 0; i < fileDataLines.length; i++) {
  let line = fileDataLines[i]
  let commitMatches = line.match(/^commit\s(.*)/)
  if (commitMatches) {
    currentCommit = commitHash[commitMatches[1]]
    currentCommit.files = []
  } else {
    let fileMatches = line.match(/^(A|M|D)\s+(.*)/)
    if (fileMatches) {
      currentCommit
      currentCommit.files.push({
        change: fileMatches[1],
        filename: fileMatches[2]
      })
    }
  }
}

/* Format for Elasticsearch Bulk API */
const indexName = 'git-history'
const importLines = []
history.forEach(h => {
  importLines.push({ index: { _index: indexName, _id: h.commit } })
  importLines.push(h)
})

require('fs').writeFileSync(
  `importFile.txt`,
  importLines.map(i => JSON.stringify(i)).join('\n') + '\n'
)
