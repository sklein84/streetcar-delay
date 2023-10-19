import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LineService } from '../line-service.service';

@Component({
  selector: 'line-map',
  templateUrl: './line-map.component.html',
  styleUrls: ['./line-map.component.css'],
})
export class LineMapComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) line: string = '';
  @Input() stat: string = '';
  @Input() colorMap: Map<string, string> = new Map();

  svgMap: SafeHtml = '';
  sourceViewBox: string = '';

  selectedLine: HTMLElement | null = null;
  @Output() selectedLineEmitter = new EventEmitter<HTMLElement | null>();

  hoveringStop: string = '';
  hoveringStopLeft: string = 'auto';
  hoveringStopTop: string = 'auto';

  stopListenerDeleters: (() => void)[] = [];
  panningListenerDeleters: (() => void)[] = [];

  mouseDownData: {
    position: { x: number; y: number };
    viewBox: [number, number, number, number];
  } | null = null;
  panningViewBox: [number, number, number, number] | null = null;

  constructor(
    private lineService: LineService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['line']) {
      this.hoveringStop = '';
      this.lineService.getMap(this.line).subscribe((map) => {
        this.svgMap = this.sanitizer.bypassSecurityTrustHtml(map);
        setTimeout(() => {
          this.sourceViewBox =
            this.document
              .querySelector('svg#lineMap')
              ?.getAttribute('viewBox') || '';
          this.setUpStopListeners();
          this.setUpPanningListeners();
          this.styleLines();
        }, 50);
      });
    }
    if (changes['stat']) {
      this.styleLines();
    }
  }

  ngOnDestroy(): void {
    this.cleanUpStopListeners();
    this.cleanUpPanningListeners();
  }

  private cleanUpStopListeners(): void {
    this.stopListenerDeleters.forEach((f) => f());
    this.stopListenerDeleters = [];
  }

  private cleanUpPanningListeners(): void {
    this.panningListenerDeleters.forEach((f) => f());
    this.panningListenerDeleters = [];
  }

  private setUpStopListeners(): void {
    this.cleanUpStopListeners();

    const circleElements = this.document.querySelectorAll('circle');
    circleElements.forEach((circle) => {
      this.stopListenerDeleters.push(
        this.renderer.listen(circle, 'mouseenter', () => {
          this.hoveringStop = circle.id.slice(5);
          const boundingRect = circle.getBoundingClientRect();
          this.hoveringStopLeft = `${boundingRect.left + 15}px`;
          this.hoveringStopTop = `${boundingRect.top + 15}px`;
        })
      );
      this.stopListenerDeleters.push(
        this.renderer.listen(circle, 'mouseleave', () => {
          this.hoveringStop = '';
        })
      );
    });
  }

  private setUpPanningListeners() {
    this.cleanUpPanningListeners();
    const svg = this.document.querySelector('svg#lineMap');
    this.panningListenerDeleters.push(
      this.renderer.listen(svg, 'pointerdown', (event) => {
        const viewBoxCoords = svg
          ?.getAttribute('viewBox')
          ?.split(' ')
          .map((x) => Number(x))
          .slice(0, 4) as [number, number, number, number];
        this.mouseDownData = {
          position: { x: event.clientX, y: event.clientY },
          viewBox: viewBoxCoords || [0, 0, 0, 0],
        };
      })
    );
    this.panningListenerDeleters.push(
      this.renderer.listen(svg, 'pointerup', () => {
        this.mouseDownData = null;
      })
    );
    this.panningListenerDeleters.push(
      this.renderer.listen(svg, 'pointerleave', () => {
        this.mouseDownData = null;
      })
    );
    this.panningListenerDeleters.push(
      this.renderer.listen(svg, 'pointermove', (event) => {
        if (this.mouseDownData === null) {
          return;
        }
        const deltaX = this.mouseDownData.position.x - event.clientX;
        const deltaY = this.mouseDownData.position.y - event.clientY;

        svg?.setAttribute(
          'viewBox',
          `${this.mouseDownData.viewBox[0] + deltaX} ${
            this.mouseDownData.viewBox[1] + deltaY
          } ${this.mouseDownData.viewBox[2] + deltaX} ${
            this.mouseDownData.viewBox[3] + deltaY
          }`
        );
      })
    );
  }

  private resetSelectedLineStyle() {
    if (this.selectedLine !== null) {
      this.selectedLine.style.stroke =
        this.colorMap.get(this.selectedLine.id.slice(5)) || 'red';
      this.selectedLine.style.strokeWidth = '0.4%';
    }
  }

  clickMap(event: MouseEvent) {
    const currentTarget = event.target as HTMLElement;
    if (currentTarget.tagName === 'svg') {
      this.resetSelectedLineStyle();
      this.selectedLineEmitter.emit(null);
    }
    if (currentTarget.tagName !== 'line') {
      return;
    }
    this.resetSelectedLineStyle();

    this.selectedLine = currentTarget;
    this.selectedLine.style.stroke = 'black';

    this.selectedLineEmitter.emit(this.selectedLine);
  }

  styleLines(colorMap?: Map<string, string>) {
    let cMap: Map<string, string>;
    if (!colorMap) {
      cMap = this.colorMap;
    } else {
      cMap = colorMap;
    }

    const lineElements = this.document.querySelectorAll('line');
    lineElements.forEach((line) => {
      line.style.stroke = cMap.get(line.id.slice(5)) || 'red';
    });
  }

  zoom(factor: number): void {
    const svg = this.document.querySelector('svg#lineMap');
    const viewBoxCoords = svg
      ?.getAttribute('viewBox')
      ?.split(' ')
      .map((x) => Number(x));
    if (viewBoxCoords) {
      svg?.setAttribute(
        'viewBox',
        viewBoxCoords?.map((x) => x * factor).join(' ')
      );
    }
  }

  resetZoom(): void {
    const svg = this.document.querySelector('svg#lineMap');
    svg?.setAttribute('viewBox', this.sourceViewBox);
  }
}
