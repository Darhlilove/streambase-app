import type { MovieReference } from "./movie.model"

export interface User {
  id: string
  firstName: string,
  lastName: string,
  email: string,
  dateOfBirth?: string,
  password?: string
  image?: string | null,
  bio?: string,
  moviePreferences?: number[]
  favorites?: MovieReference[]
  watchlist?: MovieReference[]
  watchedList?: MovieReference[]
  following?: string[]
  followers?: string[]
  suspended?: boolean
  privilege?: string | null,
  name?: string
  pin?: string
}

export interface Admin {
  id: string
  name: string
  email: string
  password?: string
  image?: string | null
  suspended?: boolean
  privilege?: number | null
}

