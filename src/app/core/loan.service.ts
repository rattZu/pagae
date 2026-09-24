import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
}

export interface Loan {
  id: string;
  personName: string;
  personPhone: string;
  amount: number;
  description: string;
  dueDate: string;
  lateInterestRate?: number;
  createdAt: string;
  payments: LoanPayment[];
}

export interface AppUser {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly sessionKey = 'empresta-session';
  private readonly tokenKey = 'empresta-auth-token';
  private loanCache: Loan[] = [];
  private readonly loanActions = ['loans', 'create-loan', 'create-payment', 'delete-loan'];

  get currentUser(): AppUser | null {
    return localStorage.getItem(this.tokenKey) ? this.read<AppUser | null>(this.sessionKey, null) : null;
  }

  get loans(): Loan[] {
    return this.loanCache;
  }

  async register(user: AppUser): Promise<void> {
    const response = await this.apiRequest<{ user: AppUser; token: string }>('register', user);
    this.setAuthenticatedUser(response);
  }

  async ensureDemoUser(): Promise<void> {
    await this.loginDemo();
  }

  async loginDemo(): Promise<void> {
    const response = await this.apiRequest<{ user: AppUser; token: string }>('demo');
    this.setAuthenticatedUser(response);
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.apiRequest<{ user: AppUser; token: string }>('login', { email, password });
      this.setAuthenticatedUser(response);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.loanCache = [];
    const token = localStorage.getItem(this.tokenKey);
    localStorage.removeItem(this.tokenKey);
    if (token) void fetch(`${environment.authApiUrl}?action=logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' }
    });
  }

  async updateUser(user: AppUser): Promise<void> {
    const response = await this.apiRequest<{ user: AppUser }>('update', user);
    this.write(this.sessionKey, response.user);
  }

  async loadLoans(): Promise<void> {
    const response = await this.apiRequest<{ loans: Loan[] }>('loans');
    this.loanCache = response.loans;
  }

  async addLoan(data: Omit<Loan, 'id' | 'createdAt' | 'payments'>): Promise<Loan> {
    const loan: Loan = {
      ...data,
      id: this.createId(),
      createdAt: new Date().toISOString(),
      payments: []
    };
    await this.apiRequest('create-loan', loan);
    this.loanCache = [loan, ...this.loanCache];
    return loan;
  }

  async addPayment(loanId: string, amount: number): Promise<void> {
    const payment: LoanPayment = { id: this.createId(), amount, date: new Date().toISOString() };
    await this.apiRequest('create-payment', { id: payment.id, loanId, amount });
    this.loanCache = this.loanCache.map((loan) => loan.id === loanId
      ? {
          ...loan,
          payments: [...loan.payments, payment]
        }
      : loan);
  }

  async deleteLoan(loanId: string): Promise<void> {
    await this.apiRequest('delete-loan', { loanId });
    this.loanCache = this.loanCache.filter((loan) => loan.id !== loanId);
  }

  getPaid(loan: Loan): number {
    return loan.payments.reduce((total, payment) => total + payment.amount, 0);
  }

  getLateInterest(loan: Loan): number {
    const rate = Number(loan.lateInterestRate || 0);
    return this.isOverdue(loan) && rate > 0 && this.getPaid(loan) < loan.amount
      ? loan.amount * rate / 100
      : 0;
  }

  getPending(loan: Loan): number {
    return Math.max(loan.amount + this.getLateInterest(loan) - this.getPaid(loan), 0);
  }

  getTotalLent(): number {
    return this.loans.reduce((total, loan) => total + loan.amount, 0);
  }

  getTotalReceived(): number {
    return this.loans.reduce((total, loan) => total + this.getPaid(loan), 0);
  }

  getTotalPending(): number {
    return this.loans.reduce((total, loan) => total + this.getPending(loan), 0);
  }

  private isOverdue(loan: Loan): boolean {
    return new Date(loan.dueDate) < new Date();
  }

  private setAuthenticatedUser(response: { user: AppUser; token: string }): void {
    this.write(this.sessionKey, response.user);
    localStorage.setItem(this.tokenKey, response.token);
  }

  private async apiRequest<T>(action: string, body: object = {}): Promise<T> {
    const token = localStorage.getItem(this.tokenKey);
    const baseUrl = this.loanActions.includes(action) ? environment.loansApiUrl : environment.authApiUrl;
    const response = await fetch(`${baseUrl}?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    const data = await response.json() as T & { message?: string };
    if (!response.ok) throw new Error(data.message || 'Erro de autenticação.');
    return data;
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private read<T>(key: string, fallback: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  }

  private write<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
