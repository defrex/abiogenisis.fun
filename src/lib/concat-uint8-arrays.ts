export function concatUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const concatenatedArray = new Uint8Array(array1.length + array2.length)
  concatenatedArray.set(array1)
  concatenatedArray.set(array2, array1.length)
  return concatenatedArray
}
