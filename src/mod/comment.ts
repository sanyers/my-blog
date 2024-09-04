import express from 'express'
import { success, error } from '../res-code'
import { Database } from '../db'
import fs from 'fs'
import { auth, authAdmin } from '../auth'
import { comment_verify } from '../env'

const router = express.Router()
const db = new Database()
const tableName = 'comments'

// 查询博客评论
router.get('/comment', auth, async (req, res) => {
  const userName = req.headers['_userName']
  const blogId = req.query.blogId
  const item = await db.find({ blogId }, tableName)
  if (item) {
    if (userName) {
      success(res, item.comments)
    } else {
      const list = item.comments.filter((i: any) => i.isShow)
      success(res, list)
    }
  } else {
    success(res, [])
  }
})

// 博客评论
router.post('/comment', auth, async (req, res) => {
  const blogId = req.body.blogId
  const desc = req.body.desc
  const userName = req.body.userName
  const email = req.body.email
  const quoteId = req.body.quoteId // 引用楼层
  const item = await db.find({ blogId }, tableName)
  const nowTime = new Date().getTime()
  const userNames = req.headers['_userName']

  if (!userName) {
    return error(res, 'userName is null')
  }

  const commentItem: any = {
    desc,
    ctime: nowTime,
    userName,
    isShow: !comment_verify,
    isAuthor: false,
  }
  if (email) {
    commentItem.email = email
  }

  if (userNames) {
    commentItem.isAuthor = true
  }

  if (item) {
    if (quoteId) {
      commentItem.quoteId = quoteId
    }
    commentItem.id =
      item.comments.length > 0
        ? item.comments[item.comments.length - 1].id + 1
        : 1
    await db.updates(
      { blogId },
      { $push: { comments: commentItem } },
      tableName,
    )
  } else {
    commentItem.id = 1
    const data = {
      blogId,
      comments: [commentItem],
    }
    await db.insert(data, tableName)
  }
  success(res, 'ok')
})

// 审核评论
router.post('/comment/verify', authAdmin, async (req, res) => {
  const blogId = req.body.blogId
  const commentId = req.body.commentId
  const isShow = req.body.isShow
  await db.update(
    { blogId, 'comments.id': commentId },
    { 'comments.$.isShow': isShow },
    tableName,
  )
  success(res, 'ok')
})

// 删除评论
router.post('/comment/delete', authAdmin, async (req, res) => {
  const blogId = req.body.blogId
  const commentId = req.body.commentId
  await db.updates(
    { blogId },
    { $pull: { comments: { id: commentId } } },
    tableName,
  )
  success(res, 'ok')
})

export default router
