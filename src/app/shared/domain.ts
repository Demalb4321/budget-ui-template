// ------
// Paging
// ------

export interface SortCriteria {
  sort: string;
}

export interface PagingCriteria extends SortCriteria {
  page: number;
  size: number;
}

export interface Page<T> {
  content: T[];
  last: boolean;
  totalElements: number;
}

// ----
// Misc
// ----

export interface SortOption {
  label: string;
  value: string;
}

// --------
// Category
// --------

export interface Category {
  id?: string;
  name: string;
}

export interface CategoryCriteria extends PagingCriteria {
  name?: string;
}

export interface AllCategoryCriteria extends SortCriteria {
  name?: string;
}

// -------
// Expense
// -------

export interface Expense {
  id: string;
  createdAt: string;
  lastModifiedAt: string;
  amount: number;
  category: Category;
  date: string;
  name: string;
}

export interface ExpenseUpsertDto {
  id?: string;
  amount: number;
  categoryId: string;
  date: string;
  name: string;
}

export interface ExpenseCriteria {
  categoryIds?: string;
  name?: string;
  yearMonth?: string;
}

export interface ExpensesResponse {
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  numberOfElements: number;
  content: Expense[];
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  pageable: {
    paged: boolean;
    unpaged: boolean;
    pageNumber: number;
    pageSize: number;
    offset: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
  };
  empty: boolean;
}
