# 王者荣耀5v5比赛系统

一个智能的王者荣耀5v5比赛管理系统，支持玩家管理、团队分配、分路分配和英雄选择，确保比赛公平性和团队平衡。

## ✨ 主要功能

### 🎮 客户端功能
- **玩家管理**: 添加、删除玩家，支持性别标记
- **智能团队分配**: 自动将10人分成2组，确保女生人数均等
- **分路分配**: 随机分配分路，确保每个分路不重复
- **英雄选择**: 根据分路提供相应英雄供选择
- **结果展示**: 清晰展示每个玩家的分路和英雄

### 🔧 管理端功能
- **玩家管理**: 添加、删除、编辑玩家，支持禁用英雄列表
- **英雄配置管理**: 管理每个分路的英雄池
- **本地配置**: 使用本地JSON文件维护英雄配置
- **配置保存/加载**: 支持配置的保存和加载
- **系统状态监控**: 实时监控服务器和配置状态

## 🎨 UI特色

### 黑金配色设计
- **主色调**: 黑色背景 (#0a0a0a, #1a1a1a, #2a2a2a)
- **强调色**: 金色 (#ffd700, #ffed4e)
- **文字色**: 白色和灰色 (#fff, #b8b8b8)
- **动画效果**: 金色渐变和发光效果

### 现代化设计
- **渐变背景**: 采用黑色渐变背景，视觉效果深邃
- **毛玻璃效果**: 使用backdrop-filter实现现代毛玻璃效果
- **圆角设计**: 统一的圆角设计，界面更加友好
- **动画效果**: 丰富的hover和点击动画效果

### 移动端优化
- **响应式布局**: 完美适配手机、平板、桌面设备
- **触摸友好**: 按钮和交互元素适合触摸操作
- **字体优化**: 移动端字体大小优化，防止iOS缩放
- **网格自适应**: 英雄网格根据屏幕尺寸自动调整

### 交互体验
- **实时反馈**: 操作后立即显示结果和状态
- **加载动画**: 优雅的加载动画提示
- **错误处理**: 友好的错误提示和成功提示
- **键盘支持**: 支持回车键快速添加玩家

## 🚀 快速开始

### 环境要求
- Node.js 14.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd randomHero
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务器**
```bash
npm run start
```

4. **访问应用**
- 客户端: http://localhost:3000
- 管理端: http://localhost:3000/admin.html

## 📱 使用流程

### 客户端使用流程

1. **添加玩家**
   - 输入玩家姓名（最多10个字符）
   - 选择性别（男/女）
   - 点击"添加玩家"或按回车键
   - 最多可添加10名玩家

2. **分配团队**
   - 确保有10名玩家后，点击"分配团队"
   - 系统自动将玩家分成蓝队和红队
   - 确保两组女生人数一致

3. **分配分路**
   - 点击"分配分路"
   - 系统随机分配：上路、打野、中路、下路、辅助
   - 确保每个分路不重复

4. **选择英雄**
   - 点击"开始选择英雄"
   - 为每个玩家选择对应分路的英雄
   - 已选择的英雄会被标记为不可选

5. **查看结果**
   - 所有英雄选择完成后，查看最终比赛配置
   - 可点击"重新开始"重置所有数据

### 管理端使用流程

1. **系统状态检查**
   - 查看服务器状态、英雄数据状态、配置状态
   - 确保系统正常运行

2. **玩家管理**
   - 添加玩家：输入姓名、选择性别、设置禁用英雄
   - 编辑玩家：修改玩家信息或禁用英雄列表
   - 删除玩家：移除不需要的玩家

3. **英雄配置管理**
   - 生成默认配置：一键生成推荐英雄配置
   - 编辑配置：为每个分路添加/删除英雄
   - 保存配置：保存当前配置到本地JSON文件
   - 加载配置：从本地JSON文件加载配置

## 🛠️ 技术架构

### 前端技术
- **HTML5**: 语义化标签，良好的可访问性
- **CSS3**: 现代CSS特性，响应式设计
- **JavaScript ES6+**: 现代JavaScript语法
- **Fetch API**: 异步数据请求

### 后端技术
- **Node.js**: 服务器运行环境
- **Express.js**: Web框架
- **文件系统**: 本地JSON文件存储配置

### 设计模式
- **MVC架构**: 清晰的数据、视图、控制分离
- **RESTful API**: 标准的REST API设计
- **响应式设计**: 移动优先的设计理念

## 📁 项目结构

```
randomHero/
├── config/
│   └── heroes.json          # 英雄配置文件
├── public/
│   ├── index.html          # 客户端页面
│   ├── admin.html          # 管理端页面
│   ├── style.css           # 客户端样式
│   ├── admin.css           # 管理端样式
│   ├── script.js           # 客户端逻辑
│   └── admin.js            # 管理端逻辑
├── server.js               # 服务器主文件
├── package.json            # 项目配置
└── README.md              # 项目说明
```

## 📱 移动端适配

### 响应式断点
- **桌面端**: > 768px
- **平板端**: 768px - 480px
- **手机端**: < 480px

### 移动端优化
- **触摸目标**: 按钮最小44px，适合手指触摸
- **字体大小**: 防止iOS自动缩放
- **布局调整**: 单列布局，避免横向滚动
- **交互优化**: 简化操作流程，减少点击次数

### 性能优化
- **CSS优化**: 使用transform和opacity进行动画
- **图片优化**: 使用CSS渐变替代图片
- **代码分割**: 按需加载，减少初始加载时间

## 🎯 核心算法

### 团队分配算法
```javascript
// 确保女生人数均等分配
function assignTeams(players) {
    const females = players.filter(p => p.gender === 'female');
    const males = players.filter(p => p.gender === 'male');
    
    // 将女生平均分配到两队
    const team1Females = females.slice(0, Math.ceil(females.length / 2));
    const team2Females = females.slice(Math.ceil(females.length / 2));
    
    // 将男生分配到两队
    const team1Males = males.slice(0, Math.ceil(males.length / 2));
    const team2Males = males.slice(Math.ceil(males.length / 2));
    
    return {
        team1: [...team1Females, ...team1Males],
        team2: [...team2Females, ...team2Males]
    };
}
```

### 分路分配算法
```javascript
// 随机分配分路，确保不重复
function assignLanes(players) {
    const lanes = ['top', 'jungle', 'mid', 'bot', 'support'];
    const shuffledLanes = lanes.sort(() => Math.random() - 0.5);
    
    const assignments = {};
    players.forEach((player, index) => {
        assignments[player.id] = shuffledLanes[index];
    });
    
    return assignments;
}
```

## 🔧 API接口

### 玩家管理
- `GET /api/players` - 获取所有玩家
- `POST /api/players` - 添加玩家
- `DELETE /api/players/:id` - 删除玩家

### 团队分配
- `POST /api/teams/assign` - 分配团队

### 分路分配
- `POST /api/lanes/assign` - 分配分路

### 英雄选择
- `POST /api/heroes/select` - 选择英雄
- `GET /api/heroes/random/:lane` - 随机获取英雄

### 管理端接口
- `GET /api/admin/hero-config` - 获取英雄配置
- `POST /api/admin/hero-config` - 保存英雄配置
- `POST /api/admin/generate-config` - 生成默认配置
- `GET /api/admin/status` - 获取系统状态

## 🎨 样式系统

### 颜色方案
- **主色调**: #ffd700 (金色)
- **背景色**: #0a0a0a, #1a1a1a, #2a2a2a (黑色渐变)
- **文字色**: #fff (白色), #b8b8b8 (灰色)
- **强调色**: #ffd700 (金色)
- **警告色**: #8b0000 (深红色)

### 字体系统
- **主字体**: PingFang SC, Helvetica Neue, Arial
- **标题**: 粗体，金色渐变效果
- **正文**: 常规字重，良好可读性

### 间距系统
- **基础间距**: 8px
- **组件间距**: 15px, 20px, 25px
- **区域间距**: 30px

## 📋 英雄配置

### 配置文件位置
- `config/heroes.json` - 英雄配置文件

### 配置结构
```json
{
  "top": ["亚瑟", "吕布", "关羽", ...],
  "jungle": ["李白", "韩信", "赵云", ...],
  "mid": ["妲己", "安琪拉", "王昭君", ...],
  "bot": ["后羿", "鲁班七号", "孙尚香", ...],
  "support": ["蔡文姬", "大乔", "小乔", ...]
}
```

### 配置管理
- **生成默认配置**: 管理端一键生成推荐配置
- **手动编辑**: 支持在管理端手动添加/删除英雄
- **保存配置**: 自动保存到本地JSON文件
- **加载配置**: 服务器启动时自动加载配置

## 🚀 部署说明

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### Docker部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢所有贡献者的支持
- 感谢王者荣耀游戏提供的灵感
- 感谢开源社区的技术支持

---

**注意**: 这是一个娱乐性质的项目，仅供学习和娱乐使用。请遵守相关法律法规和游戏规则。 