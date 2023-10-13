import { NgIconsModule } from '@ng-icons/core';
import {
  bootstrapXCircleFill,
  bootstrapInfoCircleFill,
} from '@ng-icons/bootstrap-icons';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { InfoModalComponent } from './info-modal/info-modal.component';
import { MarkdownModule } from 'ngx-markdown';
import { LineMapComponent } from './line-map/line-map.component';

@NgModule({
  declarations: [AppComponent, DashboardComponent, InfoModalComponent, LineMapComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgIconsModule.withIcons({ bootstrapXCircleFill, bootstrapInfoCircleFill }),
    MarkdownModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
