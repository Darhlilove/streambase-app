import type { User } from "./user.model"

export interface Reply {
  replyId: string
  replyText: string
  replyUser: Partial<User>
  replyDate: string
  createdAt?: string
  updatedAt?: string
  flagged?: boolean
}

export interface Review {
  id: string
  movieId: string
  movieMediaType: string
  text: string
  user: Partial<User>
  rating: number
  replies: Reply[]
  createdAt: string
  updatedAt: string
  flagged?: boolean
}

