import { Component, inject } from '@angular/core';
import { addMonths, set } from 'date-fns';
import { ModalController } from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { Expense } from '../../shared/domain';
import { ExpensesApiService } from '../expenses.service';
import { Observable, finalize, groupBy, mergeMap, tap, toArray } from 'rxjs';

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly expensesApiService = inject(ExpensesApiService);

  public expenses$!: Observable<any>;
  public loading: boolean = false;
  public noResults: boolean = false;

  date = set(new Date(), { date: 1 });

  ionViewWillEnter(): void {
    this.getAllExpenses();
  }

  private getAllExpenses(): void {
    const year = this.date.getFullYear();
    const month = (this.date.getMonth() + 1).toString().padStart(2, '0');

    const yearMonth = `${year}${month}`;

    this.loading = true;
    this.expenses$ = this.expensesApiService.getExpenses({ yearMonth }).pipe(
      mergeMap((response: any) => response.content),
      groupBy((expense: any) => expense.date),
      mergeMap((group) => group.pipe(toArray())),
      toArray(),
      tap((results) => {
        this.noResults = results.length === 0;
      }),
      finalize(() => (this.loading = false)),
    );
  }

  public handleRefresh(event: any): void {
    setTimeout(() => {
      this.getAllExpenses();
      event.target.complete();
    }, 500);
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
    this.getAllExpenses();
  };

  async openModal(expense?: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense: expense ? { ...expense } : {} },
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role == 'save') this.getAllExpenses();
  }
}
