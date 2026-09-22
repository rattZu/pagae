import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { Loan, LoanService } from '../core/loan.service';

interface PersonSummary { name: string; phone: string; total: number; pending: number; loans: number; }

@Component({
  selector: 'app-pessoas',
  templateUrl: './pessoas.page.html',
  styleUrls: ['./pessoas.page.scss'],
  imports: [CommonModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar]
})
export class PessoasPage {
  peopleList: PersonSummary[] = [];
  errorMessage = '';
  loading = true;

  constructor(private readonly loanService: LoanService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {
    if (!this.loanService.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  async loadPeople(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.loanService.loadLoans();
    } catch (error) {
      this.peopleList = [];
      this.errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar as pessoas.';
      this.loading = false;
      this.changeDetector.detectChanges();
      return;
    }
    const grouped = new Map<string, PersonSummary>();
    this.loanService.loans.forEach((loan: Loan) => {
      const person = grouped.get(loan.personName) || { name: loan.personName, phone: loan.personPhone, total: 0, pending: 0, loans: 0 };
      person.total += loan.amount;
      person.pending += this.loanService.getPending(loan);
      person.loans += 1;
      grouped.set(loan.personName, person);
    });
    this.peopleList = Array.from(grouped.values()).sort((a, b) => b.pending - a.pending);
    this.loading = false;
    this.changeDetector.detectChanges();
  }

  ionViewDidEnter(): void { void this.loadPeople(); }

  initials(name: string): string { return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
  formatCurrency(value: number): string { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  newLoan(): void { this.router.navigate(['/novo-emprestimo']); }
  goHome(): void { this.router.navigate(['/home']); }
}
