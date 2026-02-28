import { CSSProperties } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#242424",
          "--normal-text": "#FFFFFF",
          "--normal-border": "rgba(255, 255, 255, 0.08)",
        } as CSSProperties
      }
      toastOptions={{
        style: {
          background: '#242424',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#FFFFFF',
          fontFamily: "'Montserrat', sans-serif",
        },
        classNames: {
          success: 'border-l-4 !border-l-[#10B981]',
          error: 'border-l-4 !border-l-[#FF4300]',
          warning: 'border-l-4 !border-l-[#FDC016]',
          info: 'border-l-4 !border-l-[#00CCFE]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
