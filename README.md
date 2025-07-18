# gagaFamily

一个基于Go语言开发的多人游戏平台，主要提供分组和卧底游戏功能。

## 项目简介

gagaFamily是一个轻量级的Web游戏服务器，支持多人分组和卧底游戏玩法。项目采用Go语言开发，提供简洁的Web界面和RESTful API接口。

## 功能特性

### 🎮 分组系统
- **随机分组**: 从预设的玩家列表中随机选择5人组成队伍
- **性别平衡**: 确保每组包含2名女性和3名男性玩家
- **幸运男孩**: 从男性玩家中随机选择一名幸运玩家

### 🕵️ 卧底游戏
- **位置分配**: 为每个玩家随机分配游戏位置（对抗路、打野、中路、发育路、游走）
- **卧底机制**: 随机指定一名玩家作为卧底
- **队伍管理**: 支持队伍号生成和重置功能
- **IP追踪**: 基于IP地址管理玩家状态

## 技术栈

- **后端**: Go 1.20+
- **前端**: HTML5 + CSS3 + JavaScript
- **网络**: HTTP服务器
- **并发**: Go sync.Map用于线程安全的数据存储

## 项目结构

```
gagaFamily/
├── main.go              # 主程序入口，HTTP服务器配置
├── gaga.html            # 前端界面
├── go.mod               # Go模块配置
├── gameplay/            # 游戏逻辑模块
│   ├── group.go         # 分组系统实现
│   └── undercover.go    # 卧底游戏实现
└── README.md           # 项目说明文档
```

## 安装和运行

### 环境要求
- Go 1.20 或更高版本

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd gagaFamily
```

2. 安装依赖
```bash
go mod tidy
```

3. 运行项目
```bash
go run main.go
```

4. 访问应用
打开浏览器访问 `http://localhost:8008/gagaFamily/undercoverGame`

## API接口

### 分组系统
- `GET /gagaFamily/group/getGroup` - 获取随机分组
- `GET /gagaFamily/group/getLuckyBoy` - 获取幸运男孩

### 卧底游戏
- `GET /gagaFamily/undercoverGame/resetUndercover` - 重置游戏
- `GET /gagaFamily/undercoverGame/getUndercover` - 获取卧底身份

## 游戏规则

### 分组规则
- 每组5人，包含2名女性和3名男性
- 女性玩家：圈姐、真心、闪闪、47
- 男性玩家：柯镇恶、季富龙、方震、逍遥、小何、达芬奇

### 卧底游戏规则
- 5个游戏位置：对抗路、打野、中路、发育路、游走
- 随机指定一名玩家作为卧底
- 每个IP地址只能参与一次，避免重复抽取
- 支持队伍号管理，便于多组游戏

## 配置说明

### 服务器配置
- 默认端口：8008
- 支持跨域访问
- 静态文件服务

### 玩家配置
玩家列表可在 `gameplay/group.go` 中修改：
```go
var girlSlice = []string{"圈姐", "真心", "闪闪", "47"}
var boySlice = []string{"柯镇恶", "季富龙", "方震", "逍遥", "小何", "达芬奇"}
```

## 开发说明

### 添加新功能
1. 在 `gameplay/` 目录下创建新的游戏模块
2. 在 `main.go` 中注册新的HTTP路由
3. 更新前端界面以支持新功能

### 部署建议
- 使用反向代理（如Nginx）进行负载均衡
- 配置HTTPS以提高安全性
- 考虑使用数据库存储游戏状态（当前使用内存存储）

## 许可证

本项目采用开源许可证，具体许可证信息请查看项目根目录的LICENSE文件。

## 贡献

欢迎提交Issue和Pull Request来改进项目！

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者