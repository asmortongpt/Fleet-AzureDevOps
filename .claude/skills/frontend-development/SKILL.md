---
name: frontend-development
description: Comprehensive frontend development guide covering React, TypeScript, modern tooling, and industry best practices. Use this skill when building user interfaces, setting up frontend projects, implementing responsive designs, managing state, optimizing performance, or ensuring accessibility. Trigger when users ask to "build a UI", "create a React app", "make it responsive", "optimize frontend", or "set up a modern frontend project". Includes patterns for React 18+, TypeScript, Vite, Tailwind CSS, state management (Zustand, TanStack Query), testing (Vitest, React Testing Library), and production-ready configurations.
---

# Frontend Development Skill

Modern frontend development with React, TypeScript, and industry-standard tooling. This skill provides patterns, best practices, and complete configurations for building production-ready user interfaces.

## When to Use This Skill

- Building new frontend applications or features
- Setting up React projects with modern tooling
- Implementing responsive, accessible UIs
- State management and data fetching patterns
- Frontend performance optimization
- Component architecture and design systems
- TypeScript integration and type safety
- Testing frontend applications

**Works with**: `pptx` (design mockups), `docx` (technical specs), `theme-factory` (consistent styling)

## Core Technologies & Tools

### Primary Stack
- **React 18+**: Component framework with Hooks, Suspense, Concurrent features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing

### State Management
- **Zustand**: Lightweight global state (simpler than Redux)
- **TanStack Query**: Server state management (formerly React Query)
- **React Context**: Component-level state sharing

### Testing
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing best practices
- **Playwright**: End-to-end testing

### Additional Tools
- **ESLint + Prettier**: Code quality and formatting
- **TypeScript ESLint**: TypeScript-specific linting
- **Husky**: Git hooks for pre-commit checks

## Quick Start: New React Project

```bash
# Create Vite project with React + TypeScript
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install core dependencies
npm install

# Install recommended packages
npm install react-router-dom zustand @tanstack/react-query axios zod

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install dev dependencies
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom happy-dom
```

**Configure Tailwind** (`tailwind.config.js`):
```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Add Tailwind to CSS** (`src/index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

See `references/project-setup.md` for complete configuration files.

## Architecture Patterns

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Input, Card)
│   └── features/       # Feature-specific components
├── pages/              # Page components (routes)
├── hooks/              # Custom React hooks
├── services/           # API calls and external integrations
├── stores/             # Global state (Zustand stores)
│── types/              # TypeScript type definitions
├── utils/              # Helper functions
├── lib/                # Third-party library configurations
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

**Naming conventions**:
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Types: PascalCase (`User.ts`, `ApiResponse.ts`)

### Component Patterns

**1. Function Components with Hooks (preferred)**
```tsx
import { useState, useEffect } from 'react'

interface ProductCardProps {
  id: string
  name: string
  price: number
  onAddToCart: (id: string) => void
}

export function ProductCard({ id, name, price, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="border rounded-lg p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-gray-600">${price.toFixed(2)}</p>
      <button 
        onClick={() => onAddToCart(id)}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add to Cart
      </button>
    </div>
  )
}
```

**2. Custom Hooks for Logic Reuse**
```tsx
// hooks/useCart.ts
import { useState, useCallback } from 'react'

interface CartItem {
  id: string
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  
  const addItem = useCallback((id: string) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === id)
      if (existing) {
        return prev.map(item => 
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { id, quantity: 1 }]
    })
  }, [])
  
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])
  
  const total = items.reduce((sum, item) => sum + item.quantity, 0)
  
  return { items, addItem, removeItem, total }
}
```

**3. Compound Components Pattern**
```tsx
// For complex UI with multiple related parts
interface TabsProps {
  children: React.ReactNode
  defaultValue: string
}

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

export function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  )
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex border-b">{children}</div>
}

Tabs.Trigger = function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  
  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={context.activeTab === value ? 'border-b-2 border-blue-600' : ''}
    >
      {children}
    </button>
  )
}

Tabs.Content = function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  
  return context.activeTab === value ? <div>{children}</div> : null
}

// Usage:
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>
```

## State Management

### Local State (useState)
Use for component-specific state that doesn't need to be shared.

```tsx
const [isOpen, setIsOpen] = useState(false)
const [inputValue, setInputValue] = useState('')
```

### Global State (Zustand)
Use for app-wide state (auth, theme, shopping cart).

```tsx
// stores/authStore.ts
import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  
  login: async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const { user, token } = await response.json()
    localStorage.setItem('token', token)
    set({ user, token })
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))

// Usage in component:
function Header() {
  const { user, logout } = useAuthStore()
  
  return (
    <header>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  )
}
```

### Server State (TanStack Query)
Use for data fetching, caching, and synchronization.

```tsx
// services/productService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products')
      return data
    },
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`)
      return data
    },
    enabled: !!id, // Only run if id exists
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (product: NewProduct) => {
      const { data } = await api.post('/products', product)
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Usage:
function ProductList() {
  const { data: products, isLoading, error } = useProducts()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
```

## Routing (React Router)

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { useAuthStore } from './stores/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/login" />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route 
            path="dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

## TypeScript Best Practices

### Type-Safe Props
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children,
  className,
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded font-medium transition-colors'
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
```

### API Response Types with Zod
```tsx
import { z } from 'zod'

// Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'staff', 'customer']),
  createdAt: z.string().datetime(),
})

// Infer TypeScript type from schema
export type User = z.infer<typeof UserSchema>

// Validate API responses
export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()
  return UserSchema.parse(data) // Throws if invalid
}
```

## Performance Optimization

### 1. Code Splitting
```tsx
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Reports = lazy(() => import('./pages/Reports'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  )
}
```

### 2. Memoization
```tsx
import { memo, useMemo, useCallback } from 'react'

// Memo expensive components
export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  )
})

// Memo expensive calculations
function ProductList({ products, filters }: Props) {
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice)
      .sort((a, b) => a.price - b.price)
  }, [products, filters.minPrice, filters.maxPrice])
  
  // Memo callbacks to prevent child re-renders
  const handleAddToCart = useCallback((id: string) => {
    // Add to cart logic
  }, [])
  
  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
      ))}
    </div>
  )
}
```

### 3. Image Optimization
```tsx
function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy" // Browser-native lazy loading
      decoding="async" // Async image decoding
      className="w-full h-auto"
    />
  )
}

// Or use Intersection Observer for custom lazy loading
import { useRef, useEffect, useState } from 'react'

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsLoaded(true)
          observer.disconnect()
        }
      })
    })
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : 'placeholder.jpg'}
      alt={alt}
    />
  )
}
```

### 4. Virtual Scrolling for Long Lists
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualProductList({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated item height
  })
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div 
        style={{ 
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ProductCard product={products[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Accessibility (a11y)

### Semantic HTML
```tsx
// ❌ Bad - divs everywhere
<div onClick={handleClick}>Click me</div>

// ✅ Good - semantic button
<button onClick={handleClick}>Click me</button>

// ✅ Good - semantic structure
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

### ARIA Attributes
```tsx
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trap focus inside modal
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h2 id="modal-title" className="text-xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
        <button onClick={onClose} aria-label="Close modal">Close</button>
      </div>
    </div>
  )
}
```

### Keyboard Navigation
```tsx
function Dropdown({ options, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        setIsOpen(!isOpen)
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }
  
  return (
    <div 
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Dropdown implementation */}
    </div>
  )
}
```

## Testing

### Component Tests (React Testing Library)
```tsx
// ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  it('renders product information', () => {
    render(
      <ProductCard 
        id="1" 
        name="Test Product" 
        price={99.99} 
        onAddToCart={vi.fn()} 
      />
    )
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })
  
  it('calls onAddToCart when button clicked', () => {
    const handleAddToCart = vi.fn()
    render(
      <ProductCard 
        id="1" 
        name="Test Product" 
        price={99.99} 
        onAddToCart={handleAddToCart} 
      />
    )
    
    fireEvent.click(screen.getByText('Add to Cart'))
    expect(handleAddToCart).toHaveBeenCalledWith('1')
  })
})
```

### Hook Tests
```tsx
// useCart.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCart } from './useCart'

describe('useCart', () => {
  it('adds items to cart', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem('product-1')
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.total).toBe(1)
  })
  
  it('increments quantity for existing items', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem('product-1')
      result.current.addItem('product-1')
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })
})
```

See `references/testing-guide.md` for comprehensive testing patterns.

## Responsive Design

### Mobile-First Approach
```tsx
// Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
function Hero() {
  return (
    <div className="
      px-4 py-8           // Mobile: small padding
      md:px-8 md:py-12    // Tablet: medium padding
      lg:px-16 lg:py-20   // Desktop: large padding
    ">
      <h1 className="
        text-2xl           // Mobile: 24px
        md:text-4xl        // Tablet: 36px
        lg:text-6xl        // Desktop: 60px
        font-bold
      ">
        Welcome
      </h1>
      <div className="
        grid grid-cols-1    // Mobile: 1 column
        md:grid-cols-2      // Tablet: 2 columns
        lg:grid-cols-3      // Desktop: 3 columns
        gap-4
      ">
        {/* Grid items */}
      </div>
    </div>
  )
}
```

### Container Queries (for component-specific breakpoints)
```tsx
// When component needs different layouts based on container width, not viewport
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container"> {/* Enable container queries */}
      <div className="
        flex flex-col      // Default: vertical stack
        @md:flex-row       // Container > md: horizontal layout
        gap-4
      ">
        {children}
      </div>
    </div>
  )
}
```

## Error Handling

### Error Boundaries
```tsx
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo)
    // Send to error tracking service (Sentry, etc.)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-gray-600 mt-2">Please refresh the page or try again later.</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Usage:
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Graceful API Error Handling
```tsx
function ProductList() {
  const { data, error, isLoading } = useProducts()
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">
          {error.message === 'Network Error' 
            ? 'Unable to connect. Please check your internet connection.'
            : 'Something went wrong. Please try again later.'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 underline"
        >
          Reload
        </button>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
```

## Security Best Practices

### 1. XSS Prevention
```tsx
// React automatically escapes content, but be careful with dangerouslySetInnerHTML
// ❌ Bad - allows XSS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Good - sanitize first
import DOMPurify from 'dompurify'

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// ✅ Better - avoid dangerouslySetInnerHTML entirely
<div>{userInput}</div>
```

### 2. Authentication Tokens
```tsx
// Store JWT in httpOnly cookie (backend sets it)
// Or use sessionStorage (cleared on tab close)
// ❌ Bad - localStorage vulnerable to XSS
localStorage.setItem('token', token)

// ✅ Good - httpOnly cookie (set by backend)
// Frontend includes credentials automatically
fetch('/api/data', {
  credentials: 'include', // Send cookies
})
```

### 3. Environment Variables
```tsx
// ✅ Good - prefix with VITE_ to expose to frontend
// .env
VITE_API_URL=https://api.example.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

// Access in code
const apiUrl = import.meta.env.VITE_API_URL

// ❌ Bad - never expose secrets to frontend
// Don't do this with API secrets, private keys, etc.
```

## Production Build & Deployment

### Build Configuration
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Environment-Specific Builds
```bash
# .env.development
VITE_API_URL=http://localhost:3000

# .env.production
VITE_API_URL=https://api.production.com

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Docker Deployment
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

See `references/deployment.md` for complete CI/CD configurations.

## Common Patterns & Solutions

### Debounced Search
```tsx
import { useState, useEffect } from 'react'

function SearchBar() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300) // Wait 300ms after user stops typing
    
    return () => clearTimeout(timer)
  }, [query])
  
  const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  })
  
  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="Search products..."
    />
  )
}
```

### Infinite Scroll
```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'

function InfiniteProductList() {
  const { ref, inView } = useInView()
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: ({ pageParam = 1 }) => fetchProducts(pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextPage,
  })
  
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])
  
  return (
    <div>
      {data?.pages.map(page => (
        page.products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))
      ))}
      <div ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  )
}
```

### Form Validation
```tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })
  
  const onSubmit = async (data: LoginFormData) => {
    await login(data.email, data.password)
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input 
          type="email" 
          {...register('email')} 
          placeholder="Email"
        />
        {errors.email && <span className="text-red-600">{errors.email.message}</span>}
      </div>
      
      <div>
        <input 
          type="password" 
          {...register('password')} 
          placeholder="Password"
        />
        {errors.password && <span className="text-red-600">{errors.password.message}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

## Resources

### Bundled References
- `references/project-setup.md` - Complete project configurations
- `references/testing-guide.md` - Comprehensive testing patterns
- `references/deployment.md` - Production deployment guides
- `references/ui-patterns.md` - Common UI component patterns
- `references/performance-checklist.md` - Optimization checklist

### Related Skills
- `theme-factory` - Consistent styling across artifacts
- `pptx` - Design mockups and presentations
- `docx` - Technical specifications
- `production-deployment-skill` - Backend and infrastructure

### External Resources
- React docs: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Tailwind CSS: https://tailwindcss.com
- TanStack Query: https://tanstack.com/query
- Zustand: https://github.com/pmndrs/zustand
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev
- Vitest: https://vitest.dev

## Conclusion

Modern frontend development requires balancing user experience, performance, accessibility, and maintainability. Use this skill as a comprehensive guide to build production-ready React applications with industry best practices.

Remember: Write semantic HTML, prioritize accessibility, optimize for performance, test thoroughly, and always consider the end user's experience.
