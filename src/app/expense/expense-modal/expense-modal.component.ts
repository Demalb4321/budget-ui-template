import { Component, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Observable, filter, from } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExpensesApiService } from '../expenses.service';
import { CategoryService } from 'src/app/category/category.service';
import { ToastService } from 'src/app/shared/service/toast.service';
import { Expense } from 'src/app/shared/domain';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  private readonly actionSheetService = inject(ActionSheetService);
  private readonly modalCtrl = inject(ModalController);
  private readonly categoriesApiService = inject(CategoryService);
  private readonly expensesApiService = inject(ExpensesApiService);
  private readonly toastService = inject(ToastService);

  public expenseCategories$!: Observable<any[]>;
  public submitting: boolean = false;

  @Input() expense: Expense | null = null;

  public expenseForm: FormGroup = new FormGroup({
    amount: new FormControl(0, [Validators.min(0.001), Validators.required]),
    categoryId: new FormControl(null),
    name: new FormControl('', Validators.required),
    date: new FormControl(new Date().toISOString(), Validators.required),
  });

  ionViewWillEnter(): void {
    this.getExpenseCategories();

    if (this.expense) {
      this.expenseForm.patchValue({
        ...this.expense,
        categoryId: this.expense.category ? this.expense.category.id : null,
      });
    }
  }

  private getExpenseCategories(): void {
    this.expenseCategories$ = this.categoriesApiService.getAllCategories({ sort: 'name,asc' });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  public removeCategory(): void {
    this.expenseForm.patchValue({
      categoryId: null,
    });
  }

  save(): void {
    const { categoryId } = this.expenseForm.value;
    const expense = this.expenseForm.value;

    if (categoryId == 'null') delete expense.categoryId;

    if (this.expense) expense.id = this.expense.id;

    for (const controlName of Object.keys(this.expenseForm.controls)) {
      const control = this.expenseForm.get(controlName);
      control?.disable();
    }

    this.submitting = true;

    this.expensesApiService.upsertExpense(expense).subscribe({
      next: () => {
        this.modalCtrl.dismiss(null, 'save');
        this.toastService.displaySuccessToast('Expense saved');
      },

      error: (error) => {
        this.submitting = false;
        this.toastService.displayErrorToast('Could not save expense', error);
        for (const controlName of Object.keys(this.expenseForm.controls)) {
          const control = this.expenseForm.get(controlName);
          control?.enable();
        }
      },
      complete: () => (this.submitting = false),
    });
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(filter((action) => action === 'delete'))
      .subscribe(() => {
        if (this.expense) {
          this.expensesApiService.deleteExpense(this.expense.id).subscribe({
            complete: () => {
              this.toastService.displaySuccessToast('Expense has been deleted.');
              this.modalCtrl.dismiss(null, 'delete');
            },

            error: (error) => {
              this.toastService.displayErrorToast('Could not delete expense', error);
              this.modalCtrl.dismiss(null, 'error');
            },
          });
        }
      });
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();

    if (role == 'refresh') this.getExpenseCategories();
  }
}
