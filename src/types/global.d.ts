import { CommentItem, TokenItem } from './token'

declare global {
  var tokenList: Map<string, TokenItem>
  var lastComment: CommentItem[]
}

export {}
