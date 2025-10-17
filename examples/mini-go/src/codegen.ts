import {
    BinaryExpression,
    CallExpression,
    Expression,
    ExpressionStatement,
    FunctionDeclaration,
    Identifier,
    IfStatement,
    Literal,
    literalToGaiaConstant,
    Program,
    ReturnStatement,
    Statement,
    typeToGaiaType,
    UnaryExpression,
    VariableDeclaration,
    PackageDeclaration,
    ImportDeclaration,
    ConstantDeclaration,
    Declaration,
    BlockStatement,
    ForStatement,
    RangeStatement,
    SwitchStatement,
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
    TypeDeclaration,
    GoType,
    CaseClause
} from './ast';

// 占位符类，实际应该从 gaia-frontend 导入
class GaiaInstruction {
    constructor(public opcode: string, public operands: any[] = []) {
    }
}

class GaiaFunction {
    constructor(
        public name: string,
        public parameters: { name: string; type: string }[],
        public returnType: string,
        public instructions: GaiaInstruction[]
    ) {
    }
}

class GaiaProgram {
    constructor(public functions: GaiaFunction[]) {
    }
}

export class CodeGenerator {
    private program: GaiaProgram;
    private currentFunction?: GaiaFunction;
    private localVariables: Map<string, number> = new Map();
    private localIndex: number = 0;
    private globalVariables: Map<string, string> = new Map();
    private constants: Map<string, any> = new Map();
    private types: Map<string, GoType> = new Map();
    private labels: Map<string, number> = new Map();
    private deferStack: GaiaInstruction[][] = [];
    private labelCounter: number = 0;

    constructor() {
        this.program = new GaiaProgram([]);
    }

    public generate(program: Program): GaiaProgram {
        // 处理包声明
        // 在实际实现中，这里可能需要设置包的元数据

        // 处理导入声明
        for (const importDecl of program.imports) {
            this.generateImport(importDecl);
        }

        // 处理顶级声明
        for (const decl of program.declarations) {
            this.generateDeclaration(decl);
        }

        return this.program;
    }

    private generateImport(importDecl: ImportDeclaration): void {
        // 在实际实现中，这里会处理导入的包
        // 可能需要加载外部库或设置符号表
    }

    private generateDeclaration(decl: Declaration): void {
        switch (decl.kind) {
            case 'FunctionDeclaration':
                this.generateFunction(decl);
                break;
            case 'VariableDeclaration':
                this.generateGlobalVariable(decl);
                break;
            case 'ConstantDeclaration':
                this.generateConstant(decl);
                break;
            case 'TypeDeclaration':
                this.generateType(decl);
                break;
            case 'StructDeclaration':
                this.generateStruct(decl);
                break;
            case 'InterfaceDeclaration':
                this.generateInterface(decl);
                break;
            case 'MethodDeclaration':
                this.generateMethod(decl);
                break;
            default:
                throw new Error(`Unsupported declaration kind: ${(decl as any).kind}`);
        }
    }

    private generateGlobalVariable(decl: VariableDeclaration): void {
        // 处理全局变量声明
        for (let i = 0; i < decl.names.length; i++) {
            const name = decl.names[i];
            this.globalVariables.set(name, typeToGaiaType(decl.type!));
            
            if (decl.initializers && decl.initializers[i]) {
                // 生成全局变量初始化代码
                const initInstructions = this.generateExpression(decl.initializers[i]);
                // 在实际实现中，这里会将初始化指令添加到全局初始化函数中
            }
        }
    }

    private generateConstant(decl: ConstantDeclaration): void {
        // 处理常量声明
        for (let i = 0; i < decl.names.length; i++) {
            const name = decl.names[i];
            const value = decl.values?.[i];
            if (value) {
                this.constants.set(name, value);
            }
        }
    }

    private generateType(decl: TypeDeclaration): void {
        // 处理类型声明
        this.types.set(decl.name, decl.type);
    }

    private generateStruct(decl: StructDeclaration): void {
        // 处理结构体声明
        const structType: GoType = {
            kind: 'struct',
            name: decl.name
        };
        this.types.set(decl.name, structType);
    }

    private generateInterface(decl: InterfaceDeclaration): void {
        // 处理接口声明
        const interfaceType: GoType = {
            kind: 'interface',
            name: decl.name
        };
        this.types.set(decl.name, interfaceType);
    }

    private generateMethod(decl: MethodDeclaration): void {
        // 处理方法声明
        // 方法类似于函数，但有接收者
        this.generateFunction(decl as any); // 简化处理
    }

    private generateFunction(func: FunctionDeclaration): void {
        // 重置局部变量状态
        this.localVariables = new Map();
        this.localIndex = 0;

        // 创建参数映射
        for (let i = 0; i < func.parameters.length; i++) {
            this.localVariables.set(func.parameters[i].name, i);
        }

        // 生成函数体
        const instructions: GaiaInstruction[] = [];

        for (const stmt of func.body.statements) {
            instructions.push(...this.generateStatement(stmt));
        }

        // 如果函数没有返回语句且返回类型不是void，添加默认返回
        const returnType = func.returnType || 'void';
        if (returnType !== 'void' &&
            (!func.body.statements.length || func.body.statements[func.body.statements.length - 1].kind !== 'ReturnStatement')) {
            instructions.push(new GaiaInstruction('Push', [literalToGaiaConstant({
                kind: 'Literal',
                type: returnType,
                value: returnType === 'bool' ? false : 0
            })]));
            instructions.push(new GaiaInstruction('Return'));
        }

        // 创建Gaia函数
        const gaiaFunc = new GaiaFunction(
            func.name,
            func.parameters.map(p => ({name: p.name, type: typeToGaiaType(p.type)})),
            typeToGaiaType(returnType),
            instructions
        );

        this.program.functions.push(gaiaFunc);
    }

    private generateStatement(stmt: Statement): GaiaInstruction[] {
        switch (stmt.kind) {
            case 'VariableDeclaration':
                return this.generateVariableDeclaration(stmt);
            case 'ReturnStatement':
                return this.generateReturnStatement(stmt);
            case 'IfStatement':
                return this.generateIfStatement(stmt);
            case 'ForStatement':
                return this.generateForStatement(stmt);
            case 'RangeStatement':
                return this.generateRangeStatement(stmt);
            case 'SwitchStatement':
                return this.generateSwitchStatement(stmt);
            case 'BlockStatement':
                return this.generateBlockStatement(stmt);
            case 'BreakStatement':
                return this.generateBreakStatement(stmt);
            case 'ContinueStatement':
                return this.generateContinueStatement(stmt);
            case 'GotoStatement':
                return this.generateGotoStatement(stmt);
            case 'LabeledStatement':
                return this.generateLabeledStatement(stmt);
            case 'DeferStatement':
                return this.generateDeferStatement(stmt);
            case 'GoStatement':
                return this.generateGoStatement(stmt);
            case 'ExpressionStatement':
                return this.generateExpressionStatement(stmt);
            default:
                throw new Error(`Unsupported statement kind: ${(stmt as any).kind}`);
        }
    }

    private generateVariableDeclaration(stmt: VariableDeclaration): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        for (let i = 0; i < stmt.names.length; i++) {
            const name = stmt.names[i];
            const localIndex = this.localIndex++;
            this.localVariables.set(name, localIndex);

            if (stmt.initializers && stmt.initializers[i]) {
                // 生成初始化表达式
                instructions.push(...this.generateExpression(stmt.initializers[i]));
                // 存储到局部变量
                instructions.push(new GaiaInstruction('StoreLocal', [localIndex]));
            } else {
                // 使用默认值初始化
                const defaultValue = this.getDefaultValue(stmt.type);
                instructions.push(new GaiaInstruction('Push', [defaultValue]));
                instructions.push(new GaiaInstruction('StoreLocal', [localIndex]));
            }
        }

        return instructions;
    }

    private generateReturnStatement(stmt: ReturnStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        if (stmt.values && stmt.values.length > 0) {
            for (const value of stmt.values) {
                instructions.push(...this.generateExpression(value));
            }
        }

        instructions.push(new GaiaInstruction('Return'));
        return instructions;
    }

    private generateIfStatement(stmt: IfStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成初始化语句（如果有）
        if (stmt.init) {
            instructions.push(...this.generateStatement(stmt.init));
        }

        // 生成条件表达式
        instructions.push(...this.generateExpression(stmt.condition));

        // 创建标签
        const elseLabel = this.generateLabel();
        const endLabel = this.generateLabel();

        // 条件跳转
        instructions.push(new GaiaInstruction('JumpIfFalse', [elseLabel]));

        // 生成 then 分支
        instructions.push(...this.generateStatement(stmt.body));
        instructions.push(new GaiaInstruction('Jump', [endLabel]));

        // else 分支
        instructions.push(new GaiaInstruction('Label', [elseLabel]));
        if (stmt.else) {
            instructions.push(...this.generateStatement(stmt.else));
        }

        instructions.push(new GaiaInstruction('Label', [endLabel]));
        return instructions;
    }

    private generateForStatement(stmt: ForStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成初始化语句
        if (stmt.init) {
            instructions.push(...this.generateStatement(stmt.init));
        }

        const loopStart = this.generateLabel();
        const loopEnd = this.generateLabel();

        instructions.push(new GaiaInstruction('Label', [loopStart]));

        // 生成条件检查
        if (stmt.condition) {
            instructions.push(...this.generateExpression(stmt.condition));
            instructions.push(new GaiaInstruction('JumpIfFalse', [loopEnd]));
        }

        // 生成循环体
        instructions.push(...this.generateStatement(stmt.body));

        // 生成后置语句
        if (stmt.post) {
            instructions.push(...this.generateStatement(stmt.post));
        }

        instructions.push(new GaiaInstruction('Jump', [loopStart]));
        instructions.push(new GaiaInstruction('Label', [loopEnd]));

        return instructions;
    }

    private generateRangeStatement(stmt: RangeStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成可迭代对象
        instructions.push(...this.generateExpression(stmt.iterable));

        const loopStart = this.generateLabel();
        const loopEnd = this.generateLabel();

        // 初始化迭代器
        instructions.push(new GaiaInstruction('InitIterator'));

        instructions.push(new GaiaInstruction('Label', [loopStart]));

        // 检查是否还有元素
        instructions.push(new GaiaInstruction('HasNext'));
        instructions.push(new GaiaInstruction('JumpIfFalse', [loopEnd]));

        // 获取下一个元素
        if (stmt.value) {
            // key, value := range iterable
            instructions.push(new GaiaInstruction('NextKeyValue'));
            const valueIndex = this.getLocalIndex(stmt.value.name);
            instructions.push(new GaiaInstruction('StoreLocal', [valueIndex]));
        } else {
            // key := range iterable
            instructions.push(new GaiaInstruction('NextKey'));
        }

        const keyIndex = this.getLocalIndex(stmt.key.name);
        instructions.push(new GaiaInstruction('StoreLocal', [keyIndex]));

        // 生成循环体
        instructions.push(...this.generateStatement(stmt.body));

        instructions.push(new GaiaInstruction('Jump', [loopStart]));
        instructions.push(new GaiaInstruction('Label', [loopEnd]));

        return instructions;
    }

    private generateSwitchStatement(stmt: SwitchStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成初始化语句（如果有）
        if (stmt.init) {
            instructions.push(...this.generateStatement(stmt.init));
        }

        // 生成 tag 表达式（如果有）
        if (stmt.tag) {
            instructions.push(...this.generateExpression(stmt.tag));
        } else {
            // 如果没有 tag，默认为 true
            instructions.push(new GaiaInstruction('Push', [true]));
        }

        const endLabel = this.generateLabel();
        const caseLabels: string[] = [];

        // 为每个 case 生成标签
        for (let i = 0; i < stmt.cases.length; i++) {
            caseLabels.push(this.generateLabel());
        }

        // 生成 case 匹配逻辑
        for (let i = 0; i < stmt.cases.length; i++) {
            const caseClause = stmt.cases[i];
            
            if (caseClause.values) {
                // 普通 case
                for (const value of caseClause.values) {
                    instructions.push(new GaiaInstruction('Dup')); // 复制 tag 值
                    instructions.push(...this.generateExpression(value));
                    instructions.push(new GaiaInstruction('CompareEqual'));
                    instructions.push(new GaiaInstruction('JumpIfTrue', [caseLabels[i]]));
                }
            } else {
                // default case
                instructions.push(new GaiaInstruction('Jump', [caseLabels[i]]));
            }
        }

        // 如果没有匹配的 case，跳到结束
        instructions.push(new GaiaInstruction('Jump', [endLabel]));

        // 生成各个 case 的代码
        for (let i = 0; i < stmt.cases.length; i++) {
            const caseClause = stmt.cases[i];
            instructions.push(new GaiaInstruction('Label', [caseLabels[i]]));
            
            for (const bodyStmt of caseClause.body) {
                instructions.push(...this.generateStatement(bodyStmt));
            }
            
            // 如果没有 break，继续执行下一个 case（fallthrough）
            // Go 默认不会 fallthrough，所以这里添加跳转到结束
            instructions.push(new GaiaInstruction('Jump', [endLabel]));
        }

        instructions.push(new GaiaInstruction('Label', [endLabel]));
        instructions.push(new GaiaInstruction('Pop')); // 清理栈上的 tag 值

        return instructions;
    }

    private generateBlockStatement(stmt: BlockStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        for (const statement of stmt.statements) {
            instructions.push(...this.generateStatement(statement));
        }

        return instructions;
    }

    private generateBreakStatement(stmt: BreakStatement): GaiaInstruction[] {
        // 在实际实现中，需要跳转到最近的循环或 switch 的结束标签
        return [new GaiaInstruction('Break', [stmt.label])];
    }

    private generateContinueStatement(stmt: ContinueStatement): GaiaInstruction[] {
        // 在实际实现中，需要跳转到最近的循环的开始标签
        return [new GaiaInstruction('Continue', [stmt.label])];
    }

    private generateGotoStatement(stmt: GotoStatement): GaiaInstruction[] {
        return [new GaiaInstruction('Jump', [stmt.label])];
    }

    private generateLabeledStatement(stmt: LabeledStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 设置标签
        instructions.push(new GaiaInstruction('Label', [stmt.label]));
        this.labels.set(stmt.label, instructions.length - 1);

        // 生成语句
        instructions.push(...this.generateStatement(stmt.statement));

        return instructions;
    }

    private generateDeferStatement(stmt: DeferStatement): GaiaInstruction[] {
        // defer 语句需要在函数返回时执行
        // 这里简化处理，将 defer 的调用添加到 defer 栈中
        const deferInstructions = this.generateExpression(stmt.call);
        this.deferStack.push(deferInstructions);

        // 返回空指令，实际的 defer 执行会在函数返回时处理
        return [];
    }

    private generateGoStatement(stmt: GoStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成函数调用指令
        instructions.push(...this.generateExpression(stmt.call));

        // 创建新的 goroutine
        instructions.push(new GaiaInstruction('StartGoroutine'));

        return instructions;
    }

    private generateExpressionStatement(stmt: ExpressionStatement): GaiaInstruction[] {
        const instructions = this.generateExpression(stmt.expression);
        
        // 如果表达式有返回值但不被使用，需要从栈中弹出
        if (this.expressionHasValue(stmt.expression)) {
            instructions.push(new GaiaInstruction('Pop'));
        }

        return instructions;
    }

    private generateExpression(expr: Expression): GaiaInstruction[] {
        switch (expr.kind) {
            case 'Literal':
                return this.generateLiteral(expr);
            case 'Identifier':
                return this.generateIdentifier(expr);
            case 'BinaryExpression':
                return this.generateBinaryExpression(expr);
            case 'UnaryExpression':
                return this.generateUnaryExpression(expr);
            case 'CallExpression':
                return this.generateCallExpression(expr);
            case 'IndexExpression':
                return this.generateIndexExpression(expr);
            case 'SelectorExpression':
                return this.generateSelectorExpression(expr);
            case 'SliceExpression':
                return this.generateSliceExpression(expr);
            case 'TypeAssertion':
                return this.generateTypeAssertion(expr);
            default:
                throw new Error(`Unsupported expression kind: ${(expr as any).kind}`);
        }
    }

    private generateLiteral(expr: Literal): GaiaInstruction[] {
        return [new GaiaInstruction('Push', [literalToGaiaConstant(expr)])];
    }

    private generateIdentifier(expr: Identifier): GaiaInstruction[] {
        // 检查是否是常量
        if (this.constants.has(expr.name)) {
            const constant = this.constants.get(expr.name)!;
            return this.generateExpression(constant);
        }

        // 检查是否是局部变量
        const localIndex = this.localVariables.get(expr.name);
        if (localIndex !== undefined) {
            return [new GaiaInstruction('LoadLocal', [localIndex])];
        }

        // 检查是否是全局变量
        if (this.globalVariables.has(expr.name)) {
            return [new GaiaInstruction('LoadGlobal', [expr.name])];
        }

        throw new Error(`Undefined variable: ${expr.name}`);
    }

    private generateBinaryExpression(expr: BinaryExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 处理短路运算符
        if (expr.operator === '&&') {
            const falseLabel = this.generateLabel();
            const endLabel = this.generateLabel();

            instructions.push(...this.generateExpression(expr.left));
            instructions.push(new GaiaInstruction('Dup'));
            instructions.push(new GaiaInstruction('JumpIfFalse', [falseLabel]));
            instructions.push(new GaiaInstruction('Pop'));
            instructions.push(...this.generateExpression(expr.right));
            instructions.push(new GaiaInstruction('Jump', [endLabel]));
            instructions.push(new GaiaInstruction('Label', [falseLabel]));
            instructions.push(new GaiaInstruction('Label', [endLabel]));

            return instructions;
        }

        if (expr.operator === '||') {
            const trueLabel = this.generateLabel();
            const endLabel = this.generateLabel();

            instructions.push(...this.generateExpression(expr.left));
            instructions.push(new GaiaInstruction('Dup'));
            instructions.push(new GaiaInstruction('JumpIfTrue', [trueLabel]));
            instructions.push(new GaiaInstruction('Pop'));
            instructions.push(...this.generateExpression(expr.right));
            instructions.push(new GaiaInstruction('Jump', [endLabel]));
            instructions.push(new GaiaInstruction('Label', [trueLabel]));
            instructions.push(new GaiaInstruction('Label', [endLabel]));

            return instructions;
        }

        // 处理赋值运算符
        if (expr.operator === '=' || expr.operator === ':=') {
            if (expr.left.kind === 'Identifier') {
                instructions.push(...this.generateExpression(expr.right));
                
                if (expr.operator === ':=') {
                    // 短变量声明
                    const localIndex = this.localIndex++;
                    this.localVariables.set(expr.left.name, localIndex);
                    instructions.push(new GaiaInstruction('StoreLocal', [localIndex]));
                } else {
                    // 普通赋值
                    const localIndex = this.localVariables.get(expr.left.name);
                    if (localIndex !== undefined) {
                        instructions.push(new GaiaInstruction('StoreLocal', [localIndex]));
                    } else if (this.globalVariables.has(expr.left.name)) {
                        instructions.push(new GaiaInstruction('StoreGlobal', [expr.left.name]));
                    } else {
                        throw new Error(`Undefined variable: ${expr.left.name}`);
                    }
                }
                return instructions;
            }
        }

        // 普通二元运算符
        instructions.push(...this.generateExpression(expr.left));
        instructions.push(...this.generateExpression(expr.right));

        // 根据运算符生成对应的指令
        switch (expr.operator) {
            case '+':
                instructions.push(new GaiaInstruction('Add'));
                break;
            case '-':
                instructions.push(new GaiaInstruction('Subtract'));
                break;
            case '*':
                instructions.push(new GaiaInstruction('Multiply'));
                break;
            case '/':
                instructions.push(new GaiaInstruction('Divide'));
                break;
            case '%':
                instructions.push(new GaiaInstruction('Modulo'));
                break;
            case '==':
                instructions.push(new GaiaInstruction('CompareEqual'));
                break;
            case '!=':
                instructions.push(new GaiaInstruction('CompareEqual'));
                instructions.push(new GaiaInstruction('Not'));
                break;
            case '<':
                instructions.push(new GaiaInstruction('CompareLess'));
                break;
            case '<=':
                instructions.push(new GaiaInstruction('CompareLessOrEqual'));
                break;
            case '>':
                instructions.push(new GaiaInstruction('CompareGreater'));
                break;
            case '>=':
                instructions.push(new GaiaInstruction('CompareGreaterOrEqual'));
                break;
            case '&':
                instructions.push(new GaiaInstruction('BitwiseAnd'));
                break;
            case '|':
                instructions.push(new GaiaInstruction('BitwiseOr'));
                break;
            case '^':
                instructions.push(new GaiaInstruction('BitwiseXor'));
                break;
            case '<<':
                instructions.push(new GaiaInstruction('ShiftLeft'));
                break;
            case '>>':
                instructions.push(new GaiaInstruction('ShiftRight'));
                break;
            case '&^':
                instructions.push(new GaiaInstruction('BitwiseAndNot'));
                break;
            default:
                throw new Error(`Unsupported binary operator: ${expr.operator}`);
        }

        return instructions;
    }

    private generateUnaryExpression(expr: UnaryExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 处理前置递增/递减
        if (expr.operator === '++' || expr.operator === '--') {
            if (expr.operand.kind === 'Identifier') {
                const localIndex = this.localVariables.get(expr.operand.name);
                if (localIndex !== undefined) {
                    instructions.push(new GaiaInstruction('LoadLocal', [localIndex]));
                    instructions.push(new GaiaInstruction('Push', [1]));
                    instructions.push(new GaiaInstruction(expr.operator === '++' ? 'Add' : 'Subtract'));
                    instructions.push(new GaiaInstruction('Dup'));
                    instructions.push(new GaiaInstruction('StoreLocal', [localIndex]));
                } else {
                    throw new Error(`Undefined variable: ${expr.operand.name}`);
                }
            } else {
                throw new Error('Invalid operand for increment/decrement');
            }
            return instructions;
        }

        // 生成操作数
        instructions.push(...this.generateExpression(expr.operand));

        // 根据运算符生成对应的指令
        switch (expr.operator) {
            case '-':
                instructions.push(new GaiaInstruction('Negate'));
                break;
            case '!':
                instructions.push(new GaiaInstruction('Not'));
                break;
            case '+':
                // 一元加号通常不需要操作
                break;
            case '^':
                instructions.push(new GaiaInstruction('BitwiseNot'));
                break;
            case '&':
                instructions.push(new GaiaInstruction('Address'));
                break;
            case '*':
                instructions.push(new GaiaInstruction('Dereference'));
                break;
            default:
                throw new Error(`Unsupported unary operator: ${expr.operator}`);
        }

        return instructions;
    }

    private generateCallExpression(expr: CallExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成参数
        for (const arg of expr.arguments) {
            instructions.push(...this.generateExpression(arg));
        }

        // 生成函数调用
        let functionName: string;
        if (expr.callee.kind === 'Identifier') {
            functionName = expr.callee.name;
            
            // 检查是否是内置函数
            if (this.isBuiltinFunction(functionName)) {
                instructions.push(new GaiaInstruction('CallBuiltin', [functionName, expr.arguments.length]));
            } else {
                instructions.push(new GaiaInstruction('Call', [functionName, expr.arguments.length]));
            }
        } else {
            // 对于复杂的调用表达式，先生成 callee
            instructions.push(...this.generateExpression(expr.callee));
            instructions.push(new GaiaInstruction('CallIndirect', [expr.arguments.length]));
        }

        return instructions;
    }

    private generateIndexExpression(expr: IndexExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成被索引的表达式
        instructions.push(...this.generateExpression(expr.object));
        
        // 生成索引表达式
        instructions.push(...this.generateExpression(expr.index));
        
        // 生成索引访问指令
        instructions.push(new GaiaInstruction('INDEX'));

        return instructions;
    }

    private generateSelectorExpression(expr: SelectorExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成对象表达式
        instructions.push(...this.generateExpression(expr.object));
        
        // 生成属性访问指令
        instructions.push(new GaiaInstruction('GET_FIELD', [expr.selector.name]));

        return instructions;
    }

    private generateSliceExpression(expr: SliceExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成被切片的表达式
        instructions.push(...this.generateExpression(expr.object));
        
        // 生成起始索引（如果有）
        if (expr.low) {
            instructions.push(...this.generateExpression(expr.low));
        } else {
            instructions.push(new GaiaInstruction('PUSH', [0])); // 默认从 0 开始
        }
        
        // 生成结束索引（如果有）
        if (expr.high) {
            instructions.push(...this.generateExpression(expr.high));
        } else {
            instructions.push(new GaiaInstruction('GET_LENGTH')); // 默认到末尾
        }
        
        // 生成切片指令
        instructions.push(new GaiaInstruction('SLICE'));

        return instructions;
    }

    private generateTypeAssertion(expr: TypeAssertion): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成表达式
        instructions.push(...this.generateExpression(expr.expression));
        
        // 生成类型断言指令
        instructions.push(new GaiaInstruction('TYPE_ASSERT', [expr.type]));

        return instructions;
    }

    private getLocalIndex(name: string): number {
        let index = this.localVariables.get(name);
        if (index === undefined) {
            index = this.localIndex++;
            this.localVariables.set(name, index);
        }
        return index;
    }

    private generateLabel(): string {
        return `L${this.labelCounter++}`;
    }

    private getDefaultValue(type: GoType | undefined): any {
        if (!type) return 0;
        
        if (typeof type === 'string') {
            switch (type) {
                case 'bool': return false;
                case 'string': return '';
                case 'int': case 'int8': case 'int16': case 'int32': case 'int64':
                case 'uint': case 'uint8': case 'uint16': case 'uint32': case 'uint64':
                case 'float32': case 'float64': case 'byte': case 'rune':
                    return 0;
                default: return null;
            }
        }
        
        return null;
    }

    private expressionHasValue(expr: Expression): boolean {
        // 大多数表达式都有返回值，除了一些特殊情况
        return expr.kind !== 'CallExpression' || true; // 简化处理
    }

    private isBuiltinFunction(name: string): boolean {
        const builtins = ['print', 'println', 'len', 'cap', 'make', 'new', 'append', 'copy', 'delete'];
        return builtins.includes(name);
    }
}