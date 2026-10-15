import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'gastos.db';

/**
 * Inicializa la base de datos de SQLite creando la tabla de gastos
 * y asegurando las columnas necesarias (incluyendo receiptUri para fotos/facturas).
 */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      receiptUri TEXT
    );
  `);

  // Migración preventiva: Si la tabla fue creada en una versión anterior sin receiptUri
  try {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN receiptUri TEXT;');
  } catch {
    // La columna ya existe, no se hace nada
  }
}