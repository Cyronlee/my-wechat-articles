import { existsSync, lstatSync, unlinkSync, symlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, exec } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const EDITOR_DIR = resolve(PROJECT_ROOT, 'md-editor')
const EDITOR_PUBLIC = resolve(EDITOR_DIR, 'apps/web/public')
const ARTICLES_DIR = resolve(PROJECT_ROOT, 'articles')
const LINK_TARGET = resolve(EDITOR_PUBLIC, 'articles')

if (existsSync(LINK_TARGET) && lstatSync(LINK_TARGET).isSymbolicLink()) {
  unlinkSync(LINK_TARGET)
}
symlinkSync(ARTICLES_DIR, LINK_TARGET)
console.log('✅ 已链接 articles/ → md-editor/apps/web/public/articles')

const slug = process.argv[2]
if (slug) {
  const articleFile = resolve(ARTICLES_DIR, slug, 'article.md')
  if (!existsSync(articleFile)) {
    console.error(`❌ 找不到文章: ${articleFile}`)
    process.exit(1)
  }
  console.log(`📄 预览文章: ${slug}`)
}

console.log('🚀 正在启动 doocs/md 编辑器...\n')

const child = spawn('pnpm', ['web', 'dev'], {
  cwd: EDITOR_DIR,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
})

let opened = false

function tryOpenBrowser(data) {
  const text = data.toString()
  process.stdout.write(text)

  if (opened) return

  // Vite 输出形如: ➜  Local:   http://localhost:5173/md/
  const match = text.match(/Local:\s+(http:\/\/localhost:(\d+)\/md\/)/)
  if (!match) return

  opened = true
  const base = match[1]
  const port = match[2]

  if (slug) {
    const articlePath = `/articles/${slug}/article.md`
    const editorUrl = `${base}?open=${encodeURIComponent(articlePath)}`
    console.log(`\n🌐 正在打开浏览器预览: ${slug}`)
    console.log(`   编辑器: ${editorUrl}\n`)
    exec(`open "${editorUrl}"`)
  } else {
    console.log(`\n🌐 正在打开浏览器...`)
    console.log(`   编辑器: ${base}\n`)
    exec(`open "${base}"`)
  }
}

child.stdout.on('data', tryOpenBrowser)
child.stderr.on('data', (data) => process.stderr.write(data))
child.on('close', (code) => process.exit(code ?? 0))
