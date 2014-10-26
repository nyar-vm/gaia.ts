import {readFileSync} from 'fs';
import {MiniGoCompiler} from './lib';

function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node dist/index.js <input-file>');
        console.log('Compiles Go source files to Gaia assembly');
        process.exit(1);
    }

    const inputFile = process.argv[2];
    
    // 检查文件扩展名
    if (!inputFile.endsWith('.go')) {
        console.log('Error: Input file must have .go extension');
        process.exit(1);
    }

    const sourceCode = readFileSync(inputFile, 'utf8');

    console.log(`Compiling Go file: ${inputFile}...`);

    const compiler = new MiniGoCompiler(sourceCode);
    const result = compiler.compile();

    if (result.success && result.program) {
        console.log('✅ Compilation successful!');
        
        if (result.program.packageName) {
            console.log(`📦 Package: ${result.program.packageName}`);
        }
        
        console.log(`🔧 Functions: ${result.program.functions.length}`);

        for (const func of result.program.functions) {
            console.log(`  • ${func.name}: ${func.instructions.length} instructions`);
            console.log(`    Parameters: ${func.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`);
            console.log(`    Return type: ${func.returnType}`);
        }

        // 输出生成的 Gaia 指令（可选）
        if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
            console.log('\n📋 Generated Gaia Instructions:');
            for (const func of result.program.functions) {
                console.log(`\nFunction ${func.name}:`);
                func.instructions.forEach((instr, i) => {
                    console.log(`  ${i.toString().padStart(3, '0')}: ${instr.opcode} ${instr.operands.join(', ')}`);
                });
            }
        }
    } else {
        console.log('❌ Compilation failed:');
        console.log(result.error);
        process.exit(1);
    }
}

main();