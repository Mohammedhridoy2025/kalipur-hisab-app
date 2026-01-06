
export interface Member {
  id: string;
  name: string;
  houseName: string;
  mobile: string;
  photoUrl: string;
  country: string;
  status: 'active' | 'inactive';
}

export interface Subscription {
  id: string;
  memberId: string;
  month: string; // e.g., "2024-05"
  amount: number;
  date: string;
  receivedBy: string;
  receiptNo: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface Expense {
  id: string;
  category: 'Salary' | 'Biriyani' | 'Snacks' | 'Others';
  description: string;
  amount: number;
  date: string;
  items: ExpenseItem[];
}

export interface TrashRecord {
  id: string;
  originalId: string;
  type: 'subscription' | 'expense' | 'member';
  data: any;
  deletedAt: string;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  title: string;
  message: string;
}

export type ViewState = 'dashboard' | 'members' | 'collections' | 'expenses' | 'reports' | 'trash' | 'defaulters';
