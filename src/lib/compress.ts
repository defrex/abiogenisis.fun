export async function compress(fragments: Array<Uint8Array>): Promise<{
  uncompressed: number
  compressed: number
  ratio: number
}> {
  const totalLength = fragments.reduce((acc, arr) => acc + arr.length, 0)
  const concatenatedArray = new Uint8Array(totalLength)
  let offset = 0

  for (const arr of fragments) {
    concatenatedArray.set(arr, offset)
    offset += arr.length
  }

  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()

  writer.write(concatenatedArray)
  writer.close()

  const compressedChunks = []
  const reader = cs.readable.getReader()

  let compressed = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    compressedChunks.push(value)
    compressed += value.length
  }

  const uncompressed = concatenatedArray.length
  const ratio = compressed / uncompressed

  return {
    uncompressed,
    compressed,
    ratio,
  }
}
