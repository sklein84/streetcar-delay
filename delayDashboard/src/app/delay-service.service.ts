import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IDelayFilterParameters, IStreetcarDelayAggregate } from './model';

@Injectable({
  providedIn: 'root',
})
export class DelayService {
  private delays_endpoint = '/api/streetcarDelays';

  constructor(private http: HttpClient) {}

  getDelayAggregate(
    line: string,
    filterParameters?: IDelayFilterParameters
  ): Observable<IStreetcarDelayAggregate[]> {
    let params = new HttpParams();
    if (filterParameters) {
      if (filterParameters.dateFrom) {
        params = params.set('dateFrom', filterParameters.dateFrom);
      }
      if (filterParameters.dateUntil) {
        params = params.set('dateUntil', filterParameters.dateUntil);
      }
      if (filterParameters.timeFrom) {
        params = params.set('timeFrom', filterParameters.timeFrom);
      }
      if (filterParameters.timeUntil) {
        params = params.set('timeUntil', filterParameters.timeUntil);
      }
    }

    return this.http.get<IStreetcarDelayAggregate[]>(
      `${this.delays_endpoint}/${line}/aggregate`,
      { params: params }
    );
  }
}
