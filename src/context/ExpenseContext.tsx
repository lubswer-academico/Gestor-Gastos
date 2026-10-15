import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Expense } from '@/types/expense';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getAllExpenses,
  insertExpense,
  updateExpense as updateExpenseInRepo,
  deleteExpense as deleteExpenseInRepo,
} from '@/database/expenseRepository';

interface ExpenseContextType {
  expenses: Expense[];
  // true mientras se leen los gastos guardados al abrir la app
  isLoading: boolean;
  // Operaciones CRUD con SQLite
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getMonthlyTotal: () => number;
  getCurrentMonthExpenses: () => Expense[];
}

// Arranca en undefined para poder avisar si alguien usa el hook sin Provider
const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Conexion a la base que abrio SQLiteProvider en _layout.tsx
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Se ejecuta al montar el Provider (al abrir la app).
  useEffect(() => {
    const cargarGastos = async () => {
      try {
        const guardados = await getAllExpenses(db);
        setExpenses(guardados);
      } catch (error) {
        console.error('No se pudieron cargar los gastos', error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarGastos();
  }, [db]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
    };

    // Primero persistimos en SQLite y luego actualizamos el estado
    await insertExpense(db, newExpense);
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const updateExpense = async (expense: Expense) => {
    await updateExpenseInRepo(db, expense);
    setExpenses((prev) =>
      prev.map((item) => (item.id === expense.id ? expense : item))
    );
  };

  const deleteExpense = async (id: string) => {
    await deleteExpenseInRepo(db, id);
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });
  };

  const getMonthlyTotal = () => {
    return getCurrentMonthExpenses().reduce(
      (total, expense) => total + expense.amount,
      0
    );
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        isLoading,
        addExpense,
        updateExpense,
        deleteExpense,
        getMonthlyTotal,
        getCurrentMonthExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
