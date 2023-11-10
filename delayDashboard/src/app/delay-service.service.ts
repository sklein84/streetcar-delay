import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IAggregateStopDetails,
  IDelayFilterParameters,
  IStreetcarDelayAggregate,
} from './model';

@Injectable({
  providedIn: 'root',
})
export class DelayService {
  private delays_endpoint = './api/streetcarDelays';

  constructor(private http: HttpClient) {}

  /**
   * Takes filter parameters and uses the to construct corresponding HttpParams
   * @param filterParameters filter parameters object
   * @returns HttpParams object
   */
  private getFilterParams(
    filterParameters: IDelayFilterParameters
  ): HttpParams {
    let params = new HttpParams();
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

    return params;
  }

  /**
   * Get aggregate delay statistics for a specified streetcar line and filter parameters from the
   * backend
   * @param line streetcar line for which the statistics are to be obtained
   * @param filterParameters filters that should be applied before aggregating
   * @returns array of aggregate delay stats
   */
  getDelayAggregate(
    line: string,
    filterParameters?: IDelayFilterParameters
  ): Observable<IStreetcarDelayAggregate[]> {
    const params = filterParameters
      ? this.getFilterParams(filterParameters)
      : new HttpParams();

    return this.http.get<IStreetcarDelayAggregate[]>(
      `${this.delays_endpoint}/${line}/aggregate`,
      { params: params }
    );
  }

  /**
   * Obtains from the backend aggregate details for delay incidents of a specified streetcar line
   * between a specified stop and its successor, applying possible filter criteria
   * @param line streetcar line
   * @param closestStopBefore streetcar stop before the corresponding delay incidents
   * @param filterParameters  filters that should be applied before aggregating
   * @returns Observable of detail information object
   */
  getDelayAggregateDetails(
    line: string,
    closestStopBefore: string,
    filterParameters?: IDelayFilterParameters
  ): Observable<IAggregateStopDetails> {
    const params = filterParameters
      ? this.getFilterParams(filterParameters)
      : new HttpParams();

    return this.http.get<IAggregateStopDetails>(
      `${this.delays_endpoint}/${line}/aggregate/${encodeURIComponent(
        closestStopBefore
      )}`,
      { params: params }
    );
  }
}
