import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ExpenseCriteria, ExpenseUpsertDto, ExpensesResponse } from '../shared/domain';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private readonly http = inject(HttpClient);

  public getExpenses(options?: ExpenseCriteria): Observable<ExpensesResponse> {
    return this.http.get<ExpensesResponse>(`${environment.backendUrl}/expenses`, {
      params: new HttpParams({ fromObject: { ...options } }),
    });
  }

  public upsertExpense(expense: ExpenseUpsertDto): Observable<void> {
    return this.http.put<void>(`${environment.backendUrl}/expenses`, expense);
  }

  public deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendUrl}/expenses/${id}`);
  }
}
