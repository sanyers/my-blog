import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import { authAdmin } from '../auth'

const router = express.Router()
const db = new Database()
const tableName = 'blog'
const commentTableName = 'comments'

// 根据ID获取博客
router.get('/blog', async (req, res) => {
  const id = req.query.id as string
  const item = await db.find({ _id: db.getObjectId(id) }, tableName)
  if (item) {
    success(res, item)
  } else {
    error(res, 'id is not find')
  }
})

// 搜索博客
router.get('/blog/search', async (req, res) => {
  const name = req.query.name as string
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const start = (pageNum - 1) * pageSize
  const where = {
    $or: [{ name: { $regex: name } }, { content: { $regex: name } }],
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
router.get('/blog/list', async (req, res) => {
  const type1 = req.query.type1 as string
  const type2 = req.query.type2 as string
  const pageNum = Number((req.query.pageNum as string) || '1')
  const pageSize = Number((req.query.pageSize as string) || '10')
  const start = (pageNum - 1) * pageSize
  const where = { type1, type2 }
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
router.get('/blog/last', async (req, res) => {
  const sort = { _id: -1, utime: -1 }
  const list = await db.findLimit({}, tableName, sort, 1, 10)
  success(res, list)
})

// 创建、更新博客
router.post('/blog', authAdmin, async (req, res) => {
  const id = req.body.id as string
  const type1 = req.body.type1 as string
  const type2 = req.body.type2 as string
  const name = req.body.name as string
  const author = (req.body.author as string) || 'sanyer' // 作者
  const authorLink = (req.body.author as string) || 'https://blog.sanyer.top'
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
  if (id) {
    await db.update({ _id: db.getObjectId(id) }, data, tableName)
  } else {
    data.isTop = false
    data.ctime = nowTime
    await db.insert(data, tableName)
  }
  success(res, 'ok')
})

// 查询置顶博客
router.get('/blog/top', async (req, res) => {
  const list = await db.findAll({ isTop: true }, tableName)
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

export default router
