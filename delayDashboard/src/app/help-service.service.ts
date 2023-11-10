import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  private helpEndpoint = './api/help';

  constructor(private http: HttpClient) {}

  /**
   * Obtains from backend an information text about the application in markdown format
   * @returns Observable of application info as string
   */
  getHelp(): Observable<string> {
    return this.http.get<string>(this.helpEndpoint);
  }
}
