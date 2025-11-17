import React from "react"
import { Decorator } from "@storybook/react"
import { BrowserRouter } from "react-router-dom"

/**
 * Router decorator - wraps stories with React Router
 * Required for components that use routing
 */
export const withRouter: Decorator = (Story) => (
  <BrowserRouter>
    <Story />
  </BrowserRouter>
)

/**
 * Theme decorator - applies dark/light theme based on global setting
 */
export const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme || "light"
  
  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [theme])

  return <Story />
}

/**
 * Full page decorator - removes padding for full-page stories
 */
export const withFullPage: Decorator = (Story) => (
  <div style={{ margin: "-1rem", minHeight: "100vh" }}>
    <Story />
  </div>
)

/**
 * Map container decorator - provides appropriate sizing for map components
 */
export const withMapContainer: Decorator = (Story) => (
  <div style={{ width: "100%", height: "600px", position: "relative" }}>
    <Story />
  </div>
)
