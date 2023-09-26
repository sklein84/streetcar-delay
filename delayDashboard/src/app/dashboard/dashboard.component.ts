import { Component, OnInit } from '@angular/core';
import { StopService } from '../stop-service.service';
import { DelayService } from '../delay-service.service';
import { IAggregateStopDetails, IStreetcarDelayAggregate } from '../model';
import { LineService } from '../line-service.service';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  public line: string = '301';
  public stat: string = 'Count';
  public lines: string[] = [];
  public stops: string[] = [];
  public selectedStop: string | null = null;
  public selectedStopData: IAggregateStopDetails | null = null;
  public delayAggregates: IStreetcarDelayAggregate[] = [];
  public barLengths: { closestStopBefore: string; length: number }[] = [];
  private vizWidth: number = 0;
  filterForm = new FormGroup({
    dateFrom: new FormControl(undefined),
    dateUntil: new FormControl(undefined),
    timeFrom: new FormControl(undefined),
    timeUntil: new FormControl(undefined),
  });

  constructor(
    private stopService: StopService,
    private delayService: DelayService,
    private lineService: LineService
  ) {}

  ngOnInit(): void {
    this.refreshData();
    let vizContainer = document.getElementById('vizContainer');
    this.vizWidth = vizContainer
      ? vizContainer.getBoundingClientRect().width
      : 0;
  }

  refreshData(): void {
    this.lineService.getLines().subscribe((lines) => (this.lines = lines));
    this.stopService
      .getStops(this.line)
      .subscribe((stops) => (this.stops = stops));
    this.delayService
      .getDelayAggregate(this.line, this.filterForm.value)
      .subscribe((delayAggs) => {
        this.delayAggregates = delayAggs;
        this.calculateBarLengths();
      });
    this.selectedStop = null;
  }

  changeLine(event: Event): void {
    this.line = (event.target as HTMLInputElement).value;
    this.refreshData();
  }

  changeStat(event: Event): void {
    this.stat = (event.target as HTMLInputElement).value;
    this.calculateBarLengths();
  }

  calculateBarLengths(): void {
    const max_absolute_length = Math.max(
      ...this.delayAggregates.map((aggregate) => {
        if (this.stat == 'Total Minutes') {
          return aggregate.totalDelay;
        } else {
          return aggregate.totalCount;
        }
      })
    );

    this.barLengths = this.delayAggregates.map((aggregate) => {
      if (this.stat == 'Total Minutes') {
        return {
          closestStopBefore: aggregate.closestStopBefore,
          length: aggregate.totalDelay / max_absolute_length,
        };
      } else {
        return {
          closestStopBefore: aggregate.closestStopBefore,
          length: aggregate.totalCount / max_absolute_length,
        };
      }
    });
  }

  getStat(stop: string): number {
    const match = this.delayAggregates.find(
      (l) => l.closestStopBefore === stop
    );
    if (!match) {
      return 0;
    }
    return this.stat === 'Total Minutes' ? match.totalDelay : match.totalCount;
  }

  private getBarColor(ratio: number): string {
    /**
     * See https://stackoverflow.com/a/17268489 for source of inspiration
     */
    const lightness = (90 - 50 * ratio).toString(10);
    return `hsl(0,100%,${lightness}%)`;
  }

  getBarStyle(stop: string): { [klass: string]: any } {
    const match = this.barLengths.find((l) => l.closestStopBefore === stop);
    const relative_width = match ? match.length : 0;

    return {
      width: `${relative_width * this.vizWidth}px`,
      background: this.getBarColor(relative_width),
      'line-height': '50px',
      'padding-left': '5px',
      'white-space': 'nowrap',
    };
  }

  selectStop(stop: string | null) {
    this.selectedStop = stop;
    if (stop) {
      this.delayService
        .getDelayAggregateDetails(this.line, stop, this.filterForm.value)
        .subscribe((details) => (this.selectedStopData = details));
    } else {
      this.selectedStopData = null;
    }
  }
}