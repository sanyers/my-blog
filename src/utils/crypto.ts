import crypto from 'crypto'

export const encrypt = (str: string, method?: string) => {
  const md5 = crypto.createHash(method || 'sha256')
  return md5.update(str).digest('hex')
}
