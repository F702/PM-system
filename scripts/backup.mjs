import COS from 'cos-nodejs-sdk-v5'
import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

const required = name => { const value = process.env[name]; if (!value) throw new Error(`missing ${name}`); return value }
const run = (command, args) => new Promise((resolve, reject) => { const child = spawn(command, args, { stdio: 'inherit' }); child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)) })
const main = async () => {
  const databaseUrl = required('DATABASE_URL'), directory = process.env.BACKUP_DIRECTORY || '/opt/project-manager/shared/backups', stamp = new Date().toISOString().replace(/[:.]/g, '-'), file = join(directory, `project-manager-${stamp}-${randomUUID()}.dump`)
  await mkdir(directory, { recursive: true }); await run('pg_dump', ['--format=custom', '--no-owner', `--file=${file}`, databaseUrl])
  const body = await readFile(file), key = `backups/postgresql/${stamp}.dump`, checksum = createHash('sha256').update(body).digest('hex')
  const cos = new COS({ SecretId: required('COS_SECRET_ID'), SecretKey: required('COS_SECRET_KEY') })
  await cos.putObject({ Bucket: required('COS_BUCKET'), Region: required('COS_REGION'), Key: key, Body: body, ContentLength: body.length, Headers: { 'x-cos-meta-sha256': checksum } })
  await rm(file, { force: true }); console.log(`Backup uploaded: ${key}`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
