# Gaia 多平台汇编器 - WebAssembly 前端

Gaia 前端 WASM32 包是 Gaia 多平台汇编器的 WebAssembly 实现，提供在浏览器和 Node.js 环境中运行的汇编器功能。

## 🎯 功能特性

### 核心能力

- 🌐 **跨平台支持**: 基于 WebAssembly，可在任何支持 WASM 的环境中运行
- 🚀 **高性能**: Rust 编译的 WebAssembly 提供接近原生的性能
- 📦 **npm 包**: 作为 npm 包发布，易于集成到 JavaScript/TypeScript 项目
- 🎯 **类型安全**: 提供完整的 TypeScript 类型定义

### 支持功能

- 汇编代码编译
- 元数据处理
- 工具函数支持
- 简易测试框架

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @nyar/gaia-assembler-wasm32

# 使用 yarn
yarn add @nyar/gaia-assembler-wasm32

# 使用 pnpm
pnpm add @nyar/gaia-assembler-wasm32
```

### 基本使用

```typescript
// ES 模块导入
import { Assembler, Metadata, Utils } from '@nyar/gaia-assembler-wasm32';

// CommonJS 导入
const { Assembler, Metadata, Utils } = require('@nyar/gaia-assembler-wasm32');

// 使用汇编器
const assembler = new Assembler();
const result = assembler.compile('your assembly code here');

// 处理元数据
const metadata = new Metadata();
const meta = metadata.extract(result);

// 使用工具函数
const utils = new Utils();
const processed = utils.processString('input text');
```

### 浏览器使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>Gaia Assembler Demo</title>
</head>
<body>
    <script type="module">
        import { Assembler } from '@nyar/gaia-assembler-wasm32';
        
        const assembler = new Assembler();
        const result = assembler.compile('assembly code');
        console.log(result);
    </script>
</body>
</html>
```

## 📁 项目结构

```
gaia-frontend-wasm32/
├── dist/                    # 构建输出目录
│   ├── gaia_frontend.js     # 主要 JavaScript 文件
│   ├── gaia_frontend.d.ts # TypeScript 类型定义
│   └── ...                  # 其他构建文件
├── tests/                   # 测试文件
│   ├── compiler.test.ts     # 编译器测试
│   └── load_assembler.test.ts # 加载测试
├── node_modules/            # 依赖包
├── package.json             # 包配置
├── vitest.config.ts         # Vitest 测试配置
├── readme.md                # 本文档
└── .npmignore               # npm 忽略文件
```

## 🔧 开发指南

### 环境要求

- Node.js 18.0 或更高版本
- Rust 工具链（用于构建 WASM）
- wasm32-wasip2 目标

### 本地开发

```bash
# 克隆项目
git clone https://github.com/nyar-vm/project-gaia
cd gaia.ts/projects/gaia-frontend-wasm32

# 安装依赖
npm install

# 构建 WASM 模块
npm run build:wasm

# 生成 JavaScript 绑定
npm run build:js

# 完整构建
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并显示 UI
npm run dev

# 生成测试覆盖率报告
npm run coverage
```

## 📋 API 参考

### Assembler 类

```typescript
class Assembler {
    compile(code: string): CompilationResult;
    validate(code: string): ValidationResult;
    getVersion(): string;
}
```

### Metadata 类

```typescript
class Metadata {
    extract(result: CompilationResult): MetadataInfo;
    getDebugInfo(): DebugInfo;
}
```

### Utils 类

```typescript
class Utils {
    processString(input: string): string;
    validateSyntax(code: string): boolean;
}
```

## 🛠️ 构建流程

### 构建步骤

1. **编译 Rust 到 WebAssembly**
   ```bash
   cargo build --target wasm32-wasip2 --release
   ```

2. **生成 JavaScript 绑定**
   ```bash
   jco transpile ../../target/wasm32-wasip2/release/gaia_frontend.wasm -o dist
   ```

3. **类型定义生成**
   自动生成的 TypeScript 定义文件包含所有导出的类和函数。

### npm 脚本

```json
{
    "build:wasm": "cargo build --target wasm32-wasip2 --release",
    "build:js": "jco transpile ../../target/wasm32-wasip2/release/gaia_frontend.wasm -o dist",
    "build": "npm run build:wasm && npm run build:js",
    "test": "vitest run",
    "coverage": "vitest run --coverage",
    "dev": "vitest"
}
```

## 📦 发布配置

### package.json 关键配置

```json
{
    "name": "@nyar/gaia-assembler-wasm32",
    "version": "0.1.0",
    "description": "Gaia Multi-Platform Assembler - WASM32 Frontend",
    "main": "./dist/gaia_frontend.js",
    "types": "./dist/gaia_frontend.d.ts",
    "files": ["dist/**/*"],
    "keywords": [
        "gaia", "assembler", "webassembly", "wasm", 
        "multi-platform", "compiler", "frontend"
    ]
}
```

## 🔗 相关项目

- **[gaia-frontend](../gaia-frontend)**: Rust 核心库
- **[project-gaia](https://github.com/nyar-vm/project-gaia)**: 主项目仓库
- **[mini-go](../../examples/mini-go)**: Go 语言示例
- **[mini-ts](../../examples/mini-ts)**: TypeScript 示例

## 📄 许可证

本项目采用 MIT 许可证，详见项目根目录的 [License.md](../../License.md) 文件。

## 🤝 贡献

欢迎贡献代码和反馈！请通过以下方式参与：

1. 提交 GitHub Issue 报告问题
2. 创建 Pull Request 贡献代码
3. 改进文档和示例
4. 分享使用经验和最佳实践

## 📞 支持

获取帮助和支持：

- **GitHub Issues**: https://github.com/nyar-vm/project-gaia/issues
- **项目文档**: https://docs.rs/gaia-frontend
- **npm 包页面**: https://www.npmjs.com/package/@nyar/gaia-assembler-wasm32

---

**Gaia WASM32 Frontend** - 让 Gaia 汇编器在 Web 环境中发挥强大功能！