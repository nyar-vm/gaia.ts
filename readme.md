# Gaia Multi-Platform Assembler

Gaia is a modern multi-platform assembler project designed to provide a unified, ergonomic assembly language frontend for different target platforms.

## 🎯 Project Overview

The Gaia project contains the following core components:

- **gaia-frontend**: Rust core library, providing the main functionality of the assembler.
- **gaia-frontend-wasm32**: WebAssembly frontend, supporting execution in browser and Node.js environments.
- **Example Projects**: Includes example implementations such as mini-go and mini-ts.

## 🏗️ Project Structure

```
gaia.ts/
├── projects/
│   ├── gaia-frontend/          # Rust core library
│   └── gaia-frontend-wasm32/   # WASM32 frontend package
├── examples/
│   ├── mini-go/               # Go language example
│   └── mini-ts/               # TypeScript example
├── Cargo.toml                 # Rust workspace configuration
└── License.md                 # Project license
```

## 🚀 Quick Start

### Prerequisites

- **Rust**: Latest stable version
- **Node.js**: 18.0 or higher
- **wasm32-wasip2 target**: For WASM builds

### Installation Steps

1. **Clone the project**
   ```bash
   git clone https://github.com/nyar-vm/project-gaia
   cd gaia.ts
   ```

2. **Add WASM target**
   ```bash
   rustup target add wasm32-wasip2
   ```

3. **Build the project**
   ```bash
   # Build Rust core library
   cargo build --release
   
   # Build WASM32 frontend (optional)
   cd projects/gaia-frontend-wasm32
   npm install
   npm run build
   ```

## 📦 Core Components

### gaia-frontend

Rust core library, providing the following features:

- **Assembler**: Converts assembly code into target platform code.
- **Metadata**: Handles assembly metadata and debugging information.
- **Utilities**: Provides various practical utility functions.
- **Easy Test**: Tools to simplify the testing process.

### gaia-frontend-wasm32

WebAssembly frontend package features:

- Based on WebAssembly technology, supporting cross-platform execution.
- Provides JavaScript/TypeScript API.
- Supports usage in browser and Node.js environments.
- Includes complete type definition files.

## 🧪 Example Projects

### mini-go

Demonstrates how to use the Gaia assembler to handle Go-style syntax:

- Lexer
- Parser
- AST (Abstract Syntax Tree)
- Code Generator

### mini-ts

A similar implementation in TypeScript, showing how different language frontends can be integrated.

## 🔧 Development Guide

### Running Tests

```bash
# Rust tests
cargo test

# WASM32 frontend tests
cd projects/gaia-frontend-wasm32
npm test

# Example project tests
cd examples/mini-go
npm test
```

### Building Release Version

```bash
# Rust release build
cargo build --release

# WASM32 release package
cd projects/gaia-frontend-wasm32
npm run build
```

## 📄 License

This project is licensed under the MPL-2.0 License, see the [License.md](License.md) file for details.

## 🤝 Contribution Guide

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📞 Contact

- **Project Team**: Gaia Team <team↯gaia-project.org>
- **Repository**: https://github.com/nyar-vm/project-gaia
- **Documentation**: https://docs.rs/gaia-frontend

---

**Gaia** - Making assembly language development more human and modern!
