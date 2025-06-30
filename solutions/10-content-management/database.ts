import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

/**
 * 練習 10: 資料庫整合層 - 完整實作
 * 
 * 這個模組負責所有資料庫相關操作，包括：
 * - 資料庫連接管理
 * - 基本CRUD操作
 * - 錯誤處理
 * - 資料驗證
 */

// =====================================================
// 類型定義
// =====================================================

export interface Article {
  id?: number;
  title: string;
  content: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id?: number;
  name: string;
  created_at?: string;
}

export interface ArticleWithTags extends Article {
  tags?: string;
}

// =====================================================
// 資料庫配置
// =====================================================

const DB_PATH = path.join(process.cwd(), 'data', 'content.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// 資料庫連接工廠函數
export function createDatabaseConnection() {
  const db = new sqlite3.Database(DB_PATH);
  
  return {
    all: promisify<string, any[], any[]>(db.all.bind(db)),
    get: promisify<string, any[], any>(db.get.bind(db)),
    run: promisify<string, any[], sqlite3.RunResult>(db.run.bind(db)),
    close: promisify<void>(db.close.bind(db))
  };
}

// 資料庫初始化
export async function initializeDatabase(): Promise<void> {
  try {
    // 確保data目錄存在
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    
    // 讀取schema.sql文件
    const schema = await fs.readFile(SCHEMA_PATH, 'utf8');
    
    // 執行SQL語句創建表和索引
    const db = createDatabaseConnection();
    try {
      // 分割SQL語句並逐個執行
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        await db.run(statement);
      }
      
      console.log('✅ 資料庫結構初始化完成');
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    throw handleDatabaseError(error);
  }
}

// =====================================================
// 文章相關操作
// =====================================================

// 創建文章
export async function createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const db = createDatabaseConnection();
  try {
    // 驗證輸入數據
    if (!article.title?.trim()) {
      throw new DatabaseError('文章標題不能為空', 'VALIDATION_ERROR');
    }
    if (!article.content?.trim()) {
      throw new DatabaseError('文章內容不能為空', 'VALIDATION_ERROR');
    }
    if (!article.author?.trim()) {
      throw new DatabaseError('文章作者不能為空', 'VALIDATION_ERROR');
    }
    
    const result = await db.run(
      'INSERT INTO articles (title, content, author, status) VALUES (?, ?, ?, ?)',
      [article.title.trim(), article.content.trim(), article.author.trim(), article.status || 'draft']
    );
    
    if (!result.lastID) {
      throw new DatabaseError('創建文章失敗', 'INSERT_FAILED');
    }
    
    return result.lastID;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 獲取文章列表
export async function getArticles(options?: {
  status?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'ASC' | 'DESC';
}): Promise<ArticleWithTags[]> {
  const db = createDatabaseConnection();
  try {
    const {
      status,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = options || {};
    
    let query = 'SELECT * FROM articles_with_tags';
    const params: any[] = [];
    
    // 添加狀態過濾
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    // 添加排序
    query += ` ORDER BY ${orderBy} ${orderDirection}`;
    
    // 添加分頁
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const articles = await db.all(query, params);
    return articles;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 獲取單篇文章
export async function getArticleById(id: number): Promise<ArticleWithTags | null> {
  const db = createDatabaseConnection();
  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw new DatabaseError('無效的文章ID', 'VALIDATION_ERROR');
    }
    
    const article = await db.get(
      'SELECT * FROM articles_with_tags WHERE id = ?',
      [id]
    );
    
    return article || null;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 更新文章
export async function updateArticle(id: number, updates: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const db = createDatabaseConnection();
  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw new DatabaseError('無效的文章ID', 'VALIDATION_ERROR');
    }
    
    // 檢查文章是否存在
    const existingArticle = await db.get('SELECT id FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      throw new DatabaseError('文章不存在', 'NOT_FOUND');
    }
    
    // 構建動態UPDATE語句
    const setClauses: string[] = [];
    const params: any[] = [];
    
    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        throw new DatabaseError('文章標題不能為空', 'VALIDATION_ERROR');
      }
      setClauses.push('title = ?');
      params.push(updates.title.trim());
    }
    
    if (updates.content !== undefined) {
      if (!updates.content.trim()) {
        throw new DatabaseError('文章內容不能為空', 'VALIDATION_ERROR');
      }
      setClauses.push('content = ?');
      params.push(updates.content.trim());
    }
    
    if (updates.author !== undefined) {
      if (!updates.author.trim()) {
        throw new DatabaseError('文章作者不能為空', 'VALIDATION_ERROR');
      }
      setClauses.push('author = ?');
      params.push(updates.author.trim());
    }
    
    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      params.push(updates.status);
    }
    
    if (setClauses.length === 0) {
      return true; // 沒有需要更新的欄位
    }
    
    // updated_at會由觸發器自動更新
    const query = `UPDATE articles SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(id);
    
    const result = await db.run(query, params);
    return (result.changes || 0) > 0;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 刪除文章
export async function deleteArticle(id: number): Promise<boolean> {
  const db = createDatabaseConnection();
  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw new DatabaseError('無效的文章ID', 'VALIDATION_ERROR');
    }
    
    // 檢查文章是否存在
    const existingArticle = await db.get('SELECT id FROM articles WHERE id = ?', [id]);
    if (!existingArticle) {
      return false; // 文章不存在，視為已刪除
    }
    
    const result = await db.run('DELETE FROM articles WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// =====================================================
// 標籤相關操作
// =====================================================

// 獲取所有標籤
export async function getTags(): Promise<Tag[]> {
  const db = createDatabaseConnection();
  try {
    const tags = await db.all(`
      SELECT t.*, COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      GROUP BY t.id, t.name, t.created_at
      ORDER BY t.name ASC
    `);
    return tags;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 創建或獲取標籤
export async function getOrCreateTag(name: string): Promise<number> {
  const db = createDatabaseConnection();
  try {
    if (!name?.trim()) {
      throw new DatabaseError('標籤名稱不能為空', 'VALIDATION_ERROR');
    }
    
    const normalizedName = name.trim();
    
    // 首先嘗試查找現有標籤
    const existingTag = await db.get('SELECT id FROM tags WHERE name = ?', [normalizedName]);
    
    if (existingTag) {
      return existingTag.id;
    }
    
    // 創建新標籤
    const result = await db.run('INSERT INTO tags (name) VALUES (?)', [normalizedName]);
    
    if (!result.lastID) {
      throw new DatabaseError('創建標籤失敗', 'INSERT_FAILED');
    }
    
    return result.lastID;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 為文章分配標籤
export async function assignTagToArticle(articleId: number, tagId: number): Promise<boolean> {
  const db = createDatabaseConnection();
  try {
    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw new DatabaseError('無效的文章ID', 'VALIDATION_ERROR');
    }
    if (!Number.isInteger(tagId) || tagId <= 0) {
      throw new DatabaseError('無效的標籤ID', 'VALIDATION_ERROR');
    }
    
    // 檢查文章和標籤是否存在
    const article = await db.get('SELECT id FROM articles WHERE id = ?', [articleId]);
    if (!article) {
      throw new DatabaseError('文章不存在', 'NOT_FOUND');
    }
    
    const tag = await db.get('SELECT id FROM tags WHERE id = ?', [tagId]);
    if (!tag) {
      throw new DatabaseError('標籤不存在', 'NOT_FOUND');
    }
    
    // 檢查關聯是否已存在
    const existingAssociation = await db.get(
      'SELECT 1 FROM article_tags WHERE article_id = ? AND tag_id = ?',
      [articleId, tagId]
    );
    
    if (existingAssociation) {
      return true; // 關聯已存在
    }
    
    // 插入新的關聯記錄
    const result = await db.run(
      'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
      [articleId, tagId]
    );
    
    return (result.changes || 0) > 0;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 移除文章標籤
export async function removeTagFromArticle(articleId: number, tagId: number): Promise<boolean> {
  const db = createDatabaseConnection();
  try {
    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw new DatabaseError('無效的文章ID', 'VALIDATION_ERROR');
    }
    if (!Number.isInteger(tagId) || tagId <= 0) {
      throw new DatabaseError('無效的標籤ID', 'VALIDATION_ERROR');
    }
    
    const result = await db.run(
      'DELETE FROM article_tags WHERE article_id = ? AND tag_id = ?',
      [articleId, tagId]
    );
    
    return (result.changes || 0) > 0;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// 按標籤查詢文章
export async function getArticlesByTag(tagName: string): Promise<ArticleWithTags[]> {
  const db = createDatabaseConnection();
  try {
    if (!tagName?.trim()) {
      throw new DatabaseError('標籤名稱不能為空', 'VALIDATION_ERROR');
    }
    
    const articles = await db.all(`
      SELECT DISTINCT a.*, GROUP_CONCAT(t2.name, ', ') as tags
      FROM articles a
      JOIN article_tags at ON a.id = at.article_id
      JOIN tags t ON at.tag_id = t.id
      LEFT JOIN article_tags at2 ON a.id = at2.article_id
      LEFT JOIN tags t2 ON at2.tag_id = t2.id
      WHERE t.name = ?
      GROUP BY a.id, a.title, a.content, a.author, a.status, a.created_at, a.updated_at
      ORDER BY a.created_at DESC
    `, [tagName.trim()]);
    
    return articles;
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    await db.close();
  }
}

// =====================================================
// 工具函數
// =====================================================

// 資料庫健康檢查
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  tablesExist: boolean;
  recordCount: {
    articles: number;
    tags: number;
    articleTags: number;
  };
}> {
  const db = createDatabaseConnection();
  try {
    // 檢查連接
    await db.get('SELECT 1');
    
    // 檢查表是否存在
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('articles', 'tags', 'article_tags')
    `);
    const tablesExist = tables.length === 3;
    
    // 統計記錄數量
    const articleCount = await db.get('SELECT COUNT(*) as count FROM articles');
    const tagCount = await db.get('SELECT COUNT(*) as count FROM tags');
    const articleTagCount = await db.get('SELECT COUNT(*) as count FROM article_tags');
    
    return {
      connected: true,
      tablesExist,
      recordCount: {
        articles: articleCount?.count || 0,
        tags: tagCount?.count || 0,
        articleTags: articleTagCount?.count || 0
      }
    };
  } catch (error) {
    return {
      connected: false,
      tablesExist: false,
      recordCount: {
        articles: 0,
        tags: 0,
        articleTags: 0
      }
    };
  } finally {
    await db.close();
  }
}

// 清理函數
export async function cleanup(): Promise<void> {
  // 在這個簡單實作中，每個操作都會自動關閉連接
  // 在更複雜的應用中，這裡會關閉連接池等資源
  console.log('🧹 資料庫資源清理完成');
}

// =====================================================
// 錯誤處理
// =====================================================

export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// 錯誤處理包裝器
export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }
  
  if (error instanceof Error) {
    // SQLite 特定錯誤處理
    if (error.message.includes('UNIQUE constraint')) {
      return new DatabaseError('數據已存在，不能重複', 'DUPLICATE_ERROR', error);
    }
    
    if (error.message.includes('FOREIGN KEY constraint')) {
      return new DatabaseError('關聯數據不存在或已被引用', 'FOREIGN_KEY_ERROR', error);
    }
    
    if (error.message.includes('NOT NULL constraint')) {
      return new DatabaseError('必填欄位不能為空', 'NOT_NULL_ERROR', error);
    }
    
    if (error.message.includes('no such table')) {
      return new DatabaseError('資料庫表不存在，請先初始化', 'TABLE_NOT_EXIST', error);
    }
    
    if (error.message.includes('database is locked')) {
      return new DatabaseError('資料庫被鎖定，請稍後重試', 'DATABASE_LOCKED', error);
    }
    
    return new DatabaseError(`資料庫操作失敗: ${error.message}`, 'DATABASE_ERROR', error);
  }
  
  return new DatabaseError('未知的資料庫錯誤', 'UNKNOWN_ERROR', error as Error);
}

// =====================================================
// 導出初始化函數
// =====================================================

export async function initializeApp(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('✅ 內容管理系統資料庫初始化成功');
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    throw error;
  }
}