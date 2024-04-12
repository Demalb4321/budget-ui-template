import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Observable, filter, from } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExpensesApiService } from '../expenses.service';
import { CategoryService } from 'src/app/category/category.service';
import { ToastService } from 'src/app/shared/service/toast.service';

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

  public newExpenseForm: FormGroup = new FormGroup({
    amount: new FormControl(0, [Validators.min(0.001), Validators.required]),
    categoryId: new FormControl(null),
    name: new FormControl('', Validators.required),
    date: new FormControl(new Date().toISOString(), Validators.required),
  });

  ionViewWillEnter(): void {
    this.getExpenseCategories();
  }

  private getExpenseCategories(): void {
    this.expenseCategories$ = this.categoriesApiService.getAllCategories({ sort: 'name,asc' });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    const { categoryId } = this.newExpenseForm.value;
    const expense = this.newExpenseForm.value;

    if (categoryId == null) delete expense.categoryId;

    this.submitting = true;

    this.expensesApiService.upsertExpense(expense).subscribe({
      next: () => {
        this.modalCtrl.dismiss(null, 'save');
        this.toastService.displaySuccessToast('Expense saved');
      },

      error: (error) => {
        this.submitting = false;
        this.toastService.displayErrorToast('Could not save expense', error);
      },
      complete: () => (this.submitting = false),
    });
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(filter((action) => action === 'delete'))
      .subscribe(() => this.modalCtrl.dismiss(null, 'delete'));
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();

    if (role == 'refresh') this.getExpenseCategories();
  }
}
