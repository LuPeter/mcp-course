import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

/**
 * 練習 10: 資料庫整合層
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

// TODO 1: 實現資料庫連接工廠函數
// 提示：創建一個函數返回包含promisified方法的資料庫實例
export function createDatabaseConnection() {
  // TODO: 實現資料庫連接
  // 1. 創建sqlite3.Database實例
  // 2. 使用promisify包裝常用方法（all, get, run）
  // 3. 返回包含這些方法的對象
  
  throw new Error('TODO: 實現createDatabaseConnection函數');
}

// TODO 2: 實現資料庫初始化
// 提示：讀取schema.sql並執行SQL語句
export async function initializeDatabase(): Promise<void> {
  // TODO: 實現資料庫初始化
  // 1. 確保data目錄存在
  // 2. 讀取schema.sql文件
  // 3. 執行SQL語句創建表和索引
  // 4. 處理錯誤情況
  
  throw new Error('TODO: 實現initializeDatabase函數');
}

// =====================================================
// 文章相關操作
// =====================================================

// TODO 3: 實現創建文章
export async function createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  // TODO: 實現創建文章
  // 1. 驗證輸入數據
  // 2. 執行INSERT語句
  // 3. 返回新創建文章的ID
  // 4. 處理錯誤（如數據驗證失敗）
  
  throw new Error('TODO: 實現createArticle函數');
}

// TODO 4: 實現獲取文章列表
export async function getArticles(options?: {
  status?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'ASC' | 'DESC';
}): Promise<ArticleWithTags[]> {
  // TODO: 實現獲取文章列表
  // 1. 構建動態SQL查詢
  // 2. 處理過濾和排序選項
  // 3. 包含標籤信息
  // 4. 實現分頁功能
  
  throw new Error('TODO: 實現getArticles函數');
}

// TODO 5: 實現獲取單篇文章
export async function getArticleById(id: number): Promise<ArticleWithTags | null> {
  // TODO: 實現獲取單篇文章
  // 1. 根據ID查詢文章
  // 2. 包含相關標籤
  // 3. 如果不存在返回null
  
  throw new Error('TODO: 實現getArticleById函數');
}

// TODO 6: 實現更新文章
export async function updateArticle(id: number, updates: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  // TODO: 實現更新文章
  // 1. 驗證文章是否存在
  // 2. 構建動態UPDATE語句
  // 3. 自動更新updated_at欄位
  // 4. 返回是否成功更新
  
  throw new Error('TODO: 實現updateArticle函數');
}

// TODO 7: 實現刪除文章
export async function deleteArticle(id: number): Promise<boolean> {
  // TODO: 實現刪除文章
  // 1. 檢查文章是否存在
  // 2. 執行DELETE語句
  // 3. 相關的標籤關聯會被自動刪除（CASCADE）
  // 4. 返回是否成功刪除
  
  throw new Error('TODO: 實現deleteArticle函數');
}

// =====================================================
// 標籤相關操作
// =====================================================

// TODO 8: 實現獲取所有標籤
export async function getTags(): Promise<Tag[]> {
  // TODO: 實現獲取所有標籤
  // 1. 查詢所有標籤
  // 2. 按名稱排序
  // 3. 可選：包含每個標籤的文章數量
  
  throw new Error('TODO: 實現getTags函數');
}

// TODO 9: 實現創建或獲取標籤
export async function getOrCreateTag(name: string): Promise<number> {
  // TODO: 實現創建或獲取標籤
  // 1. 首先嘗試查找現有標籤
  // 2. 如果不存在則創建新標籤
  // 3. 返回標籤ID
  // 4. 處理重複名稱的情況
  
  throw new Error('TODO: 實現getOrCreateTag函數');
}

// TODO 10: 實現為文章分配標籤
export async function assignTagToArticle(articleId: number, tagId: number): Promise<boolean> {
  // TODO: 實現為文章分配標籤
  // 1. 檢查文章和標籤是否存在
  // 2. 檢查關聯是否已存在
  // 3. 插入新的關聯記錄
  // 4. 處理外鍵約束錯誤
  
  throw new Error('TODO: 實現assignTagToArticle函數');
}

// TODO 11: 實現移除文章標籤
export async function removeTagFromArticle(articleId: number, tagId: number): Promise<boolean> {
  // TODO: 實現移除文章標籤
  // 1. 檢查關聯是否存在
  // 2. 刪除關聯記錄
  // 3. 返回是否成功移除
  
  throw new Error('TODO: 實現removeTagFromArticle函數');
}

// TODO 12: 實現按標籤查詢文章
export async function getArticlesByTag(tagName: string): Promise<ArticleWithTags[]> {
  // TODO: 實現按標籤查詢文章
  // 1. 通過標籤名稱查詢相關文章
  // 2. 包含完整的文章和標籤信息
  // 3. 按創建時間倒序排列
  
  throw new Error('TODO: 實現getArticlesByTag函數');
}

// =====================================================
// 工具函數
// =====================================================

// TODO 13: 實現資料庫健康檢查
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  tablesExist: boolean;
  recordCount: {
    articles: number;
    tags: number;
    articleTags: number;
  };
}> {
  // TODO: 實現資料庫健康檢查
  // 1. 檢查資料庫連接
  // 2. 驗證表是否存在
  // 3. 統計各表記錄數量
  // 4. 返回健康狀態報告
  
  throw new Error('TODO: 實現checkDatabaseHealth函數');
}

// TODO 14: 實現清理函數
export async function cleanup(): Promise<void> {
  // TODO: 實現清理函數
  // 1. 關閉所有活動的資料庫連接
  // 2. 清理臨時文件
  // 3. 確保資源正確釋放
  
  throw new Error('TODO: 實現cleanup函數');
}

// =====================================================
// 錯誤處理輔助函數
// =====================================================

export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// TODO 15: 實現錯誤處理包裝器
export function handleDatabaseError(error: unknown): DatabaseError {
  // TODO: 實現錯誤處理
  // 1. 識別不同類型的SQLite錯誤
  // 2. 轉換為統一的DatabaseError格式
  // 3. 提供有意義的錯誤信息
  // 4. 記錄錯誤日誌
  
  throw new Error('TODO: 實現handleDatabaseError函數');
}

// =====================================================
// 導出初始化函數供main使用
// =====================================================

export async function initializeApp(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('✅ 資料庫初始化成功');
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    throw error;
  }
}