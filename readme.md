# Gaia 多平台汇编器

Gaia 是一个现代化的多平台汇编器项目，旨在为不同的目标平台提供统一、人类工程学的汇编语言前端。

## 🎯 项目概述

Gaia 项目包含以下核心组件：

- **gaia-frontend**: Rust 核心库，提供汇编器的主要功能
- **gaia-frontend-wasm32**: WebAssembly 前端，支持在浏览器和 Node.js 环境中运行
- **示例项目**: 包含 mini-go 和 mini-ts 等示例实现

## 🏗️ 项目结构

```
gaia.ts/
├── projects/
│   ├── gaia-frontend/          # Rust 核心库
│   └── gaia-frontend-wasm32/   # WASM32 前端包
├── examples/
│   ├── mini-go/               # Go 语言示例
│   └── mini-ts/               # TypeScript 示例
├── Cargo.toml                 # Rust 工作区配置
└── License.md                 # 项目许可证
```

## 🚀 快速开始

### 环境要求

- **Rust**: 最新稳定版本
- **Node.js**: 18.0 或更高版本
- **wasm32-wasip2 目标**: 用于 WASM 构建

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/nyar-vm/project-gaia
   cd gaia.ts
   ```

2. **添加 WASM 目标**
   ```bash
   rustup target add wasm32-wasip2
   ```

3. **构建项目**
   ```bash
   # 构建 Rust 核心库
   cargo build --release
   
   # 构建 WASM32 前端（可选）
   cd projects/gaia-frontend-wasm32
   npm install
   npm run build
   ```

## 📦 核心组件

### gaia-frontend

Rust 核心库，提供以下功能：

- **汇编器 (Assembler)**: 将汇编代码转换为目标平台代码
- **元数据 (Metadata)**: 处理汇编元数据和调试信息
- **工具函数 (Utils)**: 提供各种实用工具函数
- **简易测试 (Easy Test)**: 简化测试流程的工具

### gaia-frontend-wasm32

WebAssembly 前端包，特点：

- 基于 WebAssembly 技术，支持跨平台运行
- 提供 JavaScript/TypeScript API
- 支持在浏览器和 Node.js 环境中使用
- 包含完整的类型定义文件

## 🧪 示例项目

### mini-go

演示如何使用 Gaia 汇编器处理 Go 语言风格的语法：

- 词法分析器 (Lexer)
- 语法分析器 (Parser)
- 抽象语法树 (AST)
- 代码生成器 (Code Generator)

### mini-ts

TypeScript 版本的类似实现，展示不同语言前端的集成方式。

## 🔧 开发指南

### 运行测试

```bash
# Rust 测试
cargo test

# WASM32 前端测试
cd projects/gaia-frontend-wasm32
npm test

# 示例项目测试
cd examples/mini-go
npm test
```

### 构建发布版本

```bash
# Rust 发布构建
cargo build --release

# WASM32 发布包
cd projects/gaia-frontend-wasm32
npm run build
```

## 📄 许可证

本项目采用 MPL-2.0 许可证，详见 [License.md](License.md) 文件。

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📞 联系方式

- **项目团队**: Gaia Team <team@gaia-project.org>
- **仓库地址**: https://github.com/nyar-vm/project-gaia
- **文档地址**: https://docs.rs/gaia-frontend

---

**Gaia** - 让汇编语言开发更加人性化、现代化！