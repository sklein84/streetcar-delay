import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  private helpEndpoint = './api/help';

  constructor(private http: HttpClient) {}

  getHelp(): Observable<string> {
    return this.http.get<string>(this.helpEndpoint);
  }
}
