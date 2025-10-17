# Mini-Go - Go 语言编译器示例

Mini-Go 是一个使用 Gaia 汇编器前端构建的 Go 语言子集编译器示例，展示了如何将 Go 风格的语法编译为 Gaia 汇编代码。

## 🎯 项目概述

Mini-Go 实现了 Go 语言的核心特性子集，包括：

- 包声明和函数定义
- 变量声明和赋值
- 基本数据类型（int, float64, bool, string）
- 控制流语句（if, for）
- 函数调用和递归
- 数学和逻辑运算
- 位运算

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- TypeScript 编译器
- Gaia WASM32 前端包

### 安装依赖

```bash
# 在项目目录
cd examples/mini-go

# 安装依赖
npm install

# 构建项目
npm run build
```

### 基本使用

```bash
# 编译 Go 文件
npm start test/hello.go

# 或者使用构建后的版本
node dist/index.js test/hello.go

# 详细输出模式
node dist/index.js test/hello.go --verbose
```

## 📁 项目结构

```
mini-go/
├── src/                    # 源代码目录
│   ├── index.ts           # 主入口文件
│   ├── lexer.ts           # 词法分析器
│   ├── parser.ts          # 语法分析器
│   ├── ast.ts             # 抽象语法树定义
│   ├── codegen.ts         # 代码生成器
│   └── lib.ts             # 主库文件
├── tests/                 # 测试文件
│   ├── basic.go           # 基础功能测试
│   ├── hello.go           # Hello World 示例
│   ├── struct.go          # 结构体示例
│   └── compiler.test.ts   # 编译器测试
├── dist/                  # 构建输出目录
├── node_modules/          # 依赖包
├── package.json           # 包配置
├── tsconfig.json          # TypeScript 配置
├── vitest.config.ts       # 测试配置
└── readme.md              # 本文档
```

## 🔧 核心组件

### 1. 词法分析器 (Lexer)

将 Go 源代码分解为词法单元（tokens）：

```go
// 输入源代码
func main() {
    var x int = 10
}

// 输出的 tokens
[
    { type: 'FUNCTION', value: 'func' },
    { type: 'IDENTIFIER', value: 'main' },
    { type: 'LPAREN', value: '(' },
    { type: 'RPAREN', value: ')' },
    { type: 'LBRACE', value: '{' },
    { type: 'VAR', value: 'var' },
    { type: 'IDENTIFIER', value: 'x' },
    { type: 'TYPE_INT', value: 'int' },
    { type: 'ASSIGN', value: '=' },
    { type: 'NUMBER', value: '10' },
    { type: 'RBRACE', value: '}' }
]
```

### 2. 语法分析器 (Parser)

将词法单元解析为抽象语法树（AST）：

```typescript
interface Program {
    packageName?: string;
    imports: ImportDeclaration[];
    functions: FunctionDeclaration[];
}

interface FunctionDeclaration {
    name: string;
    parameters: Parameter[];
    returnType?: string;
    body: Statement[];
}
```

### 3. 抽象语法树 (AST)

定义了 Go 语言结构的数据结构：

```typescript
// 语句类型
interface Statement {
    type: 'var_decl' | 'assignment' | 'if' | 'for' | 'return' | 'expression';
}

// 表达式类型
interface Expression {
    type: 'identifier' | 'literal' | 'binary_op' | 'function_call' | 'index_access';
}
```

### 4. 代码生成器 (CodeGen)

将 AST 转换为 Gaia 汇编代码：

```go
// Go 源代码
func add(a int, b int) int {
    return a + b
}

// 生成的 Gaia 汇编代码
function add: (int, int) -> int {
    load.local a
    load.local b
    add.int
    return
}
```

## 🧪 示例代码

### Hello World

```go
// test/hello.go
package main

func main() {
    println("Hello, World!")
}
```

### 递归函数

```go
// test/basic.go
func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}
```

### 变量和运算

```go
func main() {
    var x int = 10
    y := 20
    sum := x + y
    
    if sum > 25 {
        println("Sum is greater than 25")
    }
}
```

## 🛠️ 开发指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并监视文件变化
npm run test:watch

# 打开测试 UI
npm run test:ui

# 生成测试覆盖率报告
npm run coverage
```

### 编译特定示例

```bash
# 编译 Hello World
npm run compile:hello

# 编译结构体示例
npm run compile:struct

# 编译基础测试
npm run compile:basic
```

### 开发模式

```bash
# 使用 ts-node 直接运行 TypeScript 代码
npm run dev test/hello.go
```

## 📋 支持的 Go 特性

### ✅ 已支持

- 包声明 (`package main`)
- 函数定义 (`func name() {}`)
- 变量声明 (`var x int = 10`, `y := 20`)
- 基本数据类型 (`int`, `float64`, `bool`, `string`)
- 数学运算 (`+`, `-`, `*`, `/`, `%`)
- 逻辑运算 (`&&`, `||`, `!`)
- 比较运算 (`==`, `!=`, `<`, `>`, `<=`, `>=`)
- 位运算 (`&`, `|`, `^`, `<<`, `>>`)
- 控制流 (`if`, `for`)
- 函数调用
- 递归函数
- 常量声明 (`const PI = 3.14`)

### 🚧 计划支持

- 结构体定义
- 数组和切片
- Map 类型
- 接口定义
- Goroutine
- Channel
- 错误处理
- 包导入系统

### ❌ 暂不支持

- 指针操作
- 反射
- CGO
- 泛型（Go 1.18+）

## 🔗 与 Gaia 集成

Mini-Go 使用 `@nyar/gaia-assembler-wasm32` 包来调用 Gaia 汇编器：

```typescript
import { Assembler, Metadata, Utils } from '@nyar/gaia-assembler-wasm32';

// 创建汇编器实例
const assembler = new Assembler();

// 编译生成的汇编代码
const result = assembler.compile(assemblyCode);

// 处理编译结果
if (result.success) {
    console.log('Compilation successful!');
    // 处理生成的程序
}
```

## 📄 许可证

本项目采用 MIT 许可证，详见项目根目录的 [License.md](../../License.md) 文件。

## 🤝 贡献

欢迎贡献代码！您可以：

1. 添加新的 Go 语言特性支持
2. 改进错误处理和诊断信息
3. 优化代码生成器
4. 添加更多测试用例
5. 改进文档和示例

## 📚 学习资源

- **[Go 语言规范](https://golang.org/ref/spec)**: Go 官方语言规范
- **[Gaia 汇编器文档](https://docs.rs/gaia-frontend)**: Gaia 汇编器 API 文档
- **[编译器设计](https://craftinginterpreters.com/)**: 编译器设计原理

---

**Mini-Go** - 学习 Go 语言编译器和 Gaia 汇编器的绝佳示例！