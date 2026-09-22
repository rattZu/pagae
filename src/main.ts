import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  addCircleOutline,
  appsOutline,
  arrowBackOutline,
  arrowUpCircleOutline,
  calendarOutline,
  callOutline,
  cashOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeOutline,
  documentTextOutline,
  homeOutline,
  lockClosedOutline,
  logOutOutline,
  mailOutline,
  peopleOutline,
  personAddOutline,
  personCircleOutline,
  personOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

addIcons({
  addOutline,
  addCircleOutline,
  appsOutline,
  arrowBackOutline,
  arrowUpCircleOutline,
  calendarOutline,
  callOutline,
  cashOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeOutline,
  documentTextOutline,
  homeOutline,
  lockClosedOutline,
  logOutOutline,
  mailOutline,
  peopleOutline,
  personAddOutline,
  personCircleOutline,
  personOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
