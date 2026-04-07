<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { useUIStore } from '@/stores/ui'
import CodemirrorEditor from '@/views/CodemirrorEditor.vue'

const uiStore = useUIStore()
const { isDark } = storeToRefs(uiStore)

const isUtools = ref(false)

onMounted(async () => {
  // 检测是否为 Utools 环境
  isUtools.value = !!(window as any).__MD_UTOOLS__
  if (isUtools.value) {
    document.documentElement.classList.add(`is-utools`)
  }

  // 若 URL 带有 open 参数，自动导入 Markdown 内容
  const params = new URLSearchParams(window.location.search)
  const openUrl = params.get(`open`)
  if (openUrl) {
    params.delete(`open`)
    const newSearch = params.toString()
    const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : ``) + window.location.hash
    window.history.replaceState({}, ``, cleanUrl)

    // 本地路径（以 / 开头且为 .md 文件）：直接 fetch 并写入编辑器
    if (openUrl.startsWith(`/`) && /\.md$/i.test(openUrl)) {
      try {
        const res = await fetch(openUrl)
        if (res.ok) {
          const content = await res.text()
          const editorStore = useEditorStore()
          const tryImport = () => {
            if (editorStore.editor) {
              editorStore.importContent(content)
            }
            else {
              setTimeout(tryImport, 200)
            }
          }
          tryImport()
        }
      }
      catch {}
    }
    // 远程 URL：走原有的导入弹窗流程
    else if (URL.canParse(openUrl) && /^https?:\/\//i.test(openUrl)) {
      uiStore.importMdOpenUrl = openUrl
      uiStore.isShowImportMdDialog = true
    }
  }
})
</script>

<template>
  <AppSplash />
  <CodemirrorEditor />

  <Toaster
    rich-colors
    position="top-center"
    :theme="isDark ? 'dark' : 'light'"
  />
</template>

<style lang="less">
html,
body,
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

// 抵消下拉菜单开启时带来的样式
body {
  pointer-events: initial !important;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: transparent;
}

::-webkit-scrollbar-track {
  border-radius: 6px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: #dadada;
}

.dark ::-webkit-scrollbar-thumb {
  background-color: #424242;
}

// Utools 模式下隐藏所有滚动条
.is-utools {
  ::-webkit-scrollbar {
    display: none;
  }

  // Firefox
  * {
    scrollbar-width: none;
  }

  // IE and Edge
  * {
    -ms-overflow-style: none;
  }
}

/* CSS-hints */
.CodeMirror-hints {
  position: absolute;
  z-index: 10;
  overflow-y: auto;
  margin: 0;
  padding: 2px;
  border-radius: 4px;
  max-height: 20em;
  min-width: 200px;
  font-size: 12px;
  font-family: monospace;

  color: #333333;
  background-color: #ffffff;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08);
}

.CodeMirror-hint {
  margin-top: 10px;
  padding: 4px 6px;
  border-radius: 2px;
  white-space: pre;
  color: #000000;
  cursor: pointer;

  &:first-of-type {
    margin-top: 0;
  }
  &:hover {
    background: #f0f0f0;
  }
}
.search-match {
  background-color: #ffeb3b; /* 所有匹配项颜色 */
}
.current-match {
  background-color: #ff5722; /* 当前匹配项更鲜艳的颜色 */
}
</style>
