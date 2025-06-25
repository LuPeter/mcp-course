# 練習 1 測試說明

## 測試文件說明

### smoke.test.ts
基本冒煙測試，檢查服務器是否能啟動和回應。

### integration.test.ts  
整合測試，檢查工具功能是否正常。

## 注意事項

⚠️ **這些測試是基於完整實作設計的**

如果你正在練習階段：
- 骨架程式碼無法通過這些測試（這是正常的）
- 完成實作後應該能通過所有測試
- 可以用這些測試來驗證你的實作是否正確

## 測試完整實作

要測試參考解答：
```bash
# 先備份你的實作
cp exercises/01-hello-world/server.ts exercises/01-hello-world/server.backup.ts

# 複製完整解答
cp solutions/01-hello-world/server.ts exercises/01-hello-world/server.ts

# 重新編譯和測試
npm run build
npm run test:01

# 恢復你的實作
cp exercises/01-hello-world/server.backup.ts exercises/01-hello-world/server.ts
```

## 手動測試

即使實作不完整，你也可以嘗試編譯看看：
```bash
npm run build
```

這會幫助你發現語法錯誤和類型問題。