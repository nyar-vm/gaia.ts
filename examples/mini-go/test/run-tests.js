const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Mini-Go Compiler Tests\n');

// 确保编译器已构建
console.log('📦 Building compiler...');
try {
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log('✅ Build successful\n');
} catch (error) {
    console.log('❌ Build failed');
    process.exit(1);
}

// 测试文件列表
const testFiles = [
    'hello.go',
    'struct.go'
];

let passedTests = 0;
let totalTests = testFiles.length;

for (const testFile of testFiles) {
    const testPath = path.join(__dirname, testFile);
    
    if (!fs.existsSync(testPath)) {
        console.log(`⚠️  Test file not found: ${testFile}`);
        continue;
    }
    
    console.log(`🔍 Testing: ${testFile}`);
    
    try {
        // 运行编译器
        const output = execSync(`node dist/index.js test/${testFile}`, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8'
        });
        
        console.log(`✅ ${testFile} compiled successfully`);
        
        // 检查输出是否包含预期内容
        if (output.includes('Compilation successful')) {
            console.log(`   📊 Output: ${output.split('\n')[1] || 'No additional info'}`);
            passedTests++;
        } else {
            console.log(`   ⚠️  Unexpected output format`);
        }
        
    } catch (error) {
        console.log(`❌ ${testFile} compilation failed:`);
        console.log(`   Error: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
}

// 测试结果总结
console.log('📋 Test Results Summary:');
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log('💥 Some tests failed');
    process.exit(1);
}