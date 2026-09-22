import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar
} from '@ionic/angular';
import { LoanService } from '../core/loan.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonTitle,
    IonToolbar,
    FormsModule,
    CommonModule
  ]
})
export class CadastroPage {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  constructor(private readonly loanService: LoanService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {}

  async register(): Promise<void> {
    this.errorMessage = '';
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Preencha todos os campos para continuar.';
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'A senha precisa ter pelo menos 6 caracteres.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não conferem.';
      return;
    }
    try {
      await this.loanService.register({
        name: this.name,
        email: this.email,
        phone: this.phone,
        password: this.password
      });
      this.router.navigate(['/home']);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Não foi possível criar a conta.';
      this.changeDetector.detectChanges();
    }
  }

  goLogin(): void { this.router.navigate(['/login']); }
}
