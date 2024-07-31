import { Request, Response } from 'express'
import { error } from './res-code'

/**
 * 验证管理员
 */
export const authAdmin = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization as string
  const item = tokenList.get(token)
  if (item) {
    const nowTime = new Date().getTime()
    if (item.lastTime > nowTime) {
      next()
    } else {
      res.status(401)
      error(res, '登录已过期')
    }
  } else {
    res.status(401)
    error(res, '权限认证失败')
  }
}
