import { Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DelayServiceService {

  private delays_endpoint = '/streetcarDelays/'

  constructor(private http: HttpClient) { }

  getDelays(line: string): Observable<string> {
    const params = new HttpParams().set('line', line)
    return this.http.get<string>(`${this.delays_endpoint}${line}`)
  }
}
