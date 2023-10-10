import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IMetadata } from './model';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private metadataEndpoint = './api/metadata'

  constructor(private http: HttpClient) { }

  getMetadata(): Observable<IMetadata> {
    return this.http.get<IMetadata>(this.metadataEndpoint)
  }
}
