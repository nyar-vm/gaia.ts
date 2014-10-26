import {Lexer, Token} from './lexer';
import {
    BinaryExpression,
    BinaryOperator,
    CallExpression,
    Expression,
    ExpressionStatement,
    FunctionDeclaration,
    Identifier,
    IfStatement,
    Literal,
    Parameter,
    Program,
    ReturnStatement,
    Statement,
    GoType,
    UnaryExpression,
    UnaryOperator,
    VariableDeclaration,
    PackageDeclaration,
    ImportDeclaration,
    ConstantDeclaration,
    Declaration,
    BlockStatement,
    ForStatement,
    RangeStatement,
    SwitchStatement,
    CaseClause,
    BreakStatement,
    ContinueStatement,
    GotoStatement,
    LabeledStatement,
    DeferStatement,
    GoStatement,
    IndexExpression,
    SelectorExpression,
    TypeAssertion,
    SliceExpression,
    MethodDeclaration,
    StructDeclaration,
    InterfaceDeclaration,
    TypeDeclaration
} from './ast';

export class Parser {
    private tokens: Token[];
    private current: number = 0;
    private lexer: Lexer;

    constructor(input: string) {
        this.lexer = new Lexer(input);
        this.tokens = this.lexer.tokenize();
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private isAtEnd(): boolean {
        return this.peek().kind === 'EOF';
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private check(kind: string): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().kind === kind;
    }

    private match(...kinds: string[]): boolean {
        for (const kind of kinds) {
            if (this.check(kind)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private consume(kind: string, message: string): Token {
        if (this.check(kind)) return this.advance();

        throw new Error(`${message}. Got ${this.peek().kind} instead.`);
    }

    private error(message: string): never {
        throw new Error(message);
    }

    private getTokenValue(token: Token): string | number | boolean {
        if ('value' in token) {
            return token.value;
        }
        throw new Error(`Token ${token.kind} does not have a value property`);
    }

    public parse(): Program {
        // 解析 package 声明
        const packageDecl = this.packageDeclaration();
        
        // 解析 import 声明
        const imports: ImportDeclaration[] = [];
        while (this.check('Keyword') && this.getTokenValue(this.peek()) === 'import') {
            imports.push(this.importDeclaration());
        }
        
        // 解析顶级声明
        const declarations: Declaration[] = [];
        while (!this.isAtEnd()) {
            declarations.push(this.declaration());
        }

        return {
            package: packageDecl,
            imports,
            declarations
        };
    }

    private packageDeclaration(): PackageDeclaration {
        this.consume('Keyword', "Expected 'package' keyword");
        const name = this.getTokenValue(this.consume('Identifier', "Expected package name")) as string;
        return {
            kind: 'PackageDeclaration',
            name
        };
    }

    private importDeclaration(): ImportDeclaration {
        this.consume('Keyword', "Expected 'import' keyword");
        
        // 单个导入
        const path = this.getTokenValue(this.consume('String', "Expected import path")) as string;
        return {
            kind: 'ImportDeclaration',
            path
        };
    }

    private declaration(): Declaration {
        if (this.check('Keyword')) {
            const keyword = this.getTokenValue(this.peek());
            switch (keyword) {
                case 'func':
                    return this.functionDeclaration();
                case 'var':
                    return this.variableDeclaration();
                case 'const':
                    return this.constantDeclaration();
                case 'type':
                    return this.typeDeclaration();
                default:
                    throw new Error(`Unexpected keyword: ${keyword}`);
            }
        }
        throw new Error("Expected declaration");
    }

    private functionDeclaration(): FunctionDeclaration {
        this.consume('Keyword', "Expected 'func' keyword");
        const name = this.getTokenValue(this.consume('Identifier', "Expected function name"));

        this.consume('Punctuation', "Expected '('");
        const parameters: Parameter[] = [];

        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== ')') {
            do {
                const paramName = this.getTokenValue(this.consume('Identifier', "Expected parameter name"));
                const paramType = this.goType();
                parameters.push({name: paramName as string, type: paramType});
            } while (this.match('Punctuation', ','));
        }

        this.consume('Punctuation', "Expected ')'");
        
        // Go 函数可能有返回类型，也可能没有
        let returnType: GoType = 'void';
        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '{') {
            returnType = this.goType();
        }

        this.consume('Punctuation', "Expected '{'");
        const statements: Statement[] = [];

        while (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '}') {
            statements.push(this.statement());
        }

        this.consume('Punctuation', "Expected '}'");

        const body: BlockStatement = {
            kind: 'BlockStatement',
            statements
        };

        return {
            kind: 'FunctionDeclaration',
            name: name as string,
            parameters,
            returnType,
            body
        };
    }

    private constantDeclaration(): ConstantDeclaration {
        this.consume('Keyword', "Expected 'const' keyword");
        
        if (this.match('Punctuation', '(')) {
            // 多个常量声明
            const names: string[] = [];
            const values: Expression[] = [];
            let type: GoType | undefined;
            
            while (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== ')') {
                const name = this.getTokenValue(this.consume('Identifier', "Expected constant name"));
                names.push(name as string);
                
                if (!this.check('Operator') || this.getTokenValue(this.peek()) !== '=') {
                    type = this.goType();
                }
                
                this.consume('Operator', "Expected '='");
                const value = this.expression();
                values.push(value);
                
                if (!this.match('Punctuation', ',')) {
                    break;
                }
            }
            this.consume('Punctuation', "Expected ')'");
            return {
                kind: 'ConstantDeclaration',
                names,
                type,
                values
            };
        } else {
            // 单个常量声明
            const name = this.getTokenValue(this.consume('Identifier', "Expected constant name"));
            let type: GoType | undefined;
            
            if (!this.check('Operator') || this.getTokenValue(this.peek()) !== '=') {
                type = this.goType();
            }
            
            this.consume('Operator', "Expected '='");
            const value = this.expression();
            
            return {
                kind: 'ConstantDeclaration',
                names: [name as string],
                type,
                values: [value]
            };
        }
    }

    private typeDeclaration(): TypeDeclaration {
        this.consume('Keyword', "Expected 'type' keyword");
        const name = this.getTokenValue(this.consume('Identifier', "Expected type name"));
        const type = this.goType();
        
        return {
            kind: 'TypeDeclaration',
            name: name as string,
            type
        };
    }

    private statement(): Statement {
        if (this.check('Keyword')) {
            const keyword = this.getTokenValue(this.peek());
            switch (keyword) {
                case 'var':
                    return this.variableDeclaration();
                case 'return':
                    return this.returnStatement();
                case 'if':
                    return this.ifStatement();
                case 'for':
                    return this.forStatement();
                case 'switch':
                    return this.switchStatement();
                case 'break':
                    this.advance();
                    return { kind: 'BreakStatement' };
                case 'continue':
                    this.advance();
                    return { kind: 'ContinueStatement' };
                case 'goto':
                    return this.gotoStatement();
                case 'defer':
                    return this.deferStatement();
                case 'go':
                    return this.goStatement();
                default:
                    return this.expressionStatement();
            }
        }

        // 检查是否是标签语句
        if (this.check('Identifier') && this.getTokenValue(this.tokens[this.current + 1]) === ':') {
            return this.labeledStatement();
        }

        return this.expressionStatement();
    }

    private variableDeclaration(): VariableDeclaration {
        this.consume('Keyword', "Expected 'var' keyword");
        const name = this.getTokenValue(this.consume('Identifier', "Expected variable name"));

        let type: GoType | undefined;
        let initializer: Expression | undefined;

        // Go 变量声明: var name type = value 或 var name = value
        if (!this.check('Operator') || this.getTokenValue(this.peek()) !== '=') {
            type = this.goType();
        }

        if (this.match('Operator', '=')) {
            initializer = this.expression();
        }

        return {
            kind: 'VariableDeclaration',
            names: [name as string],
            type,
            initializers: initializer ? [initializer] : undefined
        };
    }

    private returnStatement(): ReturnStatement {
        this.consume('Keyword', "Expected 'return' keyword");
        let value: Expression | undefined;

        // Go 中 return 语句可能没有值
        if (!this.isAtEnd() && !this.check('Punctuation')) {
            value = this.expression();
        }

        return {
            kind: 'ReturnStatement',
            values: value ? [value] : undefined
        };
    }

    private forStatement(): Statement {
        this.consume('Keyword', "Expected 'for' keyword");
        
        // Go 的 for 循环有多种形式
        if (this.check('Punctuation') && this.getTokenValue(this.peek()) === '{') {
            // 无限循环: for { ... }
            const body = this.blockStatement();
            return {
                kind: 'ForStatement',
                body
            };
        }
        
        // 检查是否是 range 循环
        const checkpoint = this.current;
        try {
            const expr = this.expression();
            if (this.check('Keyword') && this.getTokenValue(this.peek()) === 'range') {
                // range 循环: for key, value := range iterable { ... }
                this.current = checkpoint;
                return this.rangeStatement();
            }
            this.current = checkpoint;
        } catch {
            this.current = checkpoint;
        }
        
        // 标准 for 循环: for init; condition; post { ... }
        let init: Statement | undefined;
        let condition: Expression | undefined;
        let post: Statement | undefined;
        
        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== ';') {
            init = this.statement();
        }
        this.consume('Punctuation', "Expected ';'");
        
        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== ';') {
            condition = this.expression();
        }
        this.consume('Punctuation', "Expected ';'");
        
        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '{') {
            post = this.statement();
        }
        
        const body = this.blockStatement();
        
        return {
            kind: 'ForStatement',
            init,
            condition,
            post,
            body
        };
    }

    private rangeStatement(): RangeStatement {
        // 解析 range 循环: for key, value := range iterable { ... }
        const keyName = this.getTokenValue(this.consume('Identifier', "Expected key variable")) as string;
        const key: Identifier = { kind: 'Identifier', name: keyName };
        let value: Identifier | undefined;
        
        if (this.match('Punctuation', ',')) {
            const valueName = this.getTokenValue(this.consume('Identifier', "Expected value variable")) as string;
            value = { kind: 'Identifier', name: valueName };
        }
        
        this.consume('Operator', "Expected ':='");
        this.consume('Keyword', "Expected 'range' keyword");
        const iterable = this.expression();
        const body = this.blockStatement();
        
        return {
            kind: 'RangeStatement',
            key,
            value,
            iterable,
            body
        };
    }

    private switchStatement(): SwitchStatement {
        this.consume('Keyword', "Expected 'switch' keyword");
        
        let expr: Expression | undefined;
        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '{') {
            expr = this.expression();
        }
        
        this.consume('Punctuation', "Expected '{'");
        const cases: CaseClause[] = [];
        
        while (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '}') {
            if (this.match('Keyword', 'case')) {
                const values: Expression[] = [];
                do {
                    values.push(this.expression());
                } while (this.match('Punctuation', ','));
                
                this.consume('Punctuation', "Expected ':'");
                const body: Statement[] = [];
                
                while (!this.check('Keyword') && (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '}')) {
                    body.push(this.statement());
                }
                
                cases.push({kind: 'CaseClause', values, body});
            } else if (this.match('Keyword', 'default')) {
                this.consume('Punctuation', "Expected ':'");
                const body: Statement[] = [];
                
                while (!this.check('Keyword') && (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '}')) {
                    body.push(this.statement());
                }
                
                // default case 作为没有 values 的 CaseClause
                cases.push({kind: 'CaseClause', body});
            }
        }
        
        this.consume('Punctuation', "Expected '}'");
        
        return {
            kind: 'SwitchStatement',
            tag: expr,
            cases
        };
    }

    private gotoStatement(): GotoStatement {
        this.consume('Keyword', "Expected 'goto' keyword");
        const label = this.getTokenValue(this.consume('Identifier', "Expected label")) as string;
        
        return {
            kind: 'GotoStatement',
            label
        };
    }

    private labeledStatement(): LabeledStatement {
        const label = this.getTokenValue(this.consume('Identifier', "Expected label")) as string;
        this.consume('Punctuation', "Expected ':'");
        const statement = this.statement();
        
        return {
            kind: 'LabeledStatement',
            label,
            statement
        };
    }

    private deferStatement(): DeferStatement {
        this.consume('Keyword', "Expected 'defer' keyword");
        const call = this.expression() as CallExpression;
        
        return {
            kind: 'DeferStatement',
            call
        };
    }

    private goStatement(): GoStatement {
        this.consume('Keyword', "Expected 'go' keyword");
        const call = this.expression() as CallExpression;
        
        return {
            kind: 'GoStatement',
            call
        };
    }

    private blockStatement(): BlockStatement {
        this.consume('Punctuation', "Expected '{'");
        const statements: Statement[] = [];
        
        while (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== '}') {
            statements.push(this.statement());
        }
        
        this.consume('Punctuation', "Expected '}'");
        
        return {
            kind: 'BlockStatement',
            statements
        };
    }

    private ifStatement(): IfStatement {
        this.consume('Keyword', "Expected 'if' keyword");
        const condition = this.expression();
        const thenBranch = this.blockStatement();

        let elseBranch: BlockStatement | undefined;

        if (this.match('Keyword', 'else')) {
            if (this.check('Keyword') && this.getTokenValue(this.peek()) === 'if') {
                // else if 情况
                const elseIfStmt = this.ifStatement();
                elseBranch = {
                    kind: 'BlockStatement',
                    statements: [elseIfStmt]
                };
            } else {
                // else 情况
                elseBranch = this.blockStatement();
            }
        }

        return {
            kind: 'IfStatement',
            condition,
            body: thenBranch,
            else: elseBranch
        };
    }

    private expressionStatement(): ExpressionStatement {
        const expr = this.expression();

        return {
            kind: 'ExpressionStatement',
            expression: expr
        };
    }

    private expression(): Expression {
        return this.assignment();
    }

    private assignment(): Expression {
        const expr = this.logicalOr();

        // Go 支持多种赋值操作符
        if (this.match('Operator', '=', ':=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '&^=')) {
            const operator = this.getTokenValue(this.previous());
            const value = this.assignment();

            if (expr.kind === 'Identifier' || expr.kind === 'IndexExpression' || expr.kind === 'SelectorExpression') {
                let binaryOp: BinaryOperator;
                switch (operator) {
                    case '=':
                    case ':=':
                        binaryOp = 'Assign';
                        break;
                    case '+=':
                        binaryOp = 'AddAssign';
                        break;
                    case '-=':
                        binaryOp = 'SubtractAssign';
                        break;
                    case '*=':
                        binaryOp = 'MultiplyAssign';
                        break;
                    case '/=':
                        binaryOp = 'DivideAssign';
                        break;
                    case '%=':
                        binaryOp = 'ModuloAssign';
                        break;
                    case '&=':
                        binaryOp = 'BitwiseAndAssign';
                        break;
                    case '|=':
                        binaryOp = 'BitwiseOrAssign';
                        break;
                    case '^=':
                        binaryOp = 'BitwiseXorAssign';
                        break;
                    case '<<=':
                        binaryOp = 'LeftShiftAssign';
                        break;
                    case '>>=':
                        binaryOp = 'RightShiftAssign';
                        break;
                    case '&^=':
                        binaryOp = 'BitClearAssign';
                        break;
                    default:
                        binaryOp = 'Assign';
                }

                return {
                    kind: 'BinaryExpression',
                    left: expr,
                    operator: binaryOp,
                    right: value
                };
            }

            this.error("Invalid assignment target");
        }

        return expr;
    }

    private logicalOr(): Expression {
        let expr = this.logicalAnd();

        while (this.match('Operator', '||')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.logicalAnd();

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: 'LogicalOr',
                right
            };
        }

        return expr;
    }

    private logicalAnd(): Expression {
        let expr = this.bitwiseOr();

        while (this.match('Operator', '&&')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.bitwiseOr();

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: 'LogicalAnd',
                right
            };
        }

        return expr;
    }

    private bitwiseOr(): Expression {
        let expr = this.bitwiseXor();

        while (this.match('Operator', '|')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.bitwiseXor();

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: 'BitwiseOr',
                right
            };
        }

        return expr;
    }

    private bitwiseXor(): Expression {
        let expr = this.bitwiseAnd();

        while (this.match('Operator', '^')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.bitwiseAnd();

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: 'BitwiseXor',
                right
            };
        }

        return expr;
    }

    private bitwiseAnd(): Expression {
        let expr = this.equality();

        while (this.match('Operator', '&')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.equality();

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: 'BitwiseAnd',
                right
            };
        }

        return expr;
    }

    private equality(): Expression {
        let expr = this.comparison();

        while (this.match('Operator', '!=', '==')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.comparison();

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: operator === '!=' ? 'NotEqual' : 'Equal',
                right
            };
        }

        return expr;
    }

    private comparison(): Expression {
        let expr = this.shift();

        while (this.match('Operator', '>', '>=', '<', '<=')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.shift();

            let binaryOp: BinaryOperator;

            switch (operator) {
                case '>':
                    binaryOp = 'GreaterThan';
                    break;
                case '>=':
                    binaryOp = 'GreaterThanOrEqual';
                    break;
                case '<':
                    binaryOp = 'LessThan';
                    break;
                case '<=':
                    binaryOp = 'LessThanOrEqual';
                    break;
                default:
                    throw new Error(`Unknown comparison operator: ${operator}`);
            }

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: binaryOp,
                right
            };
        }

        return expr;
    }

    private shift(): Expression {
        let expr = this.term();

        while (this.match('Operator', '<<', '>>', '&^')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.term();

            let binaryOp: BinaryOperator;

            switch (operator) {
                case '<<':
                    binaryOp = 'LeftShift';
                    break;
                case '>>':
                    binaryOp = 'RightShift';
                    break;
                case '&^':
                    binaryOp = 'BitClear';
                    break;
                default:
                    throw new Error(`Unknown shift operator: ${operator}`);
            }

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: binaryOp,
                right
            };
        }

        return expr;
    }

    private term(): Expression {
        let expr = this.factor();

        while (this.match('Operator', '+', '-')) {
            const operator = this.getTokenValue(this.previous()) === '+' ? 'Add' : 'Subtract' as BinaryOperator;
            const right = this.factor();
            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator,
                right
            };
        }

        return expr;
    }

    private factor(): Expression {
        let expr = this.unary();

        while (this.match('Operator', '*', '/', '%')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.unary();

            let binaryOp: BinaryOperator;

            switch (operator) {
                case '*':
                    binaryOp = 'Multiply';
                    break;
                case '/':
                    binaryOp = 'Divide';
                    break;
                case '%':
                    binaryOp = 'Modulo';
                    break;
                default:
                    throw new Error(`Unknown factor operator: ${operator}`);
            }

            expr = {
                kind: 'BinaryExpression',
                left: expr,
                operator: binaryOp,
                right
            };
        }

        return expr;
    }

    private unary(): Expression {
        if (this.match('Operator', '!', '-', '+', '^', '*', '&', '<-')) {
            const operator = this.getTokenValue(this.previous());
            const right = this.unary();

            let unaryOp: UnaryOperator;

            switch (operator) {
                case '!':
                    unaryOp = 'Not';
                    break;
                case '-':
                    unaryOp = 'Minus';
                    break;
                case '+':
                    unaryOp = 'Plus';
                    break;
                case '^':
                    unaryOp = 'BitwiseNot';
                    break;
                case '*':
                    unaryOp = 'Dereference';
                    break;
                case '&':
                    unaryOp = 'Address';
                    break;
                case '<-':
                    // 简化处理，使用 Plus 代替不存在的 Receive
                    unaryOp = 'Plus';
                    break;
                default:
                    throw new Error(`Unknown unary operator: ${operator}`);
            }

            return {
                kind: 'UnaryExpression',
                operator: unaryOp,
                operand: right
            };
        }

        return this.postfix();
    }

    private postfix(): Expression {
        let expr = this.call();

        while (this.match('Operator', '++', '--')) {
            const operator = this.getTokenValue(this.previous());

            expr = {
                kind: 'UnaryExpression',
                operator: operator === '++' ? 'Increment' : 'Decrement',
                operand: expr
            };
        }

        return expr;
    }

    private call(): Expression {
        let expr = this.primary();

        while (true) {
            if (this.match('Punctuation', '(')) {
                expr = this.finishCall(expr);
            } else if (this.match('Punctuation', '[')) {
                expr = this.finishIndex(expr);
            } else if (this.match('Punctuation', '.')) {
                expr = this.finishSelector(expr);
            } else {
                break;
            }
        }

        return expr;
    }

    private finishCall(callee: Expression): Expression {
        const args: Expression[] = [];

        if (!this.check('Punctuation') || this.getTokenValue(this.peek()) !== ')') {
            do {
                args.push(this.expression());
            } while (this.match('Punctuation', ','));
        }

        this.consume('Punctuation', "Expected ')'");

        if (callee.kind !== 'Identifier') {
            this.error("Can only call identifiers");
        }

        return {
            kind: 'CallExpression',
            callee: callee as Identifier,
            arguments: args
        };
    }

    private finishIndex(object: Expression): IndexExpression {
        const index = this.expression();
        this.consume('Punctuation', "Expected ']' after index");

        return {
            kind: 'IndexExpression',
            object,
            index
        };
    }

    private finishSelector(object: Expression): SelectorExpression {
        const property = this.consume('Identifier', "Expected property name after '.'");

        return {
            kind: 'SelectorExpression',
            object,
            selector: {
                kind: 'Identifier',
                name: this.getTokenValue(property) as string
            }
        };
    }

    private primary(): Expression {
        if (this.match('Number')) {
            const token = this.previous();
            const value = this.getTokenValue(token) as number;
            const subtype = (token as any).subtype || 'int';
            
            return {
                kind: 'Literal',
                type: subtype === 'float' ? 'float64' : 'int',
                value
            };
        }

        if (this.match('String')) {
            return {
                kind: 'Literal',
                type: 'string',
                value: this.getTokenValue(this.previous())
            };
        }

        if (this.match('Rune')) {
            return {
                kind: 'Literal',
                type: 'rune',
                value: this.getTokenValue(this.previous())
            };
        }

        if (this.match('Boolean')) {
            return {
                kind: 'Literal',
                type: 'bool',
                value: this.getTokenValue(this.previous())
            };
        }

        if (this.match('Identifier')) {
            return {
                kind: 'Identifier',
                name: this.getTokenValue(this.previous()) as string
            };
        }

        if (this.match('Punctuation', '(')) {
            const expr = this.expression();
            this.consume('Punctuation', "Expected ')'");
            return expr;
        }

        throw new Error(`Expected expression, got ${this.peek().kind}`);
    }

    private goType(): GoType {
        if (this.match('*')) {
            // 指针类型
            const baseType = this.goType();
            return {
                kind: 'pointer',
                pointeeType: baseType
            };
        }
        
        if (this.match('[')) {
            if (this.check(']')) {
                // 切片类型 []T
                this.advance(); // 消费 ']'
                const elementType = this.goType();
                return {
                    kind: 'slice',
                    elementType: elementType
                };
            } else {
                // 数组类型 [size]T
                const sizeExpr = this.expression();
                this.consume(']', "Expected ']' after array size");
                const elementType = this.goType();
                
                // 假设 size 是一个数字字面量
                let size = 0;
                if (sizeExpr.kind === 'Literal' && typeof sizeExpr.value === 'number') {
                    size = sizeExpr.value;
                }
                
                return {
                    kind: 'array',
                    size: size,
                    elementType: elementType
                };
            }
        }
        
        if (this.match('struct')) {
            // 结构体类型 - 简化为只返回名称
            this.consume('Punctuation', "Expected '{' after 'struct'");
            
            // 跳过字段定义
            while (!this.check('Punctuation') && !this.isAtEnd()) {
                this.advance();
            }
            
            this.consume('Punctuation', "Expected '}' after struct fields");
            return {
                kind: 'struct',
                name: 'anonymous'
            };
        }
        
        if (this.match('interface')) {
            // 接口类型 - 简化为只返回名称
            this.consume('Punctuation', "Expected '{' after 'interface'");
            
            // 跳过方法定义
            while (!this.check('Punctuation') && !this.isAtEnd()) {
                this.advance();
            }
            
            this.consume('Punctuation', "Expected '}' after interface methods");
            return {
                kind: 'interface',
                name: 'anonymous'
            };
        }
        
        // 基本类型或标识符类型
        if (this.check('Identifier')) {
            const typeName = this.getTokenValue(this.advance()) as string;
            
            // 检查是否是基本类型
            const basicTypes = ['int', 'int8', 'int16', 'int32', 'int64', 
                              'uint', 'uint8', 'uint16', 'uint32', 'uint64',
                              'float32', 'float64', 'bool', 'string', 'rune', 'byte', 'void'];
            
            if (basicTypes.includes(typeName)) {
                return typeName as GoType;
            } else {
                // 对于用户定义的类型，返回基本的 string 类型
                return 'string';
            }
        }
        
        throw new Error(`Expected type at line ${this.peek().line}`);
    }

    public getSourceLines(): number {
        return this.lexer.getSourceLines();
    }

    private type(): GoType {
        const typeName = this.getTokenValue(this.consume('Keyword', "Expected type name"));

        switch (typeName) {
            case 'int':
                return 'int';
            case 'string':
                return 'string';
            case 'bool':
                return 'bool';
            case 'void':
                return 'void';
            default:
                throw new Error(`Unknown type: ${typeName}`);
        }
    }
}