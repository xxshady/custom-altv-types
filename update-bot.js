import { exec } from 'child_process'
import fs from 'fs'
import { Octokit } from 'octokit'

const YARN_LOCK_ALTV_LINE = 'https://github.com/altmp/altv-types#'

const authToken = process.argv[2]
log('authToken:', authToken)

const github = new Octokit({
  auth: authToken,
})

const spawnChildProcess = (command) => {
  return new Promise((resolve) => {
    try {
      const child = exec(command)
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    
      child.on("exit", (code) => {
        log(command, 'child proc exit')
        resolve()
      })
    }
    catch (e) {
      reject(e)
    }
  })
}

const updateInterval = async () => {
  log('pulling latest git changes...')
  await spawnChildProcess('git pull')

  log('checking latest commit...')

  const { 
    data: {
      0: commit,
    } 
  } = await github.rest.repos.listCommits({
    owner: 'altmp',
    repo: 'altv-types',
    per_page: 1,
  })
  
  const latestCommit = commit.sha
  const file = fs.readFileSync('yarn.lock').toString()
  
  const idx = file.indexOf(YARN_LOCK_ALTV_LINE)
  const currentCommit = file.slice(
    idx + YARN_LOCK_ALTV_LINE.length, 
    file.indexOf("\"", idx + YARN_LOCK_ALTV_LINE.length)
  )
  
  const equals = latestCommit === currentCommit
  
  log('equals:', equals, latestCommit, currentCommit)
  
  if (!equals) {
    log('updating docs...')
  
    await spawnChildProcess('yarn update')
    await spawnChildProcess('git add --all')
    await spawnChildProcess(`git commit -m "[bot] update to: https://github.com/altmp/altv-types/commit/${latestCommit}"`)
    await spawnChildProcess('git push origin main')
  }
}

updateInterval()
setInterval(updateInterval, 1000 * 60 * 30 /** per 30 min */)

// borrowed from altv js module :)
function getTime() {
  const date = new Date()
  const hours = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds()
  return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
}

function log(...args) {
  console.log(`[${getTime()}]`, ...args)
}
