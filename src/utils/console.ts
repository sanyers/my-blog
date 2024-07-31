export const consoleTime = {
  log: (str: string) => {
    const time = new Date()
    console.log(`${time.toLocaleString()}：${str}`)
  },
  error: (err: string) => {
    const time = new Date()
    console.log(`${time.toLocaleString()}：${err}`)
  },
}
