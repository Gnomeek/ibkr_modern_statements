// src/lib/shareCard.ts
import html2canvas from 'html2canvas'

export async function exportCardAsPng(element: HTMLElement, filename: string): Promise<void> {
  // 至少 3x，Retina 屏跟随设备像素比，保证导出清晰
  const scale = Math.max(3, window.devicePixelRatio ?? 2)
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
