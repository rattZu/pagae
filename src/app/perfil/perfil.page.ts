import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
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
import { AppUser, LoanService } from '../core/loan.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonTitle,
    IonToolbar
  ]
})
export class PerfilPage {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';

  constructor(private readonly loanService: LoanService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {
    const user = this.loanService.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.name.trim() || !this.email.trim()) {
      this.errorMessage = 'Preencha nome e e-mail para continuar.';
      return;
    }
    if (this.password && this.password.length < 6) {
      this.errorMessage = 'A nova senha precisa ter pelo menos 6 caracteres.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não conferem.';
      return;
    }

    const currentUser = this.loanService.currentUser;
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    const updatedUser: AppUser = {
      name: this.name.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      password: this.password || ''
    };
    void this.saveUser(updatedUser);
  }

  private async saveUser(user: AppUser): Promise<void> {
    try {
      await this.loanService.updateUser(user);
      this.password = '';
      this.confirmPassword = '';
      this.router.navigate(['/home']);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.';
      this.changeDetector.detectChanges();
    }
  }

  back(): void {
    this.router.navigate(['/home']);
  }
}
