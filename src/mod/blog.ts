import express from 'express'
import multipart from 'connect-multiparty'
import { success, error } from '../res-code'
import { Database } from '../db'
import { authAdmin, auth } from '../auth'
import fs from 'fs'
import { v4 } from 'uuid'
import { user } from '../env'

const router = express.Router()
const mp = multipart({ uploadDir: './temp' })
const db = new Database()
const tableName = 'blog'
const commentTableName = 'comments'

// 根据ID获取博客
router.get('/blog', auth, async (req, res) => {
  const userName = req.headers['_userName']
  const id = req.query.id as string
  const where: any = { _id: db.getObjectId(id) }
  if (!userName) {
    where.release = true
  }
  const item = await db.find({ _id: db.getObjectId(id) }, tableName)
  if (item) {
    success(res, item)
  } else {
    error(res, 'id is not find')
  }
})

// 搜索博客
router.get('/blog/search', auth, async (req, res) => {
  const userName = req.headers['_userName']
  const name = req.query.name as string
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const start = (pageNum - 1) * pageSize
  const where: any = {
    $or: [
      { name: { $regex: name } },
      { content: { $regex: name } },
      { desc: { $regex: name } },
    ],
  }
  if (!userName) {
    where.release = true
  }
  const sort = { _id: -1, utime: -1 }
  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  const itemCount = await db.findCount(where, tableName)
  const pageCount = Math.ceil(itemCount / pageSize)
  const data = {
    list,
    itemCount,
    pageCount,
  }
  success(res, data)
})

// 按类别查询博客列表
router.get('/blog/list', auth, async (req, res) => {
  const userName = req.headers['_userName']
  const type1 = req.query.type1 as string
  const type2 = req.query.type2 as string
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const start = (pageNum - 1) * pageSize
  const where: any = { type1, type2 }
  if (!userName) {
    where.release = true
  }
  const sort = { _id: -1, utime: -1 }
  const list = await db.findLimit(where, tableName, sort, start, pageSize)
  const itemCount = await db.findCount(where, tableName)
  const pageCount = Math.ceil(itemCount / pageSize)
  const data = {
    list,
    itemCount,
    pageCount,
  }
  success(res, data)
})

// 最近更新列表
router.post('/blog/last', auth, async (req, res) => {
  const userName = req.headers['_userName']
  const sort = { utime: -1 }
  const where: any = {}
  if (!userName) {
    where.release = true
  }
  const list = await db.findLimit(where, tableName, sort, 0, 10)
  success(res, list)
})

// 创建、更新博客
router.post('/blog', authAdmin, async (req, res) => {
  let id = req.body.id as string
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  const name = req.body.name as string
  const desc = req.body.desc as string // 描述
  const author = (req.body.author as string) || user.author // 作者
  const authorLink = (req.body.author as string) || user.authorLink
  const content = req.body.content as string

  const nowTime = new Date().getTime()
  const data: any = { content, utime: nowTime }
  if (type1) {
    data.type1 = type1
    data.type2 = type2
  }
  if (name) {
    data.name = name
  }
  if (author) {
    data.author = author
    data.authorLink = authorLink
  }
  if (desc) {
    data.desc = desc
  }
  if (id) {
    await db.update({ _id: db.getObjectId(id) }, data, tableName)
  } else {
    data.isTop = false
    data.ctime = nowTime
    data.release = false
    const d = await db.insert(data, tableName)
    id = d.insertedId.toString()
  }
  success(res, id)
})

// 查询置顶博客
router.post('/blog/top', auth, async (req, res) => {
  const userName = req.headers['_userName']
  const where: any = { isTop: true }
  if (!userName) {
    where.release = true
  }
  const list = await db.findAll(where, tableName)
  success(res, list)
})

// 置顶、取消置顶博客
router.post('/blog/top', authAdmin, async (req, res) => {
  const id = req.body.id as string
  const isTop = req.body.isTop as string
  await db.update({ _id: db.getObjectId(id) }, { isTop }, tableName)
  success(res, 'ok')
})

// 删除博客
router.post('/blog/delete', authAdmin, async (req, res) => {
  const id = req.body.id as string
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  if (id) {
    const where = { _id: db.getObjectId(id) }
    await db.delete(where, tableName)
    await db.delete({ blogId: id }, commentTableName)
  }
  if (type1 && type2) {
    const where = { type1, type2 }
    const list = await db.findAll(where, tableName)
    await db.deleteAll(where, tableName)
    const blogId = list.map(i => i._id)
    await db.deleteAll({ blogId: { $in: blogId } }, commentTableName)
  }
  success(res, 'ok')
})

// 发布与取消发布
router.post('/blog/release', authAdmin, async (req, res) => {
  const id = req.body.id as string
  const release = req.body.release as boolean
  await db.update({ _id: db.getObjectId(id) }, { release }, tableName)
  success(res, 'ok')
})

// 上传博客图片
router.post('/blog/file', authAdmin, mp, async (req, res) => {
  const id = req.body.id as string
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  const { file } = req.files
  const newPath1 = `./web/${type1}`
  try {
    fs.mkdirSync(newPath1)
  } catch (e) {}
  const newPath2 = `${newPath1}/${type2}`
  try {
    fs.mkdirSync(newPath2)
  } catch (e) {}
  const newPath3 = `${newPath2}/${id}`
  try {
    fs.mkdirSync(newPath3)
  } catch (e) {}

  const list: Array<string> = []
  file.forEach((item: any) => {
    const fileName = v4() + '.' + item.name.split('.')[1]
    const newPath = `${newPath3}/${fileName}`
    fs.renameSync(item.path, newPath)
    const url = `/imgs/${type1}/${type2}/${id}/${fileName}`
    list.push(url)
  })
  success(res, list)
})

export default router
