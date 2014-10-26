package main

import "fmt"

func main() {
    var message string = "Hello, World!"
    fmt.Println(message)
    
    // 测试基本数据类型
    var num int = 42
    var pi float64 = 3.14159
    var isTrue bool = true
    
    // 测试条件语句
    if num > 0 {
        fmt.Println("Number is positive")
    } else {
        fmt.Println("Number is not positive")
    }
    
    // 测试循环
    for i := 0; i < 3; i++ {
        fmt.Printf("Loop iteration: %d\n", i)
    }
}

func add(a int, b int) int {
    return a + b
}

func greet(name string) {
    fmt.Printf("Hello, %s!\n", name)
}