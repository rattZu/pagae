import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonTitle, IonToolbar } from '@ionic/angular';
import { LoanService } from '../core/loan.service';

@Component({
  selector: 'app-novo-emprestimo',
  templateUrl: './novo-emprestimo.page.html',
  styleUrls: ['./novo-emprestimo.page.scss'],
  imports: [CommonModule, FormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonTitle, IonToolbar]
})
export class NovoEmprestimoPage {
  personName = '';
  personPhone = '';
  amount: number | null = null;
  lateInterestRate: number | null = null;
  description = '';
  dueDate = '';
  errorMessage = '';

  constructor(private readonly loanService: LoanService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {
    if (!this.loanService.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  async save(): Promise<void> {
    this.errorMessage = '';
    if (!this.personName.trim() || !this.amount || !Number.isFinite(Number(this.amount)) || this.amount <= 0 || !this.dueDate) {
      this.errorMessage = 'Informe a pessoa, um valor válido e a data de vencimento.';
      return;
    }

    if (!this.loanService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      await this.loanService.addLoan({
        personName: this.personName.trim(),
        personPhone: this.personPhone.trim(),
        amount: Number(this.amount),
        lateInterestRate: this.lateInterestRate ? Number(this.lateInterestRate) : undefined,
        description: this.description.trim(),
        dueDate: this.dueDate
      });
      this.router.navigate(['/home'], { replaceUrl: true });
    } catch {
      this.errorMessage = 'Não foi possível salvar. Verifique sua conexão com o servidor.';
      this.changeDetector.detectChanges();
    }
  }

  goHome(): void { this.router.navigate(['/home']); }
  goPeople(): void { this.router.navigate(['/pessoas']); }
}
