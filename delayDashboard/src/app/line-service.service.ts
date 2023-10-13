import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LineService {
  private linesEndpoint = './api/streetcarLines';
  private mapsEndpoint = './api/maps';

  constructor(private http: HttpClient) {}

  getLines(): Observable<string[]> {
    return this.http.get<string[]>(this.linesEndpoint);
  }

  getMap(line: string): Observable<string> {
    let params = new HttpParams();
    params = params.set('line', line);

    return this.http.get(this.mapsEndpoint, {
      params: params,
      responseType: 'text',
    });
  }
}
