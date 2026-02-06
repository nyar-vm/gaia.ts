# Gaia 前端核心库

Gaia 前端核心库是 Gaia 多平台汇编器的 Rust 实现，提供高性能、人类工程学的汇编语言处理功能。

## 🎯 功能特性

### 核心模块

- **汇编器 (assembler)**: 将汇编代码编译为目标平台代码
- **元数据 (metadata)**: 处理汇编元数据、调试信息和符号表
- **工具函数 (utils)**: 提供字符串处理、错误报告等实用功能
- **简易测试 (easy_test)**: 简化单元测试和集成测试流程

### 技术特点

- ⚡ **高性能**: 基于 Rust 语言，提供零成本抽象和内存安全
- 🌐 **跨平台**: 支持多种目标平台（CLR、JVM、PE、WASI 等）
- 🔧 **可扩展**: 模块化设计，易于扩展新的目标平台
- 📦 **WebAssembly 支持**: 可编译为 WASM，支持浏览器和 Node.js 环境

## 🚀 快速开始

### 环境要求

- Rust 1.70 或更高版本
- Cargo 包管理器

### 安装依赖

```bash
# 在项目根目录
cd ../..

# 构建核心库
cargo build --release
```

### 基本使用

```rust
// 在您的 Cargo.toml 中添加依赖
[dependencies]
gaia-frontend = { path = "path/to/gaia-frontend" }
```

```rust
use gaia_frontend::{assembler, metadata, utils};

fn main() {
    // 使用汇编器功能
    let result = assembler::compile_assembly("your assembly code");
    
    // 处理元数据
    let metadata = metadata::extract_metadata(&result);
    
    // 使用工具函数
    let processed = utils::process_string("input text");
}
```

## 📁 项目结构

```
gaia-frontend/
├── src/
│   ├── lib.rs          # 主库入口
│   ├── assembler.rs    # 汇编器实现
│   ├── metadata.rs     # 元数据处理
│   ├── utils.rs        # 工具函数
│   └── easy_test.rs    # 测试工具
├── tests/
│   └── main.rs         # 集成测试
├── wit/
│   ├── assembler.wit   # 汇编器接口定义
│   ├── metadata.wit    # 元数据接口定义
│   ├── utils.wit       # 工具函数接口定义
│   ├── easy-test.wit   # 测试接口定义
│   ├── gaia-assembly.wit # 主接口定义
│   └── types.wit       # 类型定义
├── Cargo.toml          # 项目配置
├── build.rs            # 构建脚本
└── readme.md           # 本文档
```

## 🔧 构建配置

### Cargo.toml 配置

```toml
[package]
name = "gaia-frontend"
version = "0.0.0"
edition = "2024"
license = "MPL-2.0"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wit-bindgen = "0.46"
gaia-assembler = { path = "../gaia-assembler" }
```

### 构建脚本 (build.rs)

构建脚本用于处理 WIT 接口定义文件和生成必要的绑定代码。

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
cargo test

# 运行特定模块测试
cargo test assembler
cargo test metadata
cargo test utils
```

### 测试覆盖率

```bash
# 生成测试覆盖率报告
cargo tarpaulin --out Html
```

## 📋 WIT 接口定义

本项目使用 WIT (WebAssembly Interface Types) 定义组件接口：

- **assembler.wit**: 定义汇编器相关的接口
- **metadata.wit**: 定义元数据处理接口
- **utils.wit**: 定义工具函数接口
- **easy-test.wit**: 定义测试相关接口

## 🔗 相关项目

- **[gaia-assembler](../gaia-assembler)**: Gaia 汇编器的核心实现
- **[gaia-frontend-wasm32](../gaia-frontend-wasm32)**: WebAssembly 前端包
- **[project-gaia](https://github.com/nyar-vm/project-gaia)**: 主项目仓库

## 📄 许可证

本项目采用 MPL-2.0 许可证，详见项目根目录的 [License.md](../../License.md) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！在贡献代码前，请：

1. 阅读项目的贡献指南
2. 确保代码通过所有测试
3. 遵循 Rust 编码规范
4. 更新相关文档

## 📞 支持

如遇到问题，请通过以下方式获取帮助：

- 提交 GitHub Issue
- 查看项目文档: https://docs.rs/gaia-frontend
- 联系项目团队: Gaia Team <team↯gaia-project.org>

---

**Gaia Frontend** - 为 Gaia 多平台汇编器提供强大、灵活的前端支持！