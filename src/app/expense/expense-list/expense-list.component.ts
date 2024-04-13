import { Component, inject } from '@angular/core';
import { addMonths, set } from 'date-fns';
import { ModalController } from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { Expense, ExpenseCriteria } from '../../shared/domain';
import { ExpensesApiService } from '../expenses.service';
import { Observable, finalize, groupBy, mergeMap, tap, toArray } from 'rxjs';
import { CategoryService } from 'src/app/category/category.service';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly expensesApiService = inject(ExpensesApiService);
  private readonly categoriesApiService = inject(CategoryService);

  public expenses$!: Observable<any>;
  public categories$!: Observable<any>;
  public loading: boolean = false;
  public noResults: boolean = false;

  public sortOptions: any = [
    {
      value: 'createdAt,desc',
      label: 'Created at (newest first)',
    },
    {
      value: 'createdAt,asc',
      label: 'Created at (oldest first)',
    },
    {
      value: 'date,desc',
      label: 'Date (newest first)',
    },
    {
      value: 'date,asc',
      label: 'Date (oldest first)',
    },
    {
      value: 'name,asc',
      label: 'Name (A-Z)',
    },
    {
      value: 'name,desc',
      label: 'Name (Z-A)',
    },
  ];

  date = set(new Date(), { date: 1 });

  public filterForm: FormGroup = new FormGroup({
    sort: new FormControl('date,desc'),
    categoryIds: new FormControl(''),
    name: new FormControl(''),
  });

  ionViewWillEnter(): void {
    this.getAllCategories();
    this.getAllExpenses();

    this.filterForm.valueChanges.subscribe(() => this.getAllExpenses());
  }

  private getAllCategories(): void {
    this.categories$ = this.categoriesApiService.getAllCategories({ sort: 'desc' });
  }

  private getAllExpenses(): void {
    const { sort, categoryIds, name } = this.filterForm.value;

    const year = this.date.getFullYear();
    const month = (this.date.getMonth() + 1).toString().padStart(2, '0');

    const yearMonth = `${year}${month}`;

    const expenseCriteria: ExpenseCriteria = {
      yearMonth,
      sort,
      name,
      categoryIds,
      page: 0,
      size: 25,
    };

    this.loading = true;
    this.expenses$ = this.expensesApiService.getExpenses(expenseCriteria).pipe(
      mergeMap((response: any) => response.content),
      groupBy((expense: any) => {
        const { sort } = this.filterForm.value;
        return sort.includes('date') ? expense.date : expense.id;
      }),
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
    if (role == 'save' || role == 'delete') this.getAllExpenses();
  }
}
