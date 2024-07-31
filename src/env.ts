import dotenv from 'dotenv'
dotenv.config()

export const server_port = process.env.server_port
export const mongodb_conf = {
  base: process.env.mongodb_base,
  port: process.env.mongodb_port,
  user: process.env.mongodb_user,
  pwd: process.env.mongodb_pwd,
  db: process.env.mongodb_db,
}

export const comment_verify =
  process.env.comment_verify === 'true' ? true : false
