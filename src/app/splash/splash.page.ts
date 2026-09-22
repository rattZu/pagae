import { Component, OnDestroy } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  imports: [IonContent]
})
export class SplashPage implements OnDestroy {
  private readonly redirectTimer: ReturnType<typeof setTimeout>;

  constructor(private readonly router: Router) {
    this.redirectTimer = setTimeout(() => {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }, 2000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.redirectTimer);
  }
}
