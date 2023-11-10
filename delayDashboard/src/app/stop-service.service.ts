import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StopService {
  private stops_endpoint = './api/streetcarStops';

  constructor(private http: HttpClient) {}

  /**
   *
   * @param line Obtains from backend a list of stops for the specified streetcar line
   * @returns Observable of array of stop names
   */
  getStops(line: string): Observable<string[]> {
    const params = new HttpParams().set('line', line);
    return this.http.get<string[]>(this.stops_endpoint, { params: params });
  }
}
