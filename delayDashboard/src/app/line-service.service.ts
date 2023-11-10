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

  /**
   * Obtain a list of streetcar lines from the backend
   * @returns Observable of array of line names
   */
  getLines(): Observable<string[]> {
    return this.http.get<string[]>(this.linesEndpoint);
  }

  /**
   * Obtain an SVG image with a map visualization of the specified streetcar line from the backend
   * @param line
   * @returns Observable of SVG image as string
   */
  getMap(line: string): Observable<string> {
    let params = new HttpParams();
    params = params.set('line', line);

    return this.http.get(this.mapsEndpoint, {
      params: params,
      responseType: 'text',
    });
  }
}
