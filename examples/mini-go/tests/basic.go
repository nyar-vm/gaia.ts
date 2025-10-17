package main

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func factorial(n int) int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n-1)
}

func main() {
    // 测试递归函数
    var fib int = fibonacci(10)
    var fact int = factorial(5)
    
    // 测试常量
    const PI float64 = 3.14159
    const MAX_SIZE int = 100
    
    // 测试变量声明的不同方式
    var x int = 10
    y := 20
    var z int
    z = 30
    
    // 测试数学运算
    sum := x + y + z
    product := x * y
    quotient := y / x
    remainder := y % x
    
    // 测试逻辑运算
    isPositive := sum > 0
    isEven := (sum % 2) == 0
    
    // 测试位运算
    bitwiseAnd := x & y
    bitwiseOr := x | y
    bitwiseXor := x ^ y
    leftShift := x << 2
    rightShift := y >> 1
}