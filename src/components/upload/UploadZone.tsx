// src/components/upload/UploadZone.tsx
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { useStatement } from '../../hooks/useStatement'
import { createT } from '../../i18n'

export default function UploadZone() {
  const { lang, addFiles } = useStatement()
  const t = createT(lang)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(fileList: FileList) {
    const inputs = await Promise.all(
      Array.from(fileList).map(async f => ({ name: f.name, text: await f.text() }))
    )
    addFiles(inputs)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors
        ${dragging
          ? 'border-green-400 bg-green-400/10'
          : 'border-gray-600 hover:border-gray-400 bg-gray-800/50'}
      `}
    >
      <div className="text-4xl mb-4">📁</div>
      <p className="text-gray-300 text-sm">{t('dragDrop')}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}
