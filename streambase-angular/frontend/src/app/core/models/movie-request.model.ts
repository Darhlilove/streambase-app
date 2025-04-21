export interface MovieRequest {
  id?: string
  movieTitle: string
  year: string
  mediaType: "movie" | "tv"
  senderId: string
  status: "pending" | "approved" | "declined"
  createdAt: string
  updatedAt: string
  reason?: string
}