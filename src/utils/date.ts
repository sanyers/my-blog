export const setTime = (v: number) => new Date(v * 1000).toLocaleString()
export const getTime = () => parseInt((new Date().getTime() / 1000).toString())
export const getDateTime = () => new Date().toLocaleString()
export const getNowAdd = (n: number, type: string, time?: Date) => {
  const now = time || new Date()
  switch (type) {
    case 'minutes':
      now.setMinutes(now.getMinutes() + n)
      break
    case 'hours':
      now.setHours(now.getHours() + n)
      break
    case 'date':
      now.setDate(now.getDate() + n)
      break
    case 'month':
      now.setMonth(now.getMonth() + n)
      break
    case 'year':
      now.setFullYear(now.getFullYear() + n)
      break
    default:
      break
  }
  return now.getTime()
}
