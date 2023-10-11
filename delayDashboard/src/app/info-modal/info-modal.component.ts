import { Component, Input, OnInit } from '@angular/core';
import { HelpService } from '../help-service.service';

@Component({
  selector: 'info-modal',
  templateUrl: './info-modal.component.html',
  styleUrls: ['./info-modal.component.css'],
})
export class InfoModalComponent implements OnInit {
  @Input() visible = false;
  public infoText: string = '';

  constructor(private helpService: HelpService) {}

  ngOnInit() {
    this.helpService.getHelp().subscribe((info) => (this.infoText = info));
  }
}
