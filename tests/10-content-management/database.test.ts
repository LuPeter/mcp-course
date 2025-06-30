import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import {
  createDatabaseConnection,
  initializeDatabase,
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getTags,
  getOrCreateTag,
  assignTagToArticle,
  removeTagFromArticle,
  getArticlesByTag,
  checkDatabaseHealth,
  cleanup,
  DatabaseError,
  Article
} from '../../solutions/10-content-management/database.js';

/**
 * 練習 10 資料庫層測試
 * 
 * 測試範圍：
 * - 資料庫初始化
 * - 文章CRUD操作
 * - 標籤管理
 * - 關聯關係處理
 * - 錯誤處理
 * - 數據驗證
 */

// 測試資料庫路徑
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_content.db');

describe('資料庫層測試', () => {
  beforeAll(async () => {
    // 確保測試目錄存在
    await fs.mkdir(path.dirname(TEST_DB_PATH), { recursive: true });
  });

  beforeEach(async () => {
    // 每個測試前清理測試資料庫
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch (error) {
      // 檔案不存在時忽略錯誤
    }
    
    // 重新初始化資料庫
    await initializeDatabase();
  });

  afterEach(async () => {
    // 清理資源
    await cleanup();
  });

  afterAll(async () => {
    // 清理測試檔案
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch (error) {
      // 忽略錯誤
    }
  });

  describe('資料庫初始化', () => {
    test('應該成功初始化資料庫結構', async () => {
      const health = await checkDatabaseHealth();
      
      expect(health.connected).toBe(true);
      expect(health.tablesExist).toBe(true);
    });

    test('應該創建所有必要的表', async () => {
      const db = createDatabaseConnection();
      try {
        const tables = await db.all(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        );
        
        const tableNames = tables.map((table: any) => table.name);
        expect(tableNames).toContain('articles');
        expect(tableNames).toContain('tags');
        expect(tableNames).toContain('article_tags');
      } finally {
        await db.close();
      }
    });

    test('應該創建視圖', async () => {
      const db = createDatabaseConnection();
      try {
        const views = await db.all(
          "SELECT name FROM sqlite_master WHERE type='view'"
        );
        
        const viewNames = views.map((view: any) => view.name);
        expect(viewNames).toContain('articles_with_tags');
      } finally {
        await db.close();
      }
    });
  });

  describe('文章CRUD操作', () => {
    describe('創建文章', () => {
      test('應該成功創建文章', async () => {
        const article = {
          title: '測試文章',
          content: '這是測試內容',
          author: '測試作者',
          status: 'draft' as const
        };

        const id = await createArticle(article);
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
      });

      test('應該拒絕空標題', async () => {
        const article = {
          title: '',
          content: '測試內容',
          author: '測試作者',
          status: 'draft' as const
        };

        await expect(createArticle(article)).rejects.toThrow(DatabaseError);
      });

      test('應該拒絕空內容', async () => {
        const article = {
          title: '測試標題',
          content: '',
          author: '測試作者',
          status: 'draft' as const
        };

        await expect(createArticle(article)).rejects.toThrow(DatabaseError);
      });

      test('應該拒絕空作者', async () => {
        const article = {
          title: '測試標題',
          content: '測試內容',
          author: '',
          status: 'draft' as const
        };

        await expect(createArticle(article)).rejects.toThrow(DatabaseError);
      });
    });

    describe('讀取文章', () => {
      let articleId: number;

      beforeEach(async () => {
        articleId = await createArticle({
          title: '測試文章',
          content: '測試內容',
          author: '測試作者',
          status: 'published'
        });
      });

      test('應該能根據ID獲取文章', async () => {
        const article = await getArticleById(articleId);
        
        expect(article).not.toBeNull();
        expect(article!.id).toBe(articleId);
        expect(article!.title).toBe('測試文章');
        expect(article!.content).toBe('測試內容');
        expect(article!.author).toBe('測試作者');
        expect(article!.status).toBe('published');
      });

      test('應該對不存在的ID返回null', async () => {
        const article = await getArticleById(99999);
        expect(article).toBeNull();
      });

      test('應該拒絕無效的ID', async () => {
        await expect(getArticleById(-1)).rejects.toThrow(DatabaseError);
        await expect(getArticleById(0)).rejects.toThrow(DatabaseError);
      });

      test('應該獲取文章列表', async () => {
        // 創建多篇文章
        await createArticle({
          title: '文章2',
          content: '內容2',
          author: '作者2',
          status: 'draft'
        });

        const articles = await getArticles();
        expect(articles.length).toBeGreaterThanOrEqual(2);
      });

      test('應該支援狀態過濾', async () => {
        await createArticle({
          title: '草稿文章',
          content: '草稿內容',
          author: '作者',
          status: 'draft'
        });

        const publishedArticles = await getArticles({ status: 'published' });
        const draftArticles = await getArticles({ status: 'draft' });

        expect(publishedArticles.length).toBe(1);
        expect(draftArticles.length).toBe(1);
        expect(publishedArticles[0].status).toBe('published');
        expect(draftArticles[0].status).toBe('draft');
      });

      test('應該支援分頁', async () => {
        // 創建多篇文章
        for (let i = 0; i < 5; i++) {
          await createArticle({
            title: `文章${i}`,
            content: `內容${i}`,
            author: `作者${i}`,
            status: 'published'
          });
        }

        const page1 = await getArticles({ limit: 2, offset: 0 });
        const page2 = await getArticles({ limit: 2, offset: 2 });

        expect(page1.length).toBe(2);
        expect(page2.length).toBe(2);
        expect(page1[0].id).not.toBe(page2[0].id);
      });
    });

    describe('更新文章', () => {
      let articleId: number;

      beforeEach(async () => {
        articleId = await createArticle({
          title: '原始標題',
          content: '原始內容',
          author: '原始作者',
          status: 'draft'
        });
      });

      test('應該能更新文章標題', async () => {
        const success = await updateArticle(articleId, { title: '新標題' });
        expect(success).toBe(true);

        const article = await getArticleById(articleId);
        expect(article!.title).toBe('新標題');
        expect(article!.content).toBe('原始內容'); // 其他欄位不變
      });

      test('應該能更新多個欄位', async () => {
        const success = await updateArticle(articleId, {
          title: '新標題',
          content: '新內容',
          status: 'published'
        });
        expect(success).toBe(true);

        const article = await getArticleById(articleId);
        expect(article!.title).toBe('新標題');
        expect(article!.content).toBe('新內容');
        expect(article!.status).toBe('published');
        expect(article!.author).toBe('原始作者'); // 未更新的欄位保持不變
      });

      test('應該拒絕更新不存在的文章', async () => {
        await expect(updateArticle(99999, { title: '新標題' }))
          .rejects.toThrow(DatabaseError);
      });

      test('應該拒絕空的更新值', async () => {
        await expect(updateArticle(articleId, { title: '' }))
          .rejects.toThrow(DatabaseError);
      });
    });

    describe('刪除文章', () => {
      let articleId: number;

      beforeEach(async () => {
        articleId = await createArticle({
          title: '要刪除的文章',
          content: '要刪除的內容',
          author: '作者',
          status: 'draft'
        });
      });

      test('應該能刪除文章', async () => {
        const success = await deleteArticle(articleId);
        expect(success).toBe(true);

        const article = await getArticleById(articleId);
        expect(article).toBeNull();
      });

      test('刪除不存在的文章應該返回false', async () => {
        const success = await deleteArticle(99999);
        expect(success).toBe(false);
      });

      test('應該級聯刪除相關的標籤關聯', async () => {
        // 創建標籤並關聯
        const tagId = await getOrCreateTag('測試標籤');
        await assignTagToArticle(articleId, tagId);

        // 刪除文章
        await deleteArticle(articleId);

        // 檢查關聯是否被刪除
        const db = createDatabaseConnection();
        try {
          const associations = await db.all(
            'SELECT * FROM article_tags WHERE article_id = ?',
            [articleId]
          );
          expect(associations.length).toBe(0);
        } finally {
          await db.close();
        }
      });
    });
  });

  describe('標籤管理', () => {
    describe('標籤CRUD', () => {
      test('應該能創建新標籤', async () => {
        const tagId = await getOrCreateTag('新標籤');
        expect(typeof tagId).toBe('number');
        expect(tagId).toBeGreaterThan(0);
      });

      test('應該返回已存在標籤的ID', async () => {
        const tagId1 = await getOrCreateTag('重複標籤');
        const tagId2 = await getOrCreateTag('重複標籤');
        
        expect(tagId1).toBe(tagId2);
      });

      test('應該拒絕空標籤名稱', async () => {
        await expect(getOrCreateTag('')).rejects.toThrow(DatabaseError);
        await expect(getOrCreateTag('   ')).rejects.toThrow(DatabaseError);
      });

      test('應該獲取所有標籤', async () => {
        await getOrCreateTag('標籤1');
        await getOrCreateTag('標籤2');
        await getOrCreateTag('標籤3');

        const tags = await getTags();
        expect(tags.length).toBeGreaterThanOrEqual(3);
        
        const tagNames = tags.map(tag => tag.name);
        expect(tagNames).toContain('標籤1');
        expect(tagNames).toContain('標籤2');
        expect(tagNames).toContain('標籤3');
      });
    });

    describe('標籤關聯', () => {
      let articleId: number;
      let tagId: number;

      beforeEach(async () => {
        articleId = await createArticle({
          title: '測試文章',
          content: '測試內容',
          author: '測試作者',
          status: 'draft'
        });
        tagId = await getOrCreateTag('測試標籤');
      });

      test('應該能為文章分配標籤', async () => {
        const success = await assignTagToArticle(articleId, tagId);
        expect(success).toBe(true);

        // 驗證關聯已創建
        const article = await getArticleById(articleId);
        expect(article!.tags).toContain('測試標籤');
      });

      test('重複分配同一標籤應該成功', async () => {
        await assignTagToArticle(articleId, tagId);
        const success = await assignTagToArticle(articleId, tagId);
        expect(success).toBe(true);
      });

      test('應該拒絕無效的文章ID或標籤ID', async () => {
        await expect(assignTagToArticle(-1, tagId)).rejects.toThrow(DatabaseError);
        await expect(assignTagToArticle(articleId, -1)).rejects.toThrow(DatabaseError);
        await expect(assignTagToArticle(99999, tagId)).rejects.toThrow(DatabaseError);
        await expect(assignTagToArticle(articleId, 99999)).rejects.toThrow(DatabaseError);
      });

      test('應該能移除文章標籤', async () => {
        await assignTagToArticle(articleId, tagId);
        
        const success = await removeTagFromArticle(articleId, tagId);
        expect(success).toBe(true);

        const article = await getArticleById(articleId);
        expect(article!.tags).not.toContain('測試標籤');
      });

      test('移除不存在的關聯應該返回false', async () => {
        const success = await removeTagFromArticle(articleId, tagId);
        expect(success).toBe(false);
      });
    });

    describe('按標籤查詢', () => {
      test('應該能按標籤查詢文章', async () => {
        // 創建文章和標籤
        const articleId1 = await createArticle({
          title: '文章1',
          content: '內容1',
          author: '作者1',
          status: 'published'
        });
        
        const articleId2 = await createArticle({
          title: '文章2',
          content: '內容2',
          author: '作者2',
          status: 'published'
        });

        const tagId = await getOrCreateTag('共同標籤');
        await assignTagToArticle(articleId1, tagId);
        await assignTagToArticle(articleId2, tagId);

        // 查詢該標籤下的文章
        const articles = await getArticlesByTag('共同標籤');
        
        expect(articles.length).toBe(2);
        const titles = articles.map(article => article.title);
        expect(titles).toContain('文章1');
        expect(titles).toContain('文章2');
      });

      test('查詢不存在的標籤應該返回空數組', async () => {
        const articles = await getArticlesByTag('不存在的標籤');
        expect(articles.length).toBe(0);
      });

      test('應該拒絕空標籤名稱', async () => {
        await expect(getArticlesByTag('')).rejects.toThrow(DatabaseError);
      });
    });
  });

  describe('資料庫健康檢查', () => {
    test('應該返回正確的健康狀態', async () => {
      // 創建一些測試數據
      const articleId = await createArticle({
        title: '測試文章',
        content: '測試內容',
        author: '測試作者',
        status: 'draft'
      });
      const tagId = await getOrCreateTag('測試標籤');
      await assignTagToArticle(articleId, tagId);

      const health = await checkDatabaseHealth();
      
      expect(health.connected).toBe(true);
      expect(health.tablesExist).toBe(true);
      expect(health.recordCount.articles).toBeGreaterThan(0);
      expect(health.recordCount.tags).toBeGreaterThan(0);
      expect(health.recordCount.articleTags).toBeGreaterThan(0);
    });
  });

  describe('錯誤處理', () => {
    test('DatabaseError應該包含正確的錯誤信息', () => {
      const error = new DatabaseError('測試錯誤', 'TEST_CODE');
      
      expect(error.message).toBe('測試錯誤');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('DatabaseError');
    });

    test('應該正確處理SQLite錯誤', async () => {
      // 創建衝突的唯一約束錯誤
      await getOrCreateTag('唯一標籤');
      
      // 直接插入重複的標籤名稱會被getOrCreateTag處理
      // 這裡測試其他類型的錯誤處理
      const db = createDatabaseConnection();
      try {
        // 嘗試在不存在的表上執行操作
        await db.run('INSERT INTO non_existent_table (name) VALUES (?)', ['test']);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      } finally {
        await db.close();
      }
    });
  });

  describe('數據完整性', () => {
    test('文章標題、內容、作者應該正確保存和讀取', async () => {
      const articleData = {
        title: '包含特殊字符的標題！@#$%^&*()',
        content: '包含換行\n和特殊字符的內容：<>&"\'\x00',
        author: '包含Unicode的作者名：中文、🎉',
        status: 'published' as const
      };

      const id = await createArticle(articleData);
      const savedArticle = await getArticleById(id);

      expect(savedArticle!.title).toBe(articleData.title);
      expect(savedArticle!.content).toBe(articleData.content);
      expect(savedArticle!.author).toBe(articleData.author);
      expect(savedArticle!.status).toBe(articleData.status);
    });

    test('時間戳應該自動設置', async () => {
      const beforeCreate = new Date();
      
      const id = await createArticle({
        title: '時間測試',
        content: '內容',
        author: '作者',
        status: 'draft'
      });

      const article = await getArticleById(id);
      const afterCreate = new Date();

      expect(article!.created_at).toBeDefined();
      expect(article!.updated_at).toBeDefined();
      
      const createdAt = new Date(article!.created_at!);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    test('更新應該自動更新updated_at', async () => {
      const id = await createArticle({
        title: '原標題',
        content: '原內容',
        author: '作者',
        status: 'draft'
      });

      const originalArticle = await getArticleById(id);
      
      // 等待一小段時間確保時間戳不同
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await updateArticle(id, { title: '新標題' });
      const updatedArticle = await getArticleById(id);

      expect(updatedArticle!.updated_at).not.toBe(originalArticle!.updated_at);
      expect(new Date(updatedArticle!.updated_at!).getTime())
        .toBeGreaterThan(new Date(originalArticle!.updated_at!).getTime());
    });
  });
});