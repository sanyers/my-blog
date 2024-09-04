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

/**
 * 验证是否登录
 */
export const auth = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization as string
  const item = tokenList.get(token)
  req.headers['_userName'] = ''
  if (item) {
    const nowTime = new Date().getTime()
    if (item.lastTime > nowTime) {
      req.headers['_userName'] = item.userName
    }
  }
  next()
}
