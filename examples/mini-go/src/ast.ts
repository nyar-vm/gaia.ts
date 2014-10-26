// Go AST节点类型定义

// Go 基本类型
export type GoType = 
    | 'int' | 'int8' | 'int16' | 'int32' | 'int64'
    | 'uint' | 'uint8' | 'uint16' | 'uint32' | 'uint64'
    | 'float32' | 'float64'
    | 'string' | 'bool' | 'byte' | 'rune'
    | 'void'
    | { kind: 'slice'; elementType: GoType }
    | { kind: 'array'; elementType: GoType; size: number }
    | { kind: 'pointer'; pointeeType: GoType }
    | { kind: 'struct'; name: string }
    | { kind: 'interface'; name: string };

// 二元操作符
export type BinaryOperator =
    | 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Modulo'
    | 'Equal' | 'NotEqual' | 'LessThan' | 'LessThanOrEqual' | 'GreaterThan' | 'GreaterThanOrEqual'
    | 'LogicalAnd' | 'LogicalOr'
    | 'BitwiseAnd' | 'BitwiseOr' | 'BitwiseXor' | 'LeftShift' | 'RightShift' | 'BitClear'
    | 'Assign' | 'AddAssign' | 'SubtractAssign' | 'MultiplyAssign' | 'DivideAssign' | 'BitClearAssign' | 'LeftShiftAssign' | 'RightShiftAssign' | 'ModuloAssign' | 'BitwiseAndAssign' | 'BitwiseOrAssign' | 'BitwiseXorAssign';

// 一元操作符
export type UnaryOperator = 'Plus' | 'Minus' | 'Not' | 'BitwiseNot' | 'Address' | 'Dereference' | 'Increment' | 'Decrement';

// 字面量
export interface Literal {
    kind: 'Literal';
    type: GoType;
    value: number | string | boolean | null;
}

// 标识符
export interface Identifier {
    kind: 'Identifier';
    name: string;
}

// 二元表达式
export interface BinaryExpression {
    kind: 'BinaryExpression';
    left: Expression;
    operator: BinaryOperator;
    right: Expression;
}

// 一元表达式
export interface UnaryExpression {
    kind: 'UnaryExpression';
    operator: UnaryOperator;
    operand: Expression;
}

// 函数调用
export interface CallExpression {
    kind: 'CallExpression';
    callee: Expression;
    arguments: Expression[];
}

// 索引表达式 (数组/切片访问)
export interface IndexExpression {
    kind: 'IndexExpression';
    object: Expression;
    index: Expression;
}

// 选择器表达式 (结构体字段访问)
export interface SelectorExpression {
    kind: 'SelectorExpression';
    object: Expression;
    selector: Identifier;
}

// 类型断言
export interface TypeAssertion {
    kind: 'TypeAssertion';
    expression: Expression;
    type: GoType;
}

// 切片表达式
export interface SliceExpression {
    kind: 'SliceExpression';
    object: Expression;
    low?: Expression;
    high?: Expression;
    max?: Expression;
}

export type Expression = 
    | Literal 
    | Identifier 
    | BinaryExpression 
    | UnaryExpression 
    | CallExpression
    | IndexExpression
    | SelectorExpression
    | TypeAssertion
    | SliceExpression;

// 包声明
export interface PackageDeclaration {
    kind: 'PackageDeclaration';
    name: string;
}

// 导入声明
export interface ImportDeclaration {
    kind: 'ImportDeclaration';
    path: string;
    alias?: string;
}

// 变量声明
export interface VariableDeclaration {
    kind: 'VariableDeclaration';
    names: string[];
    type?: GoType;
    initializers?: Expression[];
}

// 常量声明
export interface ConstantDeclaration {
    kind: 'ConstantDeclaration';
    names: string[];
    type?: GoType;
    values: Expression[];
}

// 函数参数
export interface Parameter {
    name: string;
    type: GoType;
}

// 函数声明
export interface FunctionDeclaration {
    kind: 'FunctionDeclaration';
    name: string;
    parameters: Parameter[];
    returnType?: GoType;
    body: BlockStatement;
}

// 方法声明
export interface MethodDeclaration {
    kind: 'MethodDeclaration';
    receiver: Parameter;
    name: string;
    parameters: Parameter[];
    returnType?: GoType;
    body: BlockStatement;
}

// 结构体字段
export interface StructField {
    name: string;
    type: GoType;
    tag?: string;
}

// 结构体声明
export interface StructDeclaration {
    kind: 'StructDeclaration';
    name: string;
    fields: StructField[];
}

// 接口方法
export interface InterfaceMethod {
    name: string;
    parameters: Parameter[];
    returnType?: GoType;
}

// 接口声明
export interface InterfaceDeclaration {
    kind: 'InterfaceDeclaration';
    name: string;
    methods: InterfaceMethod[];
}

// 类型别名声明
export interface TypeDeclaration {
    kind: 'TypeDeclaration';
    name: string;
    type: GoType;
}

// 块语句
export interface BlockStatement {
    kind: 'BlockStatement';
    statements: Statement[];
}

// 表达式语句
export interface ExpressionStatement {
    kind: 'ExpressionStatement';
    expression: Expression;
}

// 返回语句
export interface ReturnStatement {
    kind: 'ReturnStatement';
    values?: Expression[];
}

// if 语句
export interface IfStatement {
    kind: 'IfStatement';
    init?: Statement;
    condition: Expression;
    body: BlockStatement;
    else?: Statement;
}

// for 语句
export interface ForStatement {
    kind: 'ForStatement';
    init?: Statement;
    condition?: Expression;
    post?: Statement;
    body: BlockStatement;
}

// range 语句
export interface RangeStatement {
    kind: 'RangeStatement';
    key?: Identifier;
    value?: Identifier;
    iterable: Expression;
    body: BlockStatement;
}

// switch 语句的 case
export interface CaseClause {
    kind: 'CaseClause';
    values?: Expression[];
    body: Statement[];
}

// switch 语句
export interface SwitchStatement {
    kind: 'SwitchStatement';
    init?: Statement;
    tag?: Expression;
    cases: CaseClause[];
}

// break 语句
export interface BreakStatement {
    kind: 'BreakStatement';
    label?: string;
}

// continue 语句
export interface ContinueStatement {
    kind: 'ContinueStatement';
    label?: string;
}

// goto 语句
export interface GotoStatement {
    kind: 'GotoStatement';
    label: string;
}

// 标签语句
export interface LabeledStatement {
    kind: 'LabeledStatement';
    label: string;
    statement: Statement;
}

// defer 语句
export interface DeferStatement {
    kind: 'DeferStatement';
    call: CallExpression;
}

// go 语句
export interface GoStatement {
    kind: 'GoStatement';
    call: CallExpression;
}

export type Statement =
    | VariableDeclaration
    | ConstantDeclaration
    | FunctionDeclaration
    | MethodDeclaration
    | StructDeclaration
    | InterfaceDeclaration
    | TypeDeclaration
    | BlockStatement
    | ExpressionStatement
    | ReturnStatement
    | IfStatement
    | ForStatement
    | RangeStatement
    | SwitchStatement
    | BreakStatement
    | ContinueStatement
    | GotoStatement
    | LabeledStatement
    | DeferStatement
    | GoStatement;

export type Declaration = 
    | VariableDeclaration
    | ConstantDeclaration
    | FunctionDeclaration
    | MethodDeclaration
    | StructDeclaration
    | InterfaceDeclaration
    | TypeDeclaration;

// Go 程序
export interface Program {
    package: PackageDeclaration;
    imports: ImportDeclaration[];
    declarations: Declaration[];
}

// 辅助函数
export function literalToGaiaConstant(literal: Literal): any {
    if (typeof literal.type === 'string') {
        switch (literal.type) {
            case 'int':
            case 'int8':
            case 'int16':
            case 'int32':
            case 'int64':
            case 'uint':
            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'uint64':
            case 'float32':
            case 'float64':
                return {type: 'Number', value: literal.value};
            case 'string':
                return {type: 'String', value: literal.value};
            case 'bool':
                return {type: 'Boolean', value: literal.value};
            case 'byte':
            case 'rune':
                return {type: 'Number', value: literal.value};
            default:
                throw new Error(`Unsupported literal type: ${literal.type}`);
        }
    } else {
        throw new Error(`Complex types not supported in literals: ${JSON.stringify(literal.type)}`);
    }
}

export function typeToGaiaType(type: GoType): string {
    if (typeof type === 'string') {
        switch (type) {
            case 'int':
            case 'int8':
            case 'int16':
            case 'int32':
            case 'int64':
            case 'uint':
            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'uint64':
            case 'float32':
            case 'float64':
            case 'byte':
            case 'rune':
                return 'Number';
            case 'string':
                return 'String';
            case 'bool':
                return 'Boolean';
            case 'void':
                return 'Void';
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    } else {
        // 处理复合类型
        switch (type.kind) {
            case 'slice':
            case 'array':
                return 'Array';
            case 'pointer':
                return 'Pointer';
            case 'struct':
                return 'Struct';
            case 'interface':
                return 'Interface';
            default:
                throw new Error(`Unsupported complex type: ${JSON.stringify(type)}`);
        }
    }
}