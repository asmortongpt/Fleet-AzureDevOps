export const resolveCssColor = (cssVarName: string, fallbackVarName?: string): string => {
  if (typeof window === 'undefined' || !cssVarName) {
    return ''
  }

  const root = document.documentElement
  const getVar = (name: string) => getComputedStyle(root).getPropertyValue(name).trim()
  const raw = getVar(cssVarName) || (fallbackVarName ? getVar(fallbackVarName) : '')

  return raw ? `hsl(${raw})` : ''
}
