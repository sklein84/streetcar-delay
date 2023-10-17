import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
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
export class LineMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) line: string = '';
  @Input() stat: string = '';
  selectedLine: HTMLElement | null = null;
  @Output() selectedLineEmitter = new EventEmitter<HTMLElement | null>();
  hoveringStop: string = '';
  hoveringStopLeft: string = 'auto';
  hoveringStopTop: string = 'auto';
  listenerDeleters: (() => void)[] = [];
  svgMap: SafeHtml = '';
  @Input() colorMap: Map<string, string> = new Map();

  constructor(
    private lineService: LineService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.lineService.getMap(this.line).subscribe((map) => {
      this.svgMap = this.sanitizer.bypassSecurityTrustHtml(map);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['line']) {
      this.hoveringStop = '';
      this.lineService.getMap(this.line).subscribe((map) => {
        this.svgMap = this.sanitizer.bypassSecurityTrustHtml(map);
        setTimeout(() => {
          this.setUpStopListeners();
          this.styleLines();
        }, 50);
      });
    }
    if (changes['stat']) {
      this.styleLines();
    }
  }

  ngOnDestroy(): void {
    this.cleanUpListeners();
  }

  private cleanUpListeners(): void {
    this.listenerDeleters.forEach((f) => f());
    this.listenerDeleters = [];
  }

  private setUpStopListeners(): void {
    this.cleanUpListeners();

    const circleElements = this.document.querySelectorAll('circle');
    circleElements.forEach((circle) => {
      this.listenerDeleters.push(
        this.renderer.listen(circle, 'mouseenter', () => {
          this.hoveringStop = circle.id.slice(5);
          const boundingRect = circle.getBoundingClientRect();
          this.hoveringStopLeft = `${boundingRect.left + 15}px`;
          this.hoveringStopTop = `${boundingRect.top + 15}px`;
        })
      );
      this.listenerDeleters.push(
        this.renderer.listen(circle, 'mouseleave', () => {
          this.hoveringStop = '';
        })
      );
    });
  }

  private resetSelectedLineStyle() {
    if (this.selectedLine !== null) {
      this.selectedLine.style.stroke =
        this.colorMap.get(this.selectedLine.id.slice(5)) || 'red';
      this.selectedLine.style.strokeWidth = '5px';
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
}
