import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StopService {
  private stops_endpoint = './api/streetcarStops';

  constructor(private http: HttpClient) {}

  getStops(line: string): Observable<string[]> {
    const params = new HttpParams().set('line', line);
    return this.http.get<string[]>(this.stops_endpoint, { params: params });
  }
}
