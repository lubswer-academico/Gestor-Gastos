import { SQLiteDatabase } from 'expo-sqlite';
import { Category, Expense } from '@/types/expense';

interface ExpenseRow {
  id: string;
  amount: number;
  category: Category;
  date: string;
  description: string | null;
  receiptUri: string | null;
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    category: row.category as Category,
    date: new Date(row.date),
    description: row.description ?? undefined,
    receiptUri: row.receiptUri ?? undefined,
  };
}

/**
 * Obtiene todos los gastos registrados en SQLite ordenados por fecha descendente.
 */
export async function getAllExpenses(db: SQLiteDatabase): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT id, amount, category, date, description, receiptUri FROM expenses ORDER BY date DESC;'
  );

  return rows.map(rowToExpense);
}

/**
 * Inserta un nuevo gasto en la base de datos SQLite.
 */
export async function insertExpense(db: SQLiteDatabase, expense: Expense): Promise<void> {
  await db.runAsync(
    'INSERT INTO expenses (id, amount, category, date, description, receiptUri) VALUES (?, ?, ?, ?, ?, ?);',
    [
      expense.id,
      expense.amount,
      expense.category,
      expense.date.toISOString(),
      expense.description ?? null,
      expense.receiptUri ?? null,
    ]
  );
}

/**
 * Actualiza un gasto existente en SQLite.
 */
export async function updateExpense(db: SQLiteDatabase, expense: Expense): Promise<void> {
  await db.runAsync(
    `UPDATE expenses
     SET amount = ?, category = ?, date = ?, description = ?, receiptUri = ?
     WHERE id = ?;`,
    [
      expense.amount,
      expense.category,
      expense.date.toISOString(),
      expense.description ?? null,
      expense.receiptUri ?? null,
      expense.id,
    ]
  );
}

/**
 * Elimina un gasto de la base de datos SQLite por su ID.
 */
export async function deleteExpense(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
}