import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { StopService } from '../stop-service.service';
import { DelayService } from '../delay-service.service';
import { LineService } from '../line-service.service';
import {
  IAggregateStopDetails,
  IMetadata,
  IStreetcarDelayAggregate,
} from '../model';
import { MetadataService } from '../metadata.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('vizContainer') schematicViewContainer:
    | ElementRef<HTMLElement>
    | undefined;
  public infoModalVisible = false;

  public line: string = '301';
  public stat: string = 'Count';
  public selectedStop: string | null = null;
  public selectedView: string = 'schematic';

  public lines: string[] = [];
  public stops: string[] = [];
  public helpText: string = '';
  public metadata: IMetadata | null = null;
  public colorMap: Map<string, string> = new Map();

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
    private lineService: LineService,
    private metadataService: MetadataService,
    private changeRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshData();
    this.metadataService.getMetadata().subscribe((md) => (this.metadata = md));
  }

  ngAfterViewInit(): void {
    this.vizWidth = this.getVizWidth();
  }

  /**
   * Fetches and processes all data from the backend needed for rendereing the dashboard
   */
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
        this.colorMap = this.makeColorMap();
      });
    this.selectedStop = null;
  }

  /**
   * Obtain desired width of visualisation container
   * @returns width in pixels
   */
  getVizWidth(): number {
    return this.schematicViewContainer
      ? this.schematicViewContainer.nativeElement.getBoundingClientRect().width
      : 0;
  }

  /**
   * Triggers when the streetcar line is changed in the visualization and refreshes data
   * @param event
   */
  changeLine(event: Event): void {
    this.line = (event.target as HTMLInputElement).value;
    this.refreshData();
  }

  /**
   * Triggers when the displayed statistics is changed in the dashboard and recalculates
   * visualization
   * @param event
   */
  changeStat(event: Event): void {
    this.stat = (event.target as HTMLInputElement).value;
    this.calculateBarLengths();
    this.colorMap = this.makeColorMap();
  }
  /**
   * Triggers when view is changed between summay and map view
   * @param event
   */
  changeView(event: Event): void {
    this.selectedView = (event.target as HTMLInputElement).value;
  }

  /**
   * Calculate lengths of viz bars summary view
   */
  calculateBarLengths(): void {
    const max_absolute_length = Math.max(
      ...this.delayAggregates.map((aggregate) => {
        if (this.stat == 'Total Minutes') {
          return aggregate.totalDelay;
        } else if (this.stat == 'Count') {
          return aggregate.totalCount;
        } else {
          return aggregate.totalDelay / aggregate.totalCount;
        }
      })
    );

    this.barLengths = this.delayAggregates.map((aggregate) => {
      if (this.stat == 'Total Minutes') {
        return {
          closestStopBefore: aggregate.closestStopBefore,
          length: aggregate.totalDelay / max_absolute_length,
        };
      } else if (this.stat == 'Count') {
        return {
          closestStopBefore: aggregate.closestStopBefore,
          length: aggregate.totalCount / max_absolute_length,
        };
      } else {
        return {
          closestStopBefore: aggregate.closestStopBefore,
          length:
            aggregate.totalDelay / aggregate.totalCount / max_absolute_length,
        };
      }
    });
  }

  /**
   * Extract chosen statistic from list of delay aggregate information, for delay incidents
   * occuring between the specified stop and its successor
   * @param stop specifies the stop for which the stat is to be retrieved
   * @returns
   */
  getStat(stop: string): number {
    const match = this.delayAggregates.find(
      (l) => l.closestStopBefore === stop
    );
    if (!match) {
      return 0;
    }
    if (this.stat == 'Total Minutes') {
      return match.totalDelay;
    } else if (this.stat == 'Count') {
      return match.totalCount;
    } else {
      return +(match.totalDelay / match.totalCount).toFixed(1);
    }
  }

  /**
   * Make hsl color descriptor for given percentage; see https://stackoverflow.com/a/17268489 for
   * source of inspiration
   * @param ratio percentage between 0 and 1
   * @returns hsl color descriptor
   */
  private getBarColor(ratio: number): string {
    const lightness = (90 - 50 * ratio).toString(10);
    return `hsl(0,100%,${lightness}%)`;
  }

  /**
   * Packages up color information for viz bars
   * @returns map stop -> color
   */
  private makeColorMap(): Map<string, string> {
    return this.stops.reduce((agg, curr) => {
      const match = this.barLengths.find((l) => l.closestStopBefore === curr);
      const relative_width = match ? match.length : 0;
      agg.set(curr, this.getBarColor(relative_width));
      return agg;
    }, new Map<string, string>());
  }

  /**
   * Make CSS style for viz bars for specified stop
   * @param stop stop name
   * @returns object representing the CSS style
   */
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

  /**
   * Select stop event handler
   * @param stop
   * @returns
   */
  selectStop(stop: string | null | undefined) {
    if (stop === null || stop === undefined) {
      this.selectedStop = null;
      this.selectedStopData = null;
      return;
    }

    this.selectedStop = stop;
    if (stop) {
      this.delayService
        .getDelayAggregateDetails(this.line, stop, this.filterForm.value)
        .subscribe((details) => (this.selectedStopData = details));
    } else {
      this.selectedStopData = null;
    }
  }

  showInfoModal() {
    this.infoModalVisible = false;
    this.changeRef.detectChanges();
    this.infoModalVisible = true;
  }
}
