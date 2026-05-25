// src/lib/shareCard.ts
import html2canvas from 'html2canvas'

export async function exportCardAsPng(element: HTMLElement, filename: string): Promise<void> {
  // At least 3× — follow device pixel ratio for crisp Retina output
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
