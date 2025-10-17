import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';

describe('Lexer', () => {
  it('should tokenize basic Go code', () => {
    const code = `package main

func main() {
    println("Hello, World!")
}`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    expect(tokens).toBeDefined();
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('should handle empty input', () => {
    const lexer = new Lexer('');
    const tokens = lexer.tokenize();
    
    expect(tokens).toEqual([]);
  });
});

describe('Parser', () => {
  it('should parse basic Go program', () => {
    const code = `package main

func main() {
    println("Hello, World!")
}`;
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    expect(ast).toBeDefined();
    expect(ast.type).toBe('Program');
  });

  it('should handle syntax errors gracefully', () => {
    const code = `package main

func main() {
    println("Hello, World!")
`; // 缺少右括号
    
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    
    expect(() => parser.parse()).toThrow();
  });
});