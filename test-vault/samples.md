# TEMPL samples

## Component definition

```templ
package views

import "fmt"

// Greet says hello.
templ Greet(name string) {
    <div class="greeting">
        <h1>Hello, { name }!</h1>
        if name == "world" {
            <p>Welcome.</p>
        }
    </div>
}
```

## Component call

```templ
templ Page() {
    @Nav.Header()
    <main>{ fmt.Sprintf("count=%d", 3) }</main>
}
```

## Script and css blocks

```templ
script onClick(msg string) {
    alert(msg);
}

css primary() {
    color: #336;
}
```

## Control flow

```templ
templ List(items []string) {
    for _, it := range items {
        <li>{ it }</li>
    }
    switch len(items) {
        case 0:
            <p>empty</p>
        default:
            <p>some</p>
    }
}
```
