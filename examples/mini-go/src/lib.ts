// 导出所有模块
export * from './ast';
export * from './lexer';
export * from './parser';
export * from './codegen';
export * from './pe';

// 导出主要的编译器类
import {Parser} from './parser';
import {CodeGenerator} from './codegen';
import {emitPE, PEEmitOptions} from './pe';

export class MiniGoCompiler {
    private parser: Parser;
    private codegen: CodeGenerator;

    constructor(input: string) {
        this.parser = new Parser(input);
        this.codegen = new CodeGenerator();
    }

    public compile() {
        try {
            const ast = this.parser.parse();
            const gaiaProgram = this.codegen.generate(ast);

            // 增强返回的程序信息
            const enhancedProgram = {
                ...gaiaProgram,
                packageName: ast.package?.name,
                imports: ast.imports?.map(imp => imp.path) || [],
                sourceInfo: {
                    totalLines: this.parser.getSourceLines(),
                    compiledAt: new Date().toISOString()
                }
            };

            return {
                success: true,
                program: enhancedProgram,
                ast: ast
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    public compileToPE(options: PEEmitOptions = {}): Uint8Array {
        // 当前阶段：直接生成最小可运行 PE，忽略 IR 指令
        // 后续版本会将 GaiaProgram 指令映射到 .text
        return emitPE(options);
    }
}

// 保持向后兼容性
export class MiniTSParser extends MiniGoCompiler {
    public parse() {
        return this.compile();
    }
}