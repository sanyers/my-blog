import { TokenItem } from './token'

declare global {
  var tokenList: Map<string, TokenItem>
}

export {}
