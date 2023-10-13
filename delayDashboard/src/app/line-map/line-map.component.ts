import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { LineService } from '../line-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'line-map',
  templateUrl: './line-map.component.html',
  styleUrls: ['./line-map.component.css'],
})
export class LineMapComponent implements OnChanges {
  @Input({ required: true }) line: string = '';
  selectedLine: HTMLElement | null = null;
  @Output() selectedLineEmitter = new EventEmitter<HTMLElement | null>();
  svgMap: SafeHtml = '';

  constructor(
    private lineService: LineService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['line'].previousValue != changes['line'].currentValue) {
      this.lineService
        .getMap(this.line)
        .subscribe(
          (img) => (this.svgMap = this.sanitizer.bypassSecurityTrustHtml(img))
        );
    }
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
