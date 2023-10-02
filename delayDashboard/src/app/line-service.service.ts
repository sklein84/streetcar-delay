import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LineService {

  private lines_endpoint = './api/streetcarLines'

  constructor(private http: HttpClient) { }

  getLines(): Observable<string[]> {
    return this.http.get<string[]>(this.lines_endpoint)
  }
}
