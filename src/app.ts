import express, { NextFunction, Request, Response } from 'express' //web框架
import { server_port, api_prefix } from './env'
import modList from './mod'
import { consoleTime } from './utils/console'

const app = express()
app.use(express.json({ limit: '50mb' })) // 解析 application/json 参数
app.use(express.urlencoded({ limit: '50mb', extended: true })) // 解析 www-form-urlencoded 参数
app.use('/imgs', express.static('web')) // 开放web文件夹目录

// 加载模块
modList.forEach(element => {
  app.use('/' + api_prefix, element)
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  consoleTime.log('myblog：' + req.url)
  const str = `status: 500\nmessage: ${err.stack}`
  consoleTime.log(str)
  res.status(500).send({
    code: -1,
    msg: '程序运行错误',
  })
})

//启动应用程序
app.listen(server_port, function () {
  consoleTime.log('myblog listening on ' + server_port)
})

process.on('uncaughtException', function (err) {
  const str = `caughtException: ${err.stack}`
  consoleTime.log(str)
})
