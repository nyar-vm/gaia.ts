// Go 词法分析器
export type Token =
    | { kind: 'Keyword'; value: string; line: number; column: number }
    | { kind: 'Identifier'; value: string; line: number; column: number }
    | { kind: 'Number'; value: number; subtype: 'int' | 'float'; line: number; column: number }
    | { kind: 'String'; value: string; line: number; column: number }
    | { kind: 'Rune'; value: string; line: number; column: number }
    | { kind: 'Boolean'; value: boolean; line: number; column: number }
    | { kind: 'Operator'; value: string; line: number; column: number }
    | { kind: 'Punctuation'; value: string; line: number; column: number }
    | { kind: 'EOF'; line: number; column: number };

// Go 关键字
const GO_KEYWORDS = new Set([
    'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
    'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
    'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'
]);

// Go 内置类型
const GO_BUILTIN_TYPES = new Set([
    'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
    'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string',
    'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr'
]);

// Go 内置函数
const GO_BUILTIN_FUNCTIONS = new Set([
    'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len',
    'make', 'new', 'panic', 'print', 'println', 'real', 'recover'
]);

// Go 运算符（按长度排序，确保正确匹配）
const GO_OPERATORS = [
    // 三字符运算符
    '<<=', '>>=', '&^=',
    // 双字符运算符
    '++', '--', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '&^',
    ':=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
    // 单字符运算符
    '+', '-', '*', '/', '%', '&', '|', '^', '!', '<', '>', '=', ':'
];

// Go 标点符号
const GO_PUNCTUATION = [
    '(', ')', '[', ']', '{', '}', ',', ';', '.', '...'
];

export class Lexer {
    private input: string;
    private position: number = 0;
    private line: number = 1;
    private column: number = 1;

    constructor(input: string) {
        this.input = input;
    }

    private peek(offset: number = 0): string {
        const pos = this.position + offset;
        return pos >= this.input.length ? '\0' : this.input[pos];
    }

    private advance(): string {
        if (this.position >= this.input.length) return '\0';

        const char = this.input[this.position];
        this.position++;

        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }

        return char;
    }

    private skipWhitespace(): void {
        while (/\s/.test(this.peek()) && this.peek() !== '\0') {
            this.advance();
        }
    }

    private skipComment(): void {
        if (this.peek() === '/' && this.peek(1) === '/') {
            // 单行注释
            while (this.peek() !== '\n' && this.peek() !== '\0') {
                this.advance();
            }
        } else if (this.peek() === '/' && this.peek(1) === '*') {
            // 多行注释
            this.advance(); // 消耗 '/'
            this.advance(); // 消耗 '*'
            
            while (this.peek() !== '\0') {
                if (this.peek() === '*' && this.peek(1) === '/') {
                    this.advance(); // 消耗 '*'
                    this.advance(); // 消耗 '/'
                    break;
                }
                this.advance();
            }
        }
    }

    private readString(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        const quote = this.advance(); // 消耗开始引号
        let value = '';

        while (this.peek() !== quote && this.peek() !== '\0') {
            const char = this.advance();
            
            if (char === '\\') {
                // 处理转义字符
                const escaped = this.advance();
                switch (escaped) {
                    case 'n': value += '\n'; break;
                    case 't': value += '\t'; break;
                    case 'r': value += '\r'; break;
                    case '\\': value += '\\'; break;
                    case '"': value += '"'; break;
                    case "'": value += "'"; break;
                    case '0': value += '\0'; break;
                    case 'a': value += '\a'; break;
                    case 'b': value += '\b'; break;
                    case 'f': value += '\f'; break;
                    case 'v': value += '\v'; break;
                    case 'x': {
                        // 十六进制转义 \xNN
                        const hex1 = this.advance();
                        const hex2 = this.advance();
                        const hexValue = parseInt(hex1 + hex2, 16);
                        if (!isNaN(hexValue)) {
                            value += String.fromCharCode(hexValue);
                        } else {
                            value += '\\x' + hex1 + hex2;
                        }
                        break;
                    }
                    case 'u': {
                        // Unicode 转义 \uNNNN
                        let unicode = '';
                        for (let i = 0; i < 4; i++) {
                            unicode += this.advance();
                        }
                        const unicodeValue = parseInt(unicode, 16);
                        if (!isNaN(unicodeValue)) {
                            value += String.fromCharCode(unicodeValue);
                        } else {
                            value += '\\u' + unicode;
                        }
                        break;
                    }
                    case 'U': {
                        // Unicode 转义 \UNNNNNNNN
                        let unicode = '';
                        for (let i = 0; i < 8; i++) {
                            unicode += this.advance();
                        }
                        const unicodeValue = parseInt(unicode, 16);
                        if (!isNaN(unicodeValue)) {
                            value += String.fromCodePoint(unicodeValue);
                        } else {
                            value += '\\U' + unicode;
                        }
                        break;
                    }
                    default:
                        // 八进制转义 \NNN
                        if (/[0-7]/.test(escaped)) {
                            let octal = escaped;
                            for (let i = 0; i < 2 && /[0-7]/.test(this.peek()); i++) {
                                octal += this.advance();
                            }
                            const octalValue = parseInt(octal, 8);
                            value += String.fromCharCode(octalValue);
                        } else {
                            value += escaped;
                        }
                        break;
                }
            } else {
                value += char;
            }
        }

        if (this.peek() === quote) {
            this.advance(); // 消耗结束引号
        }

        return {
            kind: 'String',
            value,
            line: startLine,
            column: startColumn
        };
    }

    private readRune(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // 消耗开始单引号
        let value = '';

        if (this.peek() === '\\') {
            // 处理转义字符
            this.advance(); // 消耗 '\'
            const escaped = this.advance();
            switch (escaped) {
                case 'n': value = '\n'; break;
                case 't': value = '\t'; break;
                case 'r': value = '\r'; break;
                case '\\': value = '\\'; break;
                case "'": value = "'"; break;
                case '"': value = '"'; break;
                case '0': value = '\0'; break;
                case 'a': value = '\a'; break;
                case 'b': value = '\b'; break;
                case 'f': value = '\f'; break;
                case 'v': value = '\v'; break;
                case 'x': {
                    // 十六进制转义
                    const hex1 = this.advance();
                    const hex2 = this.advance();
                    const hexValue = parseInt(hex1 + hex2, 16);
                    value = String.fromCharCode(hexValue);
                    break;
                }
                case 'u': {
                    // Unicode 转义 \uNNNN
                    let unicode = '';
                    for (let i = 0; i < 4; i++) {
                        unicode += this.advance();
                    }
                    const unicodeValue = parseInt(unicode, 16);
                    value = String.fromCharCode(unicodeValue);
                    break;
                }
                case 'U': {
                    // Unicode 转义 \UNNNNNNNN
                    let unicode = '';
                    for (let i = 0; i < 8; i++) {
                        unicode += this.advance();
                    }
                    const unicodeValue = parseInt(unicode, 16);
                    value = String.fromCodePoint(unicodeValue);
                    break;
                }
                default:
                    // 八进制转义
                    if (/[0-7]/.test(escaped)) {
                        let octal = escaped;
                        for (let i = 0; i < 2 && /[0-7]/.test(this.peek()); i++) {
                            octal += this.advance();
                        }
                        const octalValue = parseInt(octal, 8);
                        value = String.fromCharCode(octalValue);
                    } else {
                        value = escaped;
                    }
                    break;
            }
        } else {
            value = this.advance();
        }

        if (this.peek() === "'") {
            this.advance(); // 消耗结束单引号
        }

        return {
            kind: 'Rune',
            value,
            line: startLine,
            column: startColumn
        };
    }

    private readNumber(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        let isFloat = false;
        let base = 10;

        // 检查进制前缀
        if (this.peek() === '0') {
            value += this.advance();
            const next = this.peek().toLowerCase();
            
            if (next === 'x' || next === 'X') {
                // 十六进制
                value += this.advance();
                base = 16;
                while (/[0-9a-fA-F]/.test(this.peek())) {
                    value += this.advance();
                }
            } else if (next === 'b' || next === 'B') {
                // 二进制
                value += this.advance();
                base = 2;
                while (/[01]/.test(this.peek())) {
                    value += this.advance();
                }
            } else if (next === 'o' || next === 'O') {
                // 八进制（Go 1.13+）
                value += this.advance();
                base = 8;
                while (/[0-7]/.test(this.peek())) {
                    value += this.advance();
                }
            } else if (/[0-7]/.test(next)) {
                // 传统八进制
                base = 8;
                while (/[0-7]/.test(this.peek())) {
                    value += this.advance();
                }
            }
        } else {
            // 十进制
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }

        // 检查小数点（仅十进制）
        if (base === 10 && this.peek() === '.' && /\d/.test(this.peek(1))) {
            isFloat = true;
            value += this.advance(); // 消耗 '.'
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }

        // 检查科学记数法（仅十进制）
        if (base === 10 && (this.peek() === 'e' || this.peek() === 'E')) {
            isFloat = true;
            value += this.advance(); // 消耗 'e' 或 'E'
            
            if (this.peek() === '+' || this.peek() === '-') {
                value += this.advance(); // 消耗符号
            }
            
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }

        // 检查数字后缀（Go 不支持，但为了兼容性）
        while (/[a-zA-Z_]/.test(this.peek())) {
            this.advance(); // 忽略后缀
        }

        const numericValue = base === 10 ? parseFloat(value) : parseInt(value, base);

        return {
            kind: 'Number',
            value: numericValue,
            subtype: isFloat ? 'float' : 'int',
            line: startLine,
            column: startColumn
        };
    }

    private readIdentifier(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        // Go 标识符可以以字母或下划线开始
        while (/[a-zA-Z_\u0080-\uFFFF]/.test(this.peek()) || 
               (value.length > 0 && /\d/.test(this.peek()))) {
            value += this.advance();
        }

        // 检查是否为关键字
        if (GO_KEYWORDS.has(value)) {
            return {
                kind: 'Keyword',
                value,
                line: startLine,
                column: startColumn
            };
        }

        // 检查是否为布尔字面量
        if (value === 'true' || value === 'false') {
            return {
                kind: 'Boolean',
                value: value === 'true',
                line: startLine,
                column: startColumn
            };
        }

        return {
            kind: 'Identifier',
            value,
            line: startLine,
            column: startColumn
        };
    }

    public nextToken(): Token {
        while (true) {
            this.skipWhitespace();

            // 检查注释
            if (this.peek() === '/' && (this.peek(1) === '/' || this.peek(1) === '*')) {
                this.skipComment();
                continue;
            }

            const line = this.line;
            const column = this.column;
            const char = this.peek();

            if (char === '\0') {
                return { kind: 'EOF', line, column };
            }

            // 字符串字面量
            if (char === '"' || char === '`') {
                return this.readString();
            }

            // 字符字面量
            if (char === "'") {
                return this.readRune();
            }

            // 数字字面量
            if (/\d/.test(char) || (char === '.' && /\d/.test(this.peek(1)))) {
                return this.readNumber();
            }

            // 标识符和关键字
            if (/[a-zA-Z_\u0080-\uFFFF]/.test(char)) {
                return this.readIdentifier();
            }

            // 运算符（按长度从长到短匹配）
            for (const op of GO_OPERATORS) {
                if (this.input.substr(this.position, op.length) === op) {
                    for (let i = 0; i < op.length; i++) {
                        this.advance();
                    }
                    return {
                        kind: 'Operator',
                        value: op,
                        line,
                        column
                    };
                }
            }

            // 标点符号
            for (const punct of GO_PUNCTUATION) {
                if (this.input.substr(this.position, punct.length) === punct) {
                    for (let i = 0; i < punct.length; i++) {
                        this.advance();
                    }
                    return {
                        kind: 'Punctuation',
                        value: punct,
                        line,
                        column
                    };
                }
            }

            // 未知字符，跳过
            this.advance();
        }
    }

    private isAtEnd(): boolean {
        return this.position >= this.input.length;
    }

    public getSourceLines(): number {
        return this.line;
    }

    public tokenize(): Token[] {
        const tokens: Token[] = [];
        let token: Token;

        do {
            token = this.nextToken();
            tokens.push(token);
        } while (token.kind !== 'EOF');

        return tokens;
    }
}