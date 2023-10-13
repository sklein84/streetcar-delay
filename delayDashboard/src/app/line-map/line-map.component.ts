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
import { LineService } from '../line-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'line-map',
  templateUrl: './line-map.component.html',
  styleUrls: ['./line-map.component.css'],
})
export class LineMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) line: string = '';
  selectedLine: HTMLElement | null = null;
  @Output() selectedLineEmitter = new EventEmitter<HTMLElement | null>();
  hoveringStop: string = '';
  listenerDeleters: (() => void)[] = [];
  svgMap: SafeHtml = '';

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
    if (changes['line'].previousValue != changes['line'].currentValue) {
      this.lineService.getMap(this.line).subscribe((map) => {
        this.svgMap = this.sanitizer.bypassSecurityTrustHtml(map);
        setTimeout(() => this.setUpStopListeners(), 100);
      });
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
        })
      );
    });
  }

  private resetSelectedLineStyle() {
    if (this.selectedLine !== null) {
      this.selectedLine.style.stroke = 'red';
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
    this.selectedLine.style.strokeWidth = '7px';

    this.selectedLineEmitter.emit(this.selectedLine);
  }
}
