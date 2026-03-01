# AI News Navigator v2 TODO

- [x] 升级为 web-db-user 全栈应用
- [x] 修复 TypeScript 编译错误
- [x] 迁移 Home.tsx 到新的 tRPC 模板
- [x] 设计数据库 schema（papers、news、products、insights）
- [x] 实现后端 API 端点（tRPC）
- [x] 集成数据爬虫（arXiv、NewsAPI、Product Hunt）
- [x] 配置定时任务（每天自动更新，08:00 北京时间）
- [x] 单元测试（15/15 通过）
- [x] 种子数据填充
- [x] 保存检查点并发布
- [x] 最近一周模式：每板块默认显示3条，底部「查看全部 X 条」按钮展开剩余
- [x] 修复核心洞察未每日更新的 bug（调度器生成洞察时读取不到当天数据）
- [x] UI 优化：「最近一周」改为 🗓 图标，「今日动态」改为 ⚡ 图标
- [x] UI 优化：footer 添加作者信息（Syozz · syozz0124@gmail.com）
- [ ] 修复「今日动态」数据显示 0 的 bug：改为按 createdAt（入库时间）过滤
- [ ] 今日动态图标改为 ✨
- [x] Hero 区域背景替换为动态粒子流（Canvas 粒子网络 + 鼠标交互）
