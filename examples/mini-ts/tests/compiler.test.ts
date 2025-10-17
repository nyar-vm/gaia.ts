import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';

describe('TypeScript Lexer', () => {
  it('should tokenize basic TypeScript code', () => {
    const code = `function hello(name: string): void {
    console.log("Hello, " + name);
}`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    expect(tokens).toBeDefined();
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should handle TypeScript types', () => {
    const code = `let x: number = 42;
let y: string = "hello";
let z: boolean = true;`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    expect(tokens).toBeDefined();
    expect(tokens.some(token => token.value === 'number')).toBe(true);
    expect(tokens.some(token => token.value === 'string')).toBe(true);
    expect(tokens.some(token => token.value === 'boolean')).toBe(true);
  });
});

describe('TypeScript Parser', () => {
  it('should parse basic TypeScript function', () => {
    const code = `function hello(name: string): void {
    console.log("Hello, " + name);
}`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast).toBeDefined();
    expect(ast.type).toBe('Program');
  });

  it('should parse TypeScript interface', () => {
    const code = `interface Person {
    name: string;
    age: number;
}`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast).toBeDefined();
    expect(ast.type).toBe('Program');
  });

  it('should handle TypeScript-specific syntax errors', () => {
    const code = `function test(param: string): void {
    return param; // 错误：不能从 void 函数返回值
}`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    
    // 这应该能解析，但类型检查会失败
    expect(() => parser.parse()).not.toThrow();
  });
});