import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, ContentItem, Transaction, TaskStatus, IncomeType } from '../api/types';

export const SUPABASE_URL = 'http://89.117.57.209:8001';
export const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkyMTU3OTIyLCJleHAiOjE5NDk4Mzc5MjJ9.HWacBR_HXxgvF4KFVP1oTghMotxeQUlskSUAscNo8xQ';

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const CACHE_TASKS_KEY = '@ta_cache_tasks';
const CACHE_CONTENT_KEY = '@ta_cache_content';
const CACHE_TRANSACTIONS_KEY = '@ta_cache_transactions';

// Safe Local Cache Helpers
const getLocal = async <T>(key: string): Promise<T[]> => {
  try {
    const val = await AsyncStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const setLocal = async <T>(key: string, data: T[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

// ===================== TASKS API (Syncs with ideas_vault table) =====================
export const TaskStorage = {
  getAll: async (): Promise<Task[]> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ideas_vault?select=*&order=id.desc`, {
        headers: HEADERS,
      });
      if (res.ok) {
        const rows = await res.json();
        const mapped: Task[] = rows.map((r: any) => {
          let extra: any = {};
          try {
            if (r.hook_idea) extra = JSON.parse(r.hook_idea);
          } catch {
            extra = { description: r.hook_idea };
          }
          return {
            id: String(r.id),
            title: r.title,
            description: extra.description || undefined,
            priority: extra.priority || 'medium',
            category: r.category || 'عام',
            status: r.status as TaskStatus,
            created_at: r.created_at,
          };
        });
        await setLocal(CACHE_TASKS_KEY, mapped);
        return mapped;
      }
    } catch {}
    return getLocal<Task>(CACHE_TASKS_KEY);
  },

  add: async (task: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
    const hookData = JSON.stringify({
      description: task.description || '',
      priority: task.priority,
    });

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ideas_vault`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          title: task.title,
          category: task.category,
          status: task.status,
          hook_idea: hookData,
        }),
      });

      if (res.ok) {
        const inserted = await res.json();
        if (inserted[0]) {
          const newTask: Task = {
            id: String(inserted[0].id),
            title: inserted[0].title,
            description: task.description,
            priority: task.priority,
            category: inserted[0].category,
            status: inserted[0].status,
            created_at: inserted[0].created_at,
          };
          const cached = await getLocal<Task>(CACHE_TASKS_KEY);
          await setLocal(CACHE_TASKS_KEY, [newTask, ...cached]);
          return newTask;
        }
      }
    } catch {}

    // Fallback Offline
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const cached = await getLocal<Task>(CACHE_TASKS_KEY);
    await setLocal(CACHE_TASKS_KEY, [newTask, ...cached]);
    return newTask;
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<void> => {
    // 1. Optimistic update local
    const cached = await getLocal<Task>(CACHE_TASKS_KEY);
    const updated = cached.map(t => (t.id === id ? { ...t, status } : t));
    await setLocal(CACHE_TASKS_KEY, updated);

    // 2. Sync to Supabase
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/ideas_vault?id=eq.${id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ status }),
      });
    } catch {}
  },

  delete: async (id: string): Promise<void> => {
    const cached = await getLocal<Task>(CACHE_TASKS_KEY);
    const filtered = cached.filter(t => t.id !== id);
    await setLocal(CACHE_TASKS_KEY, filtered);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/ideas_vault?id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS,
      });
    } catch {}
  },
};

// ===================== CONTENT API (Syncs with content_posts table) =====================
export const ContentStorage = {
  getAll: async (): Promise<ContentItem[]> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/content_posts?select=*&order=id.desc`, {
        headers: HEADERS,
      });
      if (res.ok) {
        const rows = await res.json();
        const mapped: ContentItem[] = rows.map((r: any) => ({
          id: String(r.id),
          title: r.title,
          description: r.hook || undefined,
          status: r.status || 'idea',
          platforms: Array.isArray(r.platforms) ? r.platforms : ['instagram'],
          created_at: r.created_at || new Date().toISOString(),
        }));
        await setLocal(CACHE_CONTENT_KEY, mapped);
        return mapped;
      }
    } catch {}
    return getLocal<ContentItem>(CACHE_CONTENT_KEY);
  },

  add: async (item: Omit<ContentItem, 'id' | 'created_at'>): Promise<ContentItem> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/content_posts`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          title: item.title,
          hook: item.description || '',
          status: item.status,
          platforms: item.platforms,
          week_number: 1,
          day_name: 'اليوم',
          script_body: '',
          call_to_action: '',
          format: 'reels_9_16',
          duration_seconds: 60,
          assignee: 'طه سعد',
        }),
      });

      if (res.ok) {
        const inserted = await res.json();
        if (inserted[0]) {
          const newItem: ContentItem = {
            id: String(inserted[0].id),
            title: inserted[0].title,
            description: inserted[0].hook,
            status: inserted[0].status,
            platforms: inserted[0].platforms,
            created_at: inserted[0].created_at,
          };
          const cached = await getLocal<ContentItem>(CACHE_CONTENT_KEY);
          await setLocal(CACHE_CONTENT_KEY, [newItem, ...cached]);
          return newItem;
        }
      }
    } catch {}

    const newItem: ContentItem = {
      ...item,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const cached = await getLocal<ContentItem>(CACHE_CONTENT_KEY);
    await setLocal(CACHE_CONTENT_KEY, [newItem, ...cached]);
    return newItem;
  },

  update: async (id: string, updates: Partial<ContentItem>): Promise<void> => {
    const cached = await getLocal<ContentItem>(CACHE_CONTENT_KEY);
    const updated = cached.map(i => (i.id === id ? { ...i, ...updates } : i));
    await setLocal(CACHE_CONTENT_KEY, updated);

    try {
      const body: any = {};
      if (updates.status) body.status = updates.status;
      if (updates.title) body.title = updates.title;
      if (updates.description) body.hook = updates.description;

      await fetch(`${SUPABASE_URL}/rest/v1/content_posts?id=eq.${id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify(body),
      });
    } catch {}
  },

  delete: async (id: string): Promise<void> => {
    const cached = await getLocal<ContentItem>(CACHE_CONTENT_KEY);
    const filtered = cached.filter(i => i.id !== id);
    await setLocal(CACHE_CONTENT_KEY, filtered);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/content_posts?id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS,
      });
    } catch {}
  },
};

// ===================== TRANSACTIONS API (Syncs with team_members table) =====================
export const TransactionStorage = {
  getAll: async (): Promise<Transaction[]> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/team_members?select=*&order=id.desc`, {
        headers: HEADERS,
      });
      if (res.ok) {
        const rows = await res.json();
        const mapped: Transaction[] = rows.map((r: any) => {
          const roleParts = (r.role || 'expense').split(':');
          const type = roleParts[0] as 'income' | 'expense';
          const incomeType = roleParts[1] as IncomeType | undefined;

          return {
            id: String(r.id),
            type,
            amount: Number(r.tasks_count) || 0,
            currency: r.avatar_emoji || 'IQD',
            category: r.name || 'عام',
            income_type: incomeType,
            description: r.motto || undefined,
            date: r.favorite_dish || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
          };
        });
        await setLocal(CACHE_TRANSACTIONS_KEY, mapped);
        return mapped;
      }
    } catch {}
    return getLocal<Transaction>(CACHE_TRANSACTIONS_KEY);
  },

  add: async (txn: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> => {
    const roleValue =
      txn.type === 'income' && txn.income_type ? `income:${txn.income_type}` : txn.type;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          name: txn.category,
          role: roleValue,
          avatar_emoji: txn.currency,
          tasks_count: txn.amount,
          motto: txn.description || '',
          favorite_dish: txn.date,
        }),
      });

      if (res.ok) {
        const inserted = await res.json();
        if (inserted[0]) {
          const newTxn: Transaction = {
            id: String(inserted[0].id),
            type: txn.type,
            amount: txn.amount,
            currency: txn.currency,
            category: txn.category,
            income_type: txn.income_type,
            description: txn.description,
            date: txn.date,
            created_at: new Date().toISOString(),
          };
          const cached = await getLocal<Transaction>(CACHE_TRANSACTIONS_KEY);
          await setLocal(CACHE_TRANSACTIONS_KEY, [newTxn, ...cached]);
          return newTxn;
        }
      }
    } catch {}

    const newTxn: Transaction = {
      ...txn,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    const cached = await getLocal<Transaction>(CACHE_TRANSACTIONS_KEY);
    await setLocal(CACHE_TRANSACTIONS_KEY, [newTxn, ...cached]);
    return newTxn;
  },

  delete: async (id: string): Promise<void> => {
    const cached = await getLocal<Transaction>(CACHE_TRANSACTIONS_KEY);
    const filtered = cached.filter(t => t.id !== id);
    await setLocal(CACHE_TRANSACTIONS_KEY, filtered);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/team_members?id=eq.${id}`, {
        method: 'DELETE',
        headers: HEADERS,
      });
    } catch {}
  },

  getSummary: (txns: Transaction[], currency?: string) => {
    const targetTxns = currency ? txns.filter(t => (t.currency || 'IQD') === currency) : txns;

    const calcFor = (currencyCode: string) => {
      const list = txns.filter(t => (t.currency || 'IQD') === currencyCode);
      const totalIncome = list.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = list.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      const incomeByType: Record<IncomeType, number> = {
        salary: 0,
        courses: 0,
        projects: 0,
        other: 0,
      };

      list
        .filter(t => t.type === 'income' && t.income_type)
        .forEach(t => {
          incomeByType[t.income_type!] += t.amount;
        });

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        incomeByType,
      };
    };

    const iqdSummary = calcFor('IQD');
    const usdSummary = calcFor('USD');

    const totalIncome = targetTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = targetTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const incomeByType: Record<IncomeType, number> = {
      salary: 0,
      courses: 0,
      projects: 0,
      other: 0,
    };

    targetTxns
      .filter(t => t.type === 'income' && t.income_type)
      .forEach(t => {
        incomeByType[t.income_type!] += t.amount;
      });

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      incomeByType,
      iqd: iqdSummary,
      usd: usdSummary,
    };
  },
};
