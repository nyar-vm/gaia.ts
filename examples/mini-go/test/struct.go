package main

import "fmt"

type Person struct {
    name string
    age  int
}

type Rectangle struct {
    width  float64
    height float64
}

func (r Rectangle) area() float64 {
    return r.width * r.height
}

func (r Rectangle) perimeter() float64 {
    return 2 * (r.width + r.height)
}

func (p *Person) birthday() {
    p.age++
}

func main() {
    // 测试结构体
    person := Person{
        name: "Alice",
        age:  30,
    }
    
    fmt.Printf("Person: %s, Age: %d\n", person.name, person.age)
    
    // 测试方法调用
    person.birthday()
    fmt.Printf("After birthday: %s, Age: %d\n", person.name, person.age)
    
    // 测试几何计算
    rect := Rectangle{
        width:  10.0,
        height: 5.0,
    }
    
    fmt.Printf("Rectangle area: %.2f\n", rect.area())
    fmt.Printf("Rectangle perimeter: %.2f\n", rect.perimeter())
    
    // 测试数组和切片
    numbers := []int{1, 2, 3, 4, 5}
    
    for i, num := range numbers {
        fmt.Printf("Index %d: %d\n", i, num)
    }
    
    // 测试 switch 语句
    day := "Monday"
    switch day {
    case "Monday":
        fmt.Println("Start of the work week")
    case "Friday":
        fmt.Println("TGIF!")
    default:
        fmt.Println("Regular day")
    }
}