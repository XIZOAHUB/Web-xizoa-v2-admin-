import { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEditorStore } from '../../stores/editorStore'

export default function MarkdownEditor() {
  const { content, setField } = useEditorStore()

  const onChange = useCallback((value: string) => {
    setField('content', value)
  }, [setField])

  return (
    <CodeMirror
      value={content}
      height="calc(100vh - 300px)"
      extensions={[markdown()]}
      theme={document.documentElement.classList.contains('dark') ? oneDark : 'light'}
      onChange={onChange}
      className="rounded-lg overflow-hidden"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: false,
      }}
    />
  )
}
