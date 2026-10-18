// ===================== TASK MANAGEMENT =====================
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;        // e.g. 'محتوى', 'برمجة', 'تدريب', 'وظيفة', 'عام'
  due_date?: string;       // ISO date string
  created_at: string;
  completed_at?: string;
}

// ===================== CONTENT MANAGEMENT =====================
export type ContentStatus = 'idea' | 'scripting' | 'shooting' | 'editing' | 'ready' | 'published';
export type ContentPlatform = 'instagram' | 'tiktok' | 'youtube' | 'telegram' | 'other';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  status: ContentStatus;
  platforms: ContentPlatform[];
  scheduled_date?: string;
  created_at: string;
}

// ===================== FINANCIAL MANAGEMENT =====================
export type IncomeType = 'salary' | 'courses' | 'projects' | 'other';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;       // 'IQD', 'USD'
  category: string;       // for expenses: 'إيجار', 'إنترنت', 'أكل', etc.
  income_type?: IncomeType; // only for income
  description?: string;
  date: string;            // ISO date string
  created_at: string;
}

// ===================== MONTHLY SUMMARY =====================
export interface MonthlySummary {
  month: string;           // e.g. '2026-10'
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeByType: Record<IncomeType, number>;
}
