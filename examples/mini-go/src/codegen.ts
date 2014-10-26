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
    GoType
} from './ast';

// 假设我们有一个gaia-frontend-wasm32库可以导入
// 在实际实现中，这里会导入实际的Gaia类型和函数
// import { GaiaInstruction, GaiaProgram, GaiaFunction, GaiaType } from 'gaia-frontend-wasm32';

// 为了示例，我们先定义一些基本的Gaia类型
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

    constructor() {
        this.program = new GaiaProgram([]);
    }

    public generate(program: Program): GaiaProgram {
        this.program = new GaiaProgram([]);
        
        // 处理包声明
        if (program.package) {
            // 在实际实现中，这里可能需要设置包信息
        }

        // 处理导入声明
        for (const importDecl of program.imports) {
            this.generateImport(importDecl);
        }

        // 处理声明
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
                throw new Error(`Unsupported statement kind: ${stmt.kind}`);
        }
    }

    private generateVariableDeclaration(stmt: VariableDeclaration): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 处理多个变量声明
        for (let i = 0; i < stmt.names.length; i++) {
            const name = stmt.names[i];
            const initializer = stmt.initializers?.[i];

            if (initializer) {
                instructions.push(...this.generateExpression(initializer));
            }

            // 分配局部变量索引
            const index = this.localIndex++;
            this.localVariables.set(name, index);

            // 如果有初始值，存储到局部变量
            if (initializer) {
                instructions.push(new GaiaInstruction('StoreLocal', [index]));
            }
        }

        return instructions;
    }

    private generateReturnStatement(stmt: ReturnStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 处理多个返回值
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

        // 生成条件表达式
        instructions.push(...this.generateExpression(stmt.condition));

        // 创建跳转标签
        const elseLabel = `else_${Date.now()}`;
        const endLabel = `end_${Date.now()}`;

        // 条件跳转到else分支
        instructions.push(new GaiaInstruction('JumpIfFalse', [elseLabel]));

        // 生成then分支
        instructions.push(...this.generateStatement(stmt.body));

        // 跳转到结束
        instructions.push(new GaiaInstruction('Jump', [endLabel]));

        // 生成else分支
        instructions.push(new GaiaInstruction('Label', [elseLabel]));

        if (stmt.else) {
            instructions.push(...this.generateStatement(stmt.else));
        }

        // 结束标签
        instructions.push(new GaiaInstruction('Label', [endLabel]));

        return instructions;
    }

    private generateForStatement(stmt: ForStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];
        
        // 生成初始化语句
        if (stmt.init) {
            instructions.push(...this.generateStatement(stmt.init));
        }
        
        // 循环开始标签
        const loopStart = instructions.length;
        
        // 生成条件表达式
        if (stmt.condition) {
            const conditionInstructions = this.generateExpression(stmt.condition);
            instructions.push(...conditionInstructions);
            
            // 条件跳转指令 - 如果条件为假，跳出循环
            const jumpIfFalse = new GaiaInstruction('JUMP_IF_FALSE', [0]); // 占位符
            instructions.push(jumpIfFalse);
            
            // 生成循环体
            instructions.push(...this.generateStatement(stmt.body));
            
            // 生成更新语句
            if (stmt.post) {
                instructions.push(...this.generateStatement(stmt.post));
            }
            
            // 跳回循环开始
            instructions.push(new GaiaInstruction('JUMP', [loopStart]));
            
            // 更新条件跳转的目标地址
            jumpIfFalse.operands[0] = instructions.length;
        } else {
            // 无限循环
            instructions.push(...this.generateStatement(stmt.body));
            
            // 生成更新语句
            if (stmt.post) {
                instructions.push(...this.generateStatement(stmt.post));
            }
            
            // 跳回循环开始
            instructions.push(new GaiaInstruction('JUMP', [loopStart]));
        }
        
        return instructions;
    }

    private generateRangeStatement(stmt: RangeStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];
        
        // 生成被迭代的表达式
        instructions.push(...this.generateExpression(stmt.iterable));
        
        // 创建迭代器
        instructions.push(new GaiaInstruction('CREATE_ITERATOR'));
        
        // 循环开始标签
        const loopStart = instructions.length;
        
        // 检查迭代器是否有下一个元素
        instructions.push(new GaiaInstruction('ITERATOR_HAS_NEXT'));
        
        // 如果没有下一个元素，跳出循环
        const jumpIfFalse = new GaiaInstruction('JUMP_IF_FALSE', [0]); // 占位符
        instructions.push(jumpIfFalse);
        
        // 获取下一个元素
        instructions.push(new GaiaInstruction('ITERATOR_NEXT'));
        
        // 将值赋给循环变量
        if (stmt.key) {
            instructions.push(new GaiaInstruction('STORE_LOCAL', [this.getLocalIndex(stmt.key.name)]));
        }
        if (stmt.value) {
            instructions.push(new GaiaInstruction('STORE_LOCAL', [this.getLocalIndex(stmt.value.name)]));
        }
        
        // 生成循环体
        instructions.push(...this.generateStatement(stmt.body));
        
        // 跳回循环开始
        instructions.push(new GaiaInstruction('JUMP', [loopStart]));
        
        // 更新条件跳转的目标地址
        jumpIfFalse.operands[0] = instructions.length;
        
        return instructions;
    }

    private generateSwitchStatement(stmt: SwitchStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];
        
        // 生成 switch 表达式
        if (stmt.tag) {
            instructions.push(...this.generateExpression(stmt.tag));
        }
        
        const caseJumps: GaiaInstruction[] = [];
        const endJumps: GaiaInstruction[] = [];
        
        // 为每个 case 生成代码
        for (const caseClause of stmt.cases) {
            if (caseClause.values) {
                // 普通 case
                for (const value of caseClause.values) {
                    // 复制 switch 表达式的值
                    instructions.push(new GaiaInstruction('DUP'));
                    // 生成 case 值
                    instructions.push(...this.generateExpression(value));
                    // 比较
                    instructions.push(new GaiaInstruction('EQUAL'));
                    // 如果相等，跳转到 case 体
                    const jumpIfTrue = new GaiaInstruction('JUMP_IF_TRUE', [0]); // 占位符
                    instructions.push(jumpIfTrue);
                    caseJumps.push(jumpIfTrue);
                }
            } else {
                // default case
                const jumpToDefault = new GaiaInstruction('JUMP', [0]); // 占位符
                instructions.push(jumpToDefault);
                caseJumps.push(jumpToDefault);
            }
        }
        
        // 如果没有匹配的 case，跳到结束
        const jumpToEnd = new GaiaInstruction('JUMP', [0]); // 占位符
        instructions.push(jumpToEnd);
        endJumps.push(jumpToEnd);
        
        // 生成每个 case 的代码体
        for (let i = 0; i < stmt.cases.length; i++) {
            const caseClause = stmt.cases[i];
            
            // 更新跳转地址
            if (caseJumps[i]) {
                caseJumps[i].operands[0] = instructions.length;
            }
            
            // 生成 case 体
            for (const statement of caseClause.body) {
                instructions.push(...this.generateStatement(statement));
            }
            
            // 默认跳到结束（Go 中没有自动 fallthrough）
            const jumpToEnd = new GaiaInstruction('JUMP', [0]); // 占位符
            instructions.push(jumpToEnd);
            endJumps.push(jumpToEnd);
        }
        
        // 更新所有跳到结束的地址
        for (const jump of endJumps) {
            jump.operands[0] = instructions.length;
        }
        
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
        // 在实际实现中，这里需要跳转到最近的循环或 switch 的结束
        return [new GaiaInstruction('BREAK')];
    }

    private generateContinueStatement(stmt: ContinueStatement): GaiaInstruction[] {
        // 在实际实现中，这里需要跳转到最近的循环的开始
        return [new GaiaInstruction('CONTINUE')];
    }

    private generateGotoStatement(stmt: GotoStatement): GaiaInstruction[] {
        return [new GaiaInstruction('GOTO', [stmt.label])];
    }

    private generateLabeledStatement(stmt: LabeledStatement): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];
        
        // 记录标签位置
        this.labels.set(stmt.label, instructions.length);
        
        // 生成标签后的语句
        instructions.push(...this.generateStatement(stmt.statement));
        
        return instructions;
    }

    private generateDeferStatement(stmt: DeferStatement): GaiaInstruction[] {
        // 将 defer 语句的指令添加到 defer 栈中
        const deferInstructions = this.generateExpression(stmt.call);
        this.deferStack.push(deferInstructions);
        
        // defer 语句本身不生成立即执行的指令
        return [];
    }

    private generateGoStatement(stmt: GoStatement): GaiaInstruction[] {
        // 生成 goroutine 启动指令
        const instructions: GaiaInstruction[] = [];
        
        // 生成要在 goroutine 中执行的调用
        const goroutineInstructions = this.generateExpression(stmt.call);
        
        // 创建 goroutine
        instructions.push(new GaiaInstruction('CREATE_GOROUTINE', [goroutineInstructions]));
        
        return instructions;
    }

    private generateExpressionStatement(stmt: ExpressionStatement): GaiaInstruction[] {
        const instructions = this.generateExpression(stmt.expression);

        // 如果表达式有结果但未被使用，弹出它
        if (stmt.expression.kind !== 'CallExpression') {
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
        const index = this.localVariables.get(expr.name);

        if (index === undefined) {
            throw new Error(`Undefined variable: ${expr.name}`);
        }

        return [new GaiaInstruction('LoadLocal', [index])];
    }

    private generateBinaryExpression(expr: BinaryExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成左右操作数
        instructions.push(...this.generateExpression(expr.left));
        instructions.push(...this.generateExpression(expr.right));

        // 根据运算符生成对应的指令
        switch (expr.operator) {
            case 'Add':
                instructions.push(new GaiaInstruction('Add'));
                break;
            case 'Subtract':
                instructions.push(new GaiaInstruction('Subtract'));
                break;
            case 'Multiply':
                instructions.push(new GaiaInstruction('Multiply'));
                break;
            case 'Divide':
                instructions.push(new GaiaInstruction('Divide'));
                break;
            case 'Equal':
                instructions.push(new GaiaInstruction('CompareEqual'));
                break;
            case 'NotEqual':
                instructions.push(new GaiaInstruction('CompareEqual'));
                instructions.push(new GaiaInstruction('Not'));
                break;
            case 'LessThan':
                instructions.push(new GaiaInstruction('CompareLess'));
                break;
            case 'LessThanOrEqual':
                instructions.push(new GaiaInstruction('CompareLessOrEqual'));
                break;
            case 'GreaterThan':
                instructions.push(new GaiaInstruction('CompareGreater'));
                break;
            case 'GreaterThanOrEqual':
                instructions.push(new GaiaInstruction('CompareGreaterOrEqual'));
                break;
            default:
                throw new Error(`Unsupported binary operator: ${expr.operator}`);
        }

        return instructions;
    }

    private generateUnaryExpression(expr: UnaryExpression): GaiaInstruction[] {
        const instructions: GaiaInstruction[] = [];

        // 生成操作数
        instructions.push(...this.generateExpression(expr.operand));

        // 根据运算符生成对应的指令
        switch (expr.operator) {
            case 'Minus':
                instructions.push(new GaiaInstruction('Negate'));
                break;
            case 'Not':
                instructions.push(new GaiaInstruction('Not'));
                break;
            case 'Plus':
                // 一元加号通常不需要操作
                break;
            case 'BitwiseNot':
                instructions.push(new GaiaInstruction('BitwiseNot'));
                break;
            case 'Address':
                instructions.push(new GaiaInstruction('Address'));
                break;
            case 'Dereference':
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
        } else {
            // 对于复杂的调用表达式，先生成 callee
            instructions.push(...this.generateExpression(expr.callee));
            functionName = 'dynamic_call';
        }
        
        instructions.push(new GaiaInstruction('Call', [functionName, expr.arguments.length]));

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
}