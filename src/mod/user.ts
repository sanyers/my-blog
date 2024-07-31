import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import { encrypt } from '../utils/crypto'
import { v4 } from 'uuid'
import { TokenItem } from '../types/token'
import { getNowAdd } from '../utils/date'

const router = express.Router()
const db = new Database()
const tableName = 'user'

// 管理员登录
router.post('/user/login', async (req, res) => {
  const userName = req.body.userName
  const userPwd = req.body.userPwd

  if (!userName || !userPwd) {
    error(res, 'userName or userPwd is null')
    return
  }

  const item = await db.find({ userName, userPwd: encrypt(userPwd) }, tableName)
  if (item) {
    const token = v4()
    const data: TokenItem = {
      userName,
      token,
      lastTime: getNowAdd(1, 'month'),
    }
    tokenList.set(token, data)
    success(res, data)
  } else {
    error(res, '登录失败，用户名或密码错误')
  }
})

// 管理员退出
router.post('/user/logout', async (req, res) => {
  const token = req.headers.authorization
  if (token) {
    const item = tokenList.get(token)
    if (item) {
      tokenList.delete(token)
    }
  }
  success(res, 'ok')
})

export default router
