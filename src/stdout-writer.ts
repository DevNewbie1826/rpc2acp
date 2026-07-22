/**
 * Safe stdout writer that resolves even when stdout is destroyed or closed.
 * Used by the ACP stdio transport to avoid crashing when the client disconnects.
 */
export function createStdoutWriter(): WritableStream<Uint8Array> {
  return new WritableStream<Uint8Array>({
    write(chunk) {
      return new Promise<void>(resolve => {
        if ((process.stdout as any).destroyed || !process.stdout.writable) return resolve()

        try {
          process.stdout.write(chunk, err => {
            void err
            resolve()
          })
        } catch {
          resolve()
        }
      })
    }
  })
}
