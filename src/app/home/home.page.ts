import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonTitle, IonToolbar } from '@ionic/angular';
import { Loan, LoanService } from '../core/loan.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonContent, IonHeader, IonIcon, IonInput, IonTitle, IonToolbar],
})
export class HomePage {
  loans: Loan[] = [];
  filter: 'all' | 'pending' | 'paid' | 'late' = 'all';
  selectedLoanId = '';
  expandedLoanId = '';
  paymentAmount: number | null = null;
  menuOpen = false;

  constructor(private readonly loanService: LoanService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {
    if (!this.loanService.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadLoans();
  }

  get userName(): string { return this.loanService.currentUser?.name?.split(' ')[0] || 'de volta'; }
  get totalLent(): number { return this.loanService.getTotalLent(); }
  get totalReceived(): number { return this.loanService.getTotalReceived(); }
  get totalPending(): number { return this.loanService.getTotalPending(); }
  get paidRatio(): number { return this.totalLent ? Math.round((this.totalReceived / this.totalLent) * 100) : 0; }
  get lateCount(): number { return this.loans.filter((loan) => this.getPending(loan) > 0 && this.isOverdue(loan)).length; }
  get filteredLoans(): Loan[] {
    return this.loans.filter((loan) => {
      if (this.filter === 'pending') return this.getPending(loan) > 0;
      if (this.filter === 'paid') return this.getPending(loan) === 0;
      if (this.filter === 'late') return this.getPending(loan) > 0 && this.isOverdue(loan);
      return true;
    });
  }

  get chartData(): { label: string; value: number; color: string }[] {
    const max = Math.max(this.totalLent || 1, this.totalReceived || 1, this.totalPending || 1);
    return [
      { label: 'Total', value: this.totalLent / max * 100, color: '#1e66f5' },
      { label: 'Pago', value: this.totalReceived / max * 100, color: '#159a74' },
      { label: 'Pendente', value: this.totalPending / max * 100, color: '#e88a28' }
    ];
  }

  async loadLoans(): Promise<void> {
    try {
      await this.loanService.loadLoans();
      this.loans = this.loanService.loans;
    } catch {
      this.loans = [];
    }
    this.changeDetector.detectChanges();
  }
  ionViewWillEnter(): void { void this.loadLoans(); }
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  newLoan(): void { this.closeMenu(); this.router.navigate(['/novo-emprestimo']); }
  people(): void { this.closeMenu(); this.router.navigate(['/pessoas']); }
  dashboard(): void { this.closeMenu(); this.router.navigate(['/home']); }
  profile(): void { this.closeMenu(); this.router.navigate(['/perfil']); }
  selectForPayment(id: string): void { this.selectedLoanId = id; this.paymentAmount = null; }
  toggleDetails(id: string): void { this.expandedLoanId = this.expandedLoanId === id ? '' : id; }
  async registerPayment(id: string): Promise<void> {
    const loan = this.loans.find((item) => item.id === id);
    if (!loan || !this.paymentAmount || this.paymentAmount <= 0) return;
    const amount = Math.min(this.paymentAmount, this.getPending(loan));
    const confirmed = window.confirm(`Confirmar recebimento de ${this.formatCurrency(amount)} de ${loan.personName}?`);
    if (!confirmed) return;
    try {
      await this.loanService.addPayment(id, amount);
      this.selectedLoanId = '';
      this.paymentAmount = null;
      this.loans = this.loanService.loans;
      this.changeDetector.detectChanges();
    } catch {
      window.alert('Não foi possível registrar o recebimento. Verifique sua conexão.');
    }
  }
  async deleteLoan(loan: Loan): Promise<void> {
    const confirmed = window.confirm(`Excluir o empréstimo de ${loan.personName}? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    try {
      await this.loanService.deleteLoan(loan.id);
      this.loans = this.loanService.loans;
      if (this.expandedLoanId === loan.id) this.expandedLoanId = '';
      if (this.selectedLoanId === loan.id) this.selectedLoanId = '';
      this.changeDetector.detectChanges();
    } catch {
      window.alert('Não foi possível excluir o empréstimo. Verifique sua conexão.');
    }
  }
  logout(): void { this.closeMenu(); this.loanService.logout(); this.router.navigate(['/login']); }
  getPending(loan: Loan): number { return this.loanService.getPending(loan); }
  getLateInterest(loan: Loan): number { return this.loanService.getLateInterest(loan); }
  getPaid(loan: Loan): number { return this.loanService.getPaid(loan); }
  progress(loan: Loan): number { return loan.amount ? Math.round((this.loanService.getPaid(loan) / loan.amount) * 100) : 0; }
  isOverdue(loan: Loan): boolean { return this.getPending(loan) > 0 && new Date(loan.dueDate) < new Date(); }
  statusText(loan: Loan): string { return this.getPending(loan) === 0 ? 'Pago completo' : this.isOverdue(loan) ? 'Vencido' : `Vence em ${this.formatDate(loan.dueDate)}`; }
  initials(name: string): string { return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
  formatCurrency(value: number): string { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  formatDate(value: string): string { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR'); }
}
