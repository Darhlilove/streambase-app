import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http"
import type { Observable } from "rxjs"
import { environment } from "../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private tmdbBaseUrl = "https://api.themoviedb.org/3"
  private tmdbOptions = {
    headers: new HttpHeaders({
      Authorization: `Bearer ${environment.TMDB_API_KEY}`,
      "Content-Type": "application/json",
    }),
  }

  constructor(private http: HttpClient) {}

  // Generic HTTP methods
  get<T>(endpoint: string, baseUrl = environment.API_URL): Observable<T> {
    return this.http.get<T>(`${baseUrl}${'/api' + endpoint}`)
  }

  post<T>(endpoint: string, data: any, baseUrl = environment.API_URL): Observable<T> {
    return this.http.post<T>(`${baseUrl}${'/api' + endpoint}`, data)
  }

  put<T>(endpoint: string, data: any, baseUrl = environment.API_URL): Observable<T> {
    return this.http.put<T>(`${baseUrl}${'/api' + endpoint}`, data)
  }

  patch<T>(endpoint: string, data: any, baseUrl = environment.API_URL): Observable<T> {
    return this.http.patch<T>(`${baseUrl}${'/api' + endpoint}`, data)
  }

  delete<T>(endpoint: string, baseUrl = environment.API_URL): Observable<T> {
    return this.http.delete<T>(`${baseUrl}${'/api' + endpoint}`)
  }

  // TMDB specific methods
  getTMDB<T>(endpoint: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.tmdbBaseUrl}${endpoint}`, {
      ...this.tmdbOptions,
      params,
    })
  }

  postTMDB<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.tmdbBaseUrl}${endpoint}`, data, this.tmdbOptions)
  }
}

