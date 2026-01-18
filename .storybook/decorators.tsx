import type { Decorator, StoryContext } from "@storybook/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"

type StoryFn = () => React.ReactNode

/**
 * Router decorator - wraps stories with React Router
 * Required for components that use routing
 */
export const withRouter: Decorator = (Story: StoryFn) => (
  <BrowserRouter>
    <Story />
  </BrowserRouter>
)

/**
 * Theme decorator - applies dark/light theme based on global setting
 */
const ThemeWrapper: React.FC<{ theme: string; children: React.ReactNode }> = ({ theme, children }) => {
  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [theme])

  return <>{children}</>
}

export const withTheme: Decorator = (Story: StoryFn, context: StoryContext) => {
  const theme = context.globals.theme || "light"

  return (
    <ThemeWrapper theme={theme}>
      <Story />
    </ThemeWrapper>
  )
}

/**
 * Full page decorator - removes padding for full-page stories
 */
export const withFullPage: Decorator = (Story: StoryFn) => (
  <div style={{ margin: "-1rem", minHeight: "100vh" }}>
    <Story />
  </div>
)

/**
 * Map container decorator - provides appropriate sizing for map components
 */
export const withMapContainer: Decorator = (Story: StoryFn) => (
  <div style={{ width: "100%", height: "600px", position: "relative" }}>
    <Story />
  </div>
)