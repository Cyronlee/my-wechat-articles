import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ARTICLES_DIR = resolve(__dirname, '..', 'articles')

const slug = process.argv[2]
const title = process.argv[3] || slug

if (!slug) {
  console.error('用法: node scripts/new-article.mjs <slug> [标题]')
  process.exit(1)
}

const date = new Date().toISOString().slice(0, 10)
const dir = resolve(ARTICLES_DIR, `${date}-${slug}`)

if (existsSync(dir)) {
  console.error(`❌ 目录已存在: ${dir}`)
  process.exit(1)
}

mkdirSync(resolve(dir, 'assets'), { recursive: true })

writeFileSync(resolve(dir, 'article.md'), `## ${title}\n\n在此撰写文章内容...\n`)

writeFileSync(resolve(dir, 'meta.json'), JSON.stringify({
  title,
  summary: '',
  tags: [],
  created_at: date,
  status: 'draft',
}, null, 2) + '\n')

writeFileSync(resolve(dir, 'research.md'), '# 调研笔记\n')
writeFileSync(resolve(dir, 'sources.md'), '# 来源记录\n')

console.log(`✅ 新文章已创建: ${dir}`)
console.log('   article.md  - 文章正文')
console.log('   meta.json   - 元信息')
console.log('   research.md - 调研笔记')
console.log('   sources.md  - 来源记录')
console.log('   assets/     - 图片目录')
