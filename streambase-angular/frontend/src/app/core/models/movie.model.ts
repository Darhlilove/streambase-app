export interface MovieReference {
  id: string | number
  title: string
  media_type: string
}

export interface TVSeasons{
  "air_date": string,
  "episode_count": number,
  "id": number,
  "name": string,
  "overview": string,
  "poster_path": string,
  "season_number": number,
  "vote_average": number
}

export interface Movie {
  id: string | number
  title?: string
  name?: string
  media_type?: 'movie' | 'tv' | 'person'
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  first_air_date?: string
  overview?: string
  vote_average?: number
  vote_count?: number
  popularity?: number
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  poster?: string
  backdrop?: string
  released?: string
  createdAt?: string
  updatedAt?: string
  tagline?: string,
  status?: string,
  credits?: string,
  runtime?: number,
  original_language?: string,
  budget?: number,
  seasons?: TVSeasons[],
  number_of_seasons?: number,
  number_of_episodes?: number,
  known_for_department?: string,
  known_for?: string,
  adult?: boolean
}

export interface Cast{
    "adult": boolean,
    "gender": number,
    "id": number,
    "known_for_department": string,
    "name": string,
    "original_name": string,
    "popularity": number,
    "profile_path": string,
    "cast_id"?: number,
    "character": string,
    "credit_id": string,
    "order": number
}
