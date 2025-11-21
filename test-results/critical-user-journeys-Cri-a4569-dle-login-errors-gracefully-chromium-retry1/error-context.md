# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]: "[plugin:vite:react-swc] x Expected '{', got 'interface' ,-[/Users/andrewmorton/Documents/GitHub/pmo-tools/src/hooks/useWorkbenchKeyboard.ts:28:1] 25 | | 'filter' 26 | | 'sort' 27 | 28 | export interface WorkbenchKeyboardHandlers { : ^^^^^^^^^ 29 | [key in WorkbenchKeyboardAction]?: () => void 30 | } `---- Caused by: Syntax Error"
  - generic [ref=e6]: /Users/andrewmorton/Documents/GitHub/pmo-tools/src/hooks/useWorkbenchKeyboard.ts
  - generic [ref=e7]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e8]: server.hmr.overlay
    - text: to
    - code [ref=e9]: "false"
    - text: in
    - code [ref=e10]: vite.config.ts
    - text: .
```