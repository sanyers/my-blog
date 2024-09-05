import { TokenItem } from './token'

declare global {
  var tokenList: Map<string, TokenItem>
  namespace Express {
    export interface Request {
      files?: any
    }
  }
}

export {}
