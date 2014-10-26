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

            // 处理转义字符
            if (char === '\\' && this.peek() !== '\0') {
                const escaped = this.advance();
                switch (escaped) {
                    case 'a':
                        value += '\x07'; // 响铃
                        break;
                    case 'b':
                        value += '\b'; // 退格
                        break;
                    case 'f':
                        value += '\f'; // 换页
                        break;
                    case 'n':
                        value += '\n'; // 换行
                        break;
                    case 'r':
                        value += '\r'; // 回车
                        break;
                    case 't':
                        value += '\t'; // 制表符
                        break;
                    case 'v':
                        value += '\v'; // 垂直制表符
                        break;
                    case '\\':
                        value += '\\'; // 反斜杠
                        break;
                    case quote:
                        value += quote; // 引号
                        break;
                    case 'x':
                        // 十六进制转义 \xNN
                        const hex1 = this.advance();
                        const hex2 = this.advance();
                        const hexValue = parseInt(hex1 + hex2, 16);
                        if (isNaN(hexValue)) {
                            throw new Error(`Invalid hex escape sequence at line ${this.line}, column ${this.column}`);
                        }
                        value += String.fromCharCode(hexValue);
                        break;
                    case 'u':
                        // Unicode 转义 \uNNNN
                        let unicodeValue = '';
                        for (let i = 0; i < 4; i++) {
                            unicodeValue += this.advance();
                        }
                        const unicode = parseInt(unicodeValue, 16);
                        if (isNaN(unicode)) {
                            throw new Error(`Invalid unicode escape sequence at line ${this.line}, column ${this.column}`);
                        }
                        value += String.fromCharCode(unicode);
                        break;
                    case 'U':
                        // Unicode 转义 \UNNNNNNNN
                        let longUnicodeValue = '';
                        for (let i = 0; i < 8; i++) {
                            longUnicodeValue += this.advance();
                        }
                        const longUnicode = parseInt(longUnicodeValue, 16);
                        if (isNaN(longUnicode)) {
                            throw new Error(`Invalid unicode escape sequence at line ${this.line}, column ${this.column}`);
                        }
                        value += String.fromCodePoint(longUnicode);
                        break;
                    default:
                        // 八进制转义 \NNN
                        if (/[0-7]/.test(escaped)) {
                            let octalValue = escaped;
                            for (let i = 0; i < 2 && /[0-7]/.test(this.peek()); i++) {
                                octalValue += this.advance();
                            }
                            const octal = parseInt(octalValue, 8);
                            value += String.fromCharCode(octal);
                        } else {
                            value += escaped;
                        }
                }
            } else {
                value += char;
            }
        }

        if (this.peek() === quote) {
            this.advance(); // 消耗结束引号
        } else {
            throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
        }

        return {kind: 'String', value, line: startLine, column: startColumn};
    }

    private readRune(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // 消耗开始单引号
        let value = '';

        if (this.peek() === '\\') {
            // 转义字符
            this.advance(); // 消耗反斜杠
            const escaped = this.advance();
            switch (escaped) {
                case 'a':
                    value = '\x07'; // 响铃
                    break;
                case 'b':
                    value = '\b'; // 退格
                    break;
                case 'f':
                    value = '\f'; // 换页
                    break;
                case 'n':
                    value = '\n'; // 换行
                    break;
                case 'r':
                    value = '\r'; // 回车
                    break;
                case 't':
                    value = '\t'; // 制表符
                    break;
                case 'v':
                    value = '\v'; // 垂直制表符
                    break;
                case '\\':
                    value = '\\'; // 反斜杠
                    break;
                case '\'':
                    value = '\''; // 单引号
                    break;
                case 'x':
                    // 十六进制转义 \xNN
                    const hex1 = this.advance();
                    const hex2 = this.advance();
                    const hexValue = parseInt(hex1 + hex2, 16);
                    if (isNaN(hexValue)) {
                        throw new Error(`Invalid hex escape sequence at line ${this.line}, column ${this.column}`);
                    }
                    value = String.fromCharCode(hexValue);
                    break;
                case 'u':
                    // Unicode 转义 \uNNNN
                    let unicodeValue = '';
                    for (let i = 0; i < 4; i++) {
                        unicodeValue += this.advance();
                    }
                    const unicode = parseInt(unicodeValue, 16);
                    if (isNaN(unicode)) {
                        throw new Error(`Invalid unicode escape sequence at line ${this.line}, column ${this.column}`);
                    }
                    value = String.fromCharCode(unicode);
                    break;
                default:
                    // 八进制转义 \NNN
                    if (/[0-7]/.test(escaped)) {
                        let octalValue = escaped;
                        for (let i = 0; i < 2 && /[0-7]/.test(this.peek()); i++) {
                            octalValue += this.advance();
                        }
                        const octal = parseInt(octalValue, 8);
                        value = String.fromCharCode(octal);
                    } else {
                        value = escaped;
                    }
            }
        } else if (this.peek() !== '\'' && this.peek() !== '\0') {
            value = this.advance();
        } else {
            throw new Error(`Empty rune literal at line ${this.line}, column ${this.column}`);
        }

        if (this.peek() === '\'') {
            this.advance(); // 消耗结束单引号
        } else {
            throw new Error(`Unterminated rune at line ${this.line}, column ${this.column}`);
        }

        return {kind: 'Rune', value, line: startLine, column: startColumn};
    }

    private readNumber(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        let isFloat = false;

        // 处理十六进制数字
        if (this.peek() === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
            value += this.advance(); // '0'
            value += this.advance(); // 'x' or 'X'
            
            while (/[0-9a-fA-F]/.test(this.peek())) {
                value += this.advance();
            }
            
            const hexValue = parseInt(value, 16);
            return {kind: 'Number', value: hexValue, subtype: 'int', line: startLine, column: startColumn};
        }

        // 处理八进制数字
        if (this.peek() === '0' && /[0-7]/.test(this.peek(1))) {
            value += this.advance(); // '0'
            
            while (/[0-7]/.test(this.peek())) {
                value += this.advance();
            }
            
            const octalValue = parseInt(value, 8);
            return {kind: 'Number', value: octalValue, subtype: 'int', line: startLine, column: startColumn};
        }

        // 处理十进制数字
        while (/\d/.test(this.peek())) {
            value += this.advance();
        }

        // 检查小数点
        if (this.peek() === '.' && /\d/.test(this.peek(1))) {
            isFloat = true;
            value += this.advance(); // '.'
            
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }

        // 检查科学计数法
        if (this.peek() === 'e' || this.peek() === 'E') {
            isFloat = true;
            value += this.advance(); // 'e' or 'E'
            
            if (this.peek() === '+' || this.peek() === '-') {
                value += this.advance();
            }
            
            while (/\d/.test(this.peek())) {
                value += this.advance();
            }
        }

        const numValue = parseFloat(value);
        return {
            kind: 'Number',
            value: numValue,
            subtype: isFloat ? 'float' : 'int',
            line: startLine,
            column: startColumn
        };
    }

    private readIdentifier(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        // 标识符必须以字母或下划线开始
        if (/[a-zA-Z_]/.test(this.peek())) {
            value += this.advance();
        }

        // 后续字符可以是字母、数字或下划线
        while (/[a-zA-Z0-9_]/.test(this.peek())) {
            value += this.advance();
        }

        // 检查是否是关键字
        if (GO_KEYWORDS.has(value)) {
            return {kind: 'Keyword', value, line: startLine, column: startColumn};
        }

        // 检查是否是布尔值
        if (value === 'true' || value === 'false') {
            return {kind: 'Boolean', value: value === 'true', line: startLine, column: startColumn};
        }

        return {kind: 'Identifier', value, line: startLine, column: startColumn};
    }

    public nextToken(): Token {
        this.skipWhitespace();
        this.skipComment();
        this.skipWhitespace();

        if (this.isAtEnd()) {
            return {kind: 'EOF', line: this.line, column: this.column};
        }

        const char = this.peek();
        const startLine = this.line;
        const startColumn = this.column;

        // 字符串字面量
        if (char === '"' || char === '`') {
            return this.readString();
        }

        // 字符字面量 (rune)
        if (char === "'") {
            return this.readRune();
        }

        // 数字字面量
        if (/\d/.test(char)) {
            return this.readNumber();
        }

        // 标识符和关键字
        if (/[a-zA-Z_]/.test(char)) {
            return this.readIdentifier();
        }

        // 操作符和标点符号
        switch (char) {
            case '+':
                this.advance();
                if (this.peek() === '+') {
                    this.advance();
                    return {kind: 'Operator', value: '++', line: startLine, column: startColumn};
                } else if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '+=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '+', line: startLine, column: startColumn};
            case '-':
                this.advance();
                if (this.peek() === '-') {
                    this.advance();
                    return {kind: 'Operator', value: '--', line: startLine, column: startColumn};
                } else if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '-=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '-', line: startLine, column: startColumn};
            case '*':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '*=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '*', line: startLine, column: startColumn};
            case '/':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '/=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '/', line: startLine, column: startColumn};
            case '%':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '%=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '%', line: startLine, column: startColumn};
            case '&':
                this.advance();
                if (this.peek() === '&') {
                    this.advance();
                    return {kind: 'Operator', value: '&&', line: startLine, column: startColumn};
                } else if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '&=', line: startLine, column: startColumn};
                } else if (this.peek() === '^') {
                    this.advance();
                    if (this.peek() === '=') {
                        this.advance();
                        return {kind: 'Operator', value: '&^=', line: startLine, column: startColumn};
                    }
                    return {kind: 'Operator', value: '&^', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '&', line: startLine, column: startColumn};
            case '|':
                this.advance();
                if (this.peek() === '|') {
                    this.advance();
                    return {kind: 'Operator', value: '||', line: startLine, column: startColumn};
                } else if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '|=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '|', line: startLine, column: startColumn};
            case '^':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '^=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '^', line: startLine, column: startColumn};
            case '=':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '==', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '=', line: startLine, column: startColumn};
            case '!':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '!=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '!', line: startLine, column: startColumn};
            case '<':
                this.advance();
                if (this.peek() === '<') {
                    this.advance();
                    if (this.peek() === '=') {
                        this.advance();
                        return {kind: 'Operator', value: '<<=', line: startLine, column: startColumn};
                    }
                    return {kind: 'Operator', value: '<<', line: startLine, column: startColumn};
                } else if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '<=', line: startLine, column: startColumn};
                } else if (this.peek() === '-') {
                    this.advance();
                    return {kind: 'Operator', value: '<-', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '<', line: startLine, column: startColumn};
            case '>':
                this.advance();
                if (this.peek() === '>') {
                    this.advance();
                    if (this.peek() === '=') {
                        this.advance();
                        return {kind: 'Operator', value: '>>=', line: startLine, column: startColumn};
                    }
                    return {kind: 'Operator', value: '>>', line: startLine, column: startColumn};
                } else if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: '>=', line: startLine, column: startColumn};
                }
                return {kind: 'Operator', value: '>', line: startLine, column: startColumn};
            case ':':
                this.advance();
                if (this.peek() === '=') {
                    this.advance();
                    return {kind: 'Operator', value: ':=', line: startLine, column: startColumn};
                }
                return {kind: 'Punctuation', value: ':', line: startLine, column: startColumn};
            case ';':
                this.advance();
                return {kind: 'Punctuation', value: ';', line: startLine, column: startColumn};
            case ',':
                this.advance();
                return {kind: 'Punctuation', value: ',', line: startLine, column: startColumn};
            case '.':
                this.advance();
                if (this.peek() === '.' && this.peek(1) === '.') {
                    this.advance();
                    this.advance();
                    return {kind: 'Operator', value: '...', line: startLine, column: startColumn};
                }
                return {kind: 'Punctuation', value: '.', line: startLine, column: startColumn};
            case '(':
                this.advance();
                return {kind: 'Punctuation', value: '(', line: startLine, column: startColumn};
            case ')':
                this.advance();
                return {kind: 'Punctuation', value: ')', line: startLine, column: startColumn};
            case '[':
                this.advance();
                return {kind: 'Punctuation', value: '[', line: startLine, column: startColumn};
            case ']':
                this.advance();
                return {kind: 'Punctuation', value: ']', line: startLine, column: startColumn};
            case '{':
                this.advance();
                return {kind: 'Punctuation', value: '{', line: startLine, column: startColumn};
            case '}':
                this.advance();
                return {kind: 'Punctuation', value: '}', line: startLine, column: startColumn};
            default:
                throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
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