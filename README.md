## 主要功能

```mermaid
graph LR
  %% 样式设定
  classDef root fill:#FFD700,stroke:#333,stroke-width:2px,font-weight:bold
  classDef module fill:#ADD8E6,stroke:#333,stroke-width:1px
  classDef submodule fill:#E0FFFF,stroke:#888,stroke-width:1px

  %% 主模块
  gagagame[🎮 gagagame]:::root

  %% 一级模块
  配置模块[⚙️ 配置模块]:::module
  玩法模块[🕹️ 玩法模块]:::module
  结算模块[📊 结算模块]:::module

  %% 二级模块
  玩家配置[👤 玩家配置]:::submodule
  英雄配置[🧙‍♂️ 英雄配置]:::submodule
  分组系统[👥 分组系统]:::submodule
  卧底系统[🕵️‍♂️ 卧底系统]:::submodule
  结算系统[✅ 结算系统]:::submodule

  %% 连接关系
  gagagame --> 配置模块
  gagagame --> 玩法模块
  gagagame --> 结算模块

  配置模块 --> 玩家配置
  配置模块 --> 英雄配置

  玩法模块 --> 分组系统
  玩法模块 --> 卧底系统

  结算模块 --> 结算系统
```

## 安装和运行
### 环境要求
- Go 1.20 或更高版本
### 安装步骤
1. 克隆项目
    ```bash
     git clone <repository-url>
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
浏览器访问 `http://服务器IP:8008/gagaFamily/game`
