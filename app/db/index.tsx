import * as SQLite from 'expo-sqlite/next';
import * as FileSystem from 'expo-file-system';

// --- KONFIGURASI DASAR DATABASE ---
export const databaseName = 'resepku.db';
export const databasePath = `${FileSystem.documentDirectory}SQLite/${databaseName}`;

let db = SQLite.openDatabaseSync(databaseName);

/**
 * Inisialisasi database: membuat tabel 'menu' dan 'favorites' jika belum ada.
 */
export const initializeDatabase = async () => {
  try {
    if (!db) {
        db = SQLite.openDatabaseSync(databaseName);
    }
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        nama TEXT NOT NULL,
        ingredients TEXT, 
        kategori TEXT,
        tanggal TEXT     
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        menu_id INTEGER PRIMARY KEY,
        FOREIGN KEY(menu_id) REFERENCES menu(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('[DB] Gagal inisialisasi database/tabel:', error);
    throw error;
  }
};

// --- FUNGSI MANAJEMEN KONEKSI ---
export const closeCurrentDatabase = async () => {
  try {
    if (db) {
      await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
      await db.closeAsync();
      console.log('[DB] Koneksi database berhasil ditutup.');
    }
  } catch (e) {
    console.error("[DB] Gagal menutup database:", e);
  }
};

export const reinitializeDatabaseConnection = async () => {
  console.log("[DB] Membuka ulang koneksi database...");
  db = SQLite.openDatabaseSync(databaseName);
  await initializeDatabase();
};

export const checkpointDatabase = async (): Promise<void> => {
  try {
    if (db) {
      await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
    }
  } catch (error) {
    console.error('[DB] Gagal melakukan WAL checkpoint:', error);
    throw error;
  }
};

// --- INTERFACES & TIPE ---
export interface StoredIngredient { name: string; quantity: string; }
export interface MenuItem {
  id: number;
  nama: string;
  ingredients: StoredIngredient[];
  kategori: string | null;
  tanggal: string;
  isFavorite?: boolean;
}
export type SortByType = 'terbaru' | 'terlama' | 'nama-az' | 'nama-za';


// --- FUNGSI CRUD MENU ---

export const addMenuItem = async (nama: string, ingredientsArray: StoredIngredient[], kategori: string): Promise<number | undefined> => {
  const ingredientsJSON = JSON.stringify(ingredientsArray);
  const tanggal = new Date().toISOString();
  try {
    const result = await db.runAsync('INSERT INTO menu (nama, ingredients, kategori, tanggal) VALUES (?, ?, ?, ?)', nama, ingredientsJSON, kategori, tanggal);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('[DB] Gagal menambahkan menu:', error);
    return undefined;
  }
};

export const getMenuItems = async (
  searchTerm: string = '',
  category: string = '',
  sortBy: SortByType = 'terbaru'
): Promise<MenuItem[]> => {
  let query = `
    SELECT m.*, CASE WHEN f.menu_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite
    FROM menu m
    LEFT JOIN favorites f ON m.id = f.menu_id
  `;
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  if (searchTerm.trim()) { conditions.push('m.nama LIKE ?'); params.push(`%${searchTerm.trim()}%`); }
  if (category.trim() && category.trim().toLowerCase() !== 'semua') { conditions.push('LOWER(m.kategori) = LOWER(?)'); params.push(category.trim()); }

  if (conditions.length > 0) { query += ' WHERE ' + conditions.join(' AND '); }
  
  switch (sortBy) {
    case 'nama-az': query += ' ORDER BY m.nama ASC'; break;
    case 'nama-za': query += ' ORDER BY m.nama DESC'; break;
    case 'terlama': query += ' ORDER BY m.id ASC'; break;
    case 'terbaru': default: query += ' ORDER BY m.id DESC'; break;
  }

  try {
    const allRowsFromDB = await db.getAllAsync<any>(query, ...params);
    return allRowsFromDB.map(row => ({
      id: row.id,
      nama: row.nama,
      ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
      kategori: row.kategori,
      tanggal: row.tanggal,
      isFavorite: row.isFavorite === 1,
    }));
  } catch (error) {
    console.error('[DB] Gagal mengambil daftar menu:', error);
    return [];
  }
};

export const getUniqueCategories = async (): Promise<string[]> => {
  try {
    const rows = await db.getAllAsync<{ kategori: string | null }>('SELECT DISTINCT kategori FROM menu WHERE kategori IS NOT NULL AND kategori != "" ORDER BY kategori ASC');
    return rows.map(row => row.kategori).filter(kategori => !!kategori) as string[];
  } catch (error) {
    console.error('[DB] Gagal mengambil kategori unik:', error);
    return [];
  }
};

export const getMenuItemById = async (id: number): Promise<MenuItem | null> => {
  const query = `
      SELECT m.*, CASE WHEN f.menu_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite
      FROM menu m
      LEFT JOIN favorites f ON m.id = f.menu_id
      WHERE m.id = ?
    `;
  try {
    const row = await db.getFirstAsync<any>(query, id);
    if (row) {
      return {
        id: row.id,
        nama: row.nama,
        ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
        kategori: row.kategori,
        tanggal: row.tanggal,
        isFavorite: row.isFavorite === 1,
      };
    }
    return null;
  } catch (error) {
    console.error(`[DB] Gagal mengambil menu item dengan ID ${id}:`, error);
    return null;
  }
};

export const updateMenuItem = async (id: number, nama: string, ingredientsArray: StoredIngredient[], kategori: string): Promise<void> => {
  const ingredientsJSON = JSON.stringify(ingredientsArray);
  const tanggalModifikasi = new Date().toISOString();
  try {
    await db.runAsync('UPDATE menu SET nama = ?, ingredients = ?, kategori = ?, tanggal = ? WHERE id = ?', nama, ingredientsJSON, kategori, tanggalModifikasi, id);
  } catch (error) {
    console.error(`[DB] Gagal memperbarui resep dengan ID: ${id}:`, error);
    throw error;
  }
};

export const deleteMenuItem = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM menu WHERE id = ?', id);
  } catch (error) {
    console.error(`[DB] Gagal menghapus resep dengan ID: ${id}:`, error);
    throw error;
  }
};

export const getTotalRowCount = async (tableName: string): Promise<number> => {
  if (!/^[a-zA-Z_]+$/.test(tableName)) { throw new Error('Invalid table name'); }
  try {
    const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result ? result.count : 0;
  } catch (error) {
    console.error(`[DB] Gagal menghitung total baris untuk tabel ${tableName}:`, error);
    return 0;
  }
};

// --- FUNGSI FAVORIT ---

export const addFavorite = async (menu_id: number): Promise<void> => {
  try {
    await db.runAsync('INSERT OR IGNORE INTO favorites (menu_id) VALUES (?)', menu_id);
  } catch (error) {
    console.error(`[DB] Gagal menambahkan favorit:`, error);
    throw error;
  }
};

export const removeFavorite = async (menu_id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM favorites WHERE menu_id = ?', menu_id);
  } catch (error) {
    console.error(`[DB] Gagal menghapus favorit:`, error);
    throw error;
  }
};

// --- FUNGSI YANG SEBELUMNYA HILANG ---
export const getFavoriteMenuItems = async (): Promise<MenuItem[]> => {
  const query = `
    SELECT m.*, 1 as isFavorite
    FROM menu m
    JOIN favorites f ON m.id = f.menu_id
    ORDER BY m.id DESC;
  `;
  try {
    const favoriteRowsFromDB = await db.getAllAsync<any>(query);
    return favoriteRowsFromDB.map(row => ({
      id: row.id,
      nama: row.nama,
      ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
      kategori: row.kategori,
      tanggal: row.tanggal,
      isFavorite: true, // Semua yang diambil dari sini pasti favorit
    }));
  } catch (error) {
    console.error('[DB] Gagal mengambil daftar menu favorit:', error);
    return [];
  }
};