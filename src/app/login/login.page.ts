import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
} from '@ionic/angular';
import { LoanService } from '../core/loan.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    FormsModule,
    CommonModule
  ]
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private readonly loanService: LoanService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {
    if (this.loanService.currentUser) {
      this.router.navigate(['/home']);
    }
  }

  async login(): Promise<void> {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Informe seu e-mail e sua senha.';
      return;
    }
    if (!await this.loanService.login(this.email, this.password)) {
      this.errorMessage = 'E-mail ou senha incorretos. Crie uma conta para começar.';
      this.changeDetector.detectChanges();
      return;
    }
    this.router.navigate(['/home']);
  }

  async loginDemo(): Promise<void> {
    this.errorMessage = '';
    try {
      await this.loanService.loginDemo();
      this.router.navigate(['/home']);
    } catch {
      this.errorMessage = 'Não foi possível conectar ao servidor do XAMPP.';
      this.changeDetector.detectChanges();
    }
  }

  goRegister(): void { this.router.navigate(['/cadastro']); }

  recoverPassword(): void {
    this.errorMessage = 'Entre em contato para recuperar o acesso à sua conta.';
  }
}