export async function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file)

  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.drawImage(imageBitmap, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('WebP conversion failed'))
        resolve(blob!)
      },
      'image/webp',
      quality
    )
  })
}
