export interface IStreetcarDelayAggregate {
  closestStopBefore: string;
  closestStopAfter: string;
  totalCount: number;
  totalDelay: number;
}

export interface IDelayFilterParameters {
  dateFrom?: number | null;
  dateUntil?: number | null;
  timeFrom?: number | null;
  timeUntil?: number | null;
}
