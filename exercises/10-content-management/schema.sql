-- 練習 10: 內容管理系統資料庫結構
-- SQLite 資料庫架構定義

-- =====================================================
-- 表：articles - 文章主體數據
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(title) > 0),
  content TEXT NOT NULL CHECK(length(content) > 0),
  author TEXT NOT NULL CHECK(length(author) > 0),
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 表：tags - 標籤管理
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL CHECK(length(name) > 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 表：article_tags - 文章與標籤的多對多關聯
-- =====================================================
CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- =====================================================
-- 索引優化：提升查詢性能
-- =====================================================

-- 文章狀態索引（用於按狀態過濾）
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- 文章創建時間索引（用於按時間排序）
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);

-- 文章更新時間索引（用於獲取最近更新）
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);

-- 標籤名稱索引（用於快速查找標籤）
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 文章-標籤關聯索引（用於快速查找文章的標籤）
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);

-- 標籤-文章關聯索引（用於快速查找標籤下的文章）
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);

-- =====================================================
-- 觸發器：自動更新 updated_at 欄位
-- =====================================================
CREATE TRIGGER IF NOT EXISTS update_articles_updated_at 
  AFTER UPDATE ON articles
  FOR EACH ROW
BEGIN
  UPDATE articles 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- =====================================================
-- 視圖：文章與標籤的聯合查詢
-- =====================================================
CREATE VIEW IF NOT EXISTS articles_with_tags AS
SELECT 
  a.id,
  a.title,
  a.content,
  a.author,
  a.status,
  a.created_at,
  a.updated_at,
  GROUP_CONCAT(t.name, ', ') as tags
FROM articles a
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id, a.title, a.content, a.author, a.status, a.created_at, a.updated_at;

-- =====================================================
-- 初始化測試數據（可選）
-- =====================================================

-- 插入範例標籤
INSERT OR IGNORE INTO tags (name) VALUES 
  ('技術'),
  ('教程'),
  ('MCP'),
  ('TypeScript'),
  ('資料庫'),
  ('後端'),
  ('前端'),
  ('開發工具');

-- 插入範例文章
INSERT OR IGNORE INTO articles (id, title, content, author, status) VALUES 
  (1, 'MCP協議介紹', '這是一篇關於Model Context Protocol的詳細介紹文章...', 'Claude', 'published'),
  (2, 'TypeScript最佳實踐', '本文介紹TypeScript開發的最佳實踐和常見模式...', 'Developer', 'published'),
  (3, 'SQLite整合指南', '如何在Node.js應用中整合SQLite資料庫...', 'Database Expert', 'draft');

-- 建立文章與標籤的關聯
INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES 
  (1, 3), -- MCP文章 -> MCP標籤
  (1, 1), -- MCP文章 -> 技術標籤
  (1, 2), -- MCP文章 -> 教程標籤
  (2, 4), -- TypeScript文章 -> TypeScript標籤
  (2, 1), -- TypeScript文章 -> 技術標籤
  (2, 2), -- TypeScript文章 -> 教程標籤
  (3, 5), -- SQLite文章 -> 資料庫標籤
  (3, 1), -- SQLite文章 -> 技術標籤
  (3, 6); -- SQLite文章 -> 後端標籤

-- =====================================================
-- 查詢範例：供開發參考
-- =====================================================

-- 範例1：查詢所有已發布的文章及其標籤
-- SELECT * FROM articles_with_tags WHERE status = 'published' ORDER BY created_at DESC;

-- 範例2：查詢特定標籤下的所有文章
-- SELECT DISTINCT a.* FROM articles a
-- JOIN article_tags at ON a.id = at.article_id
-- JOIN tags t ON at.tag_id = t.id
-- WHERE t.name = 'MCP' AND a.status = 'published';

-- 範例3：統計每個標籤下的文章數量
-- SELECT t.name, COUNT(at.article_id) as article_count
-- FROM tags t
-- LEFT JOIN article_tags at ON t.id = at.tag_id
-- GROUP BY t.id, t.name
-- ORDER BY article_count DESC;

-- 範例4：查詢最近更新的文章
-- SELECT * FROM articles 
-- WHERE status = 'published' 
-- ORDER BY updated_at DESC 
-- LIMIT 10;