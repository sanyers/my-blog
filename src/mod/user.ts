import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import { encrypt } from '../utils/crypto'
import { v4 } from 'uuid'
import { TokenItem } from '../types/token'
import { getNowAdd } from '../utils/date'
import { admin_register } from '../env'
import fs from 'fs'
import { authAdmin } from '../auth'

const router = express.Router()
const db = new Database()
const tableName = 'user'
tokenInit()

function tokenSave() {
  const list = [...tokenList.entries()]
  fs.writeFileSync('./data/token.json', JSON.stringify(list))
}

function tokenInit() {
  try {
    const str = fs.readFileSync('./data/token.json').toString()
    const list = JSON.parse(str)
    global.tokenList = new Map(list)
  } catch (e) {
    try {
      fs.mkdirSync('data')
    } catch (e) {}
    global.tokenList = new Map()
  }

  try {
    fs.mkdirSync('temp')
  } catch (e) {}
}

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
    tokenSave()
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
      tokenSave()
    }
  }
  success(res, 'ok')
})

// 注册管理员
router.post('/user/register', async (req, res) => {
  if (admin_register) {
    const userName = req.body.userName
    const userPwd = req.body.userPwd
    const data = { userName, userPwd: encrypt(userPwd) }
    await db.insert(data, tableName)
    success(res, 'ok')
  } else {
    error(res, '当前未开放注册')
  }
})

// 获取登录信息
router.get('/user/info', authAdmin, async (req, res) => {
  const token = req.headers.authorization as string
  const item = tokenList.get(token)
  success(res, item)
})

export default router
