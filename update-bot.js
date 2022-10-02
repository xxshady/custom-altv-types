import { exec } from 'child_process'
import fs from 'fs'
import { Octokit } from 'octokit'

const YARN_LOCK_ALTV_LINE = 'https://github.com/altmp/altv-types#'

const authToken = process.argv[2]
console.log('authToken:', authToken)

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
        console.log(command, 'child proc exit')
        resolve()
      })
    }
    catch (e) {
      reject(e)
    }
  })
}

const updateInterval = async () => {
  console.log('checking latest commit...')

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
  
  console.log('equals:', equals, latestCommit, currentCommit)
  
  if (!equals) {
    console.log('updating docs...')
  
    await spawnChildProcess('yarn update')
    await spawnChildProcess('git add docs')
    await spawnChildProcess('git add docs/*')
    await spawnChildProcess(`git commit -m "[bot] update to: https://github.com/altmp/altv-types/commit/${latestCommit}"`)
    await spawnChildProcess('git push origin main')
  }
}

updateInterval()
setInterval(updateInterval, 1000 * 60 * 30 /** per 30 min */)
