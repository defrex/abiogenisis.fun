export function randomFragment(): Uint8Array {
  return new Uint8Array(64).map(() => Math.floor(Math.random() * 256))
}
