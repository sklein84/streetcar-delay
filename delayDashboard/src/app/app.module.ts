import { NgIconsModule } from '@ng-icons/core';
import { bootstrapXCircleFill } from '@ng-icons/bootstrap-icons';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AppComponent, DashboardComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgIconsModule.withIcons({ bootstrapXCircleFill }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
