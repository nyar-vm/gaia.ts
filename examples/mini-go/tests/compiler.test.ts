import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';
import { MiniGoCompiler } from '../src/lib';

describe('Lexer', () => {
  it('tokenizes basic Go code', () => {
    const code = `package main\n\nfunc main() {\n    println("Hello, World!")\n}`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });
});

describe('Parser', () => {
  it('parses a basic Go program', () => {
    const code = `package main\n\nfunc main() {\n    println("Hello, World!")\n}`;
    const compiler = new MiniGoCompiler(code);
    const result = compiler.compile();
    expect(result.success).toBe(true);
    expect(result.program).toBeDefined();
    expect(result.program?.packageName).toBe('main');
    expect(result.program?.functions.length).toBeGreaterThanOrEqual(1);
  });

  it('reports syntax errors', () => {
    const code = `package main\n\nfunc main() {\n    println("Hello, World!")`; // missing closing brace
    const compiler = new MiniGoCompiler(code);
    const result = compiler.compile();
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
  });
});