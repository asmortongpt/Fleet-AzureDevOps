import { CSSProperties } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#2A1878",
          "--normal-text": "#FFFFFF",
          "--normal-border": "rgba(0, 204, 254, 0.15)",
        } as CSSProperties
      }
      toastOptions={{
        style: {
          background: '#2A1878',
          border: '1px solid rgba(0, 204, 254, 0.15)',
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
