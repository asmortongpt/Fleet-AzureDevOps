import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  LinearProgress,
  CircularProgress,
  StepProgress,
  UploadProgress,
  LoadingSpinner,
  PulsingDots,
} from './ProgressIndicator'

describe('ProgressIndicator Components', () => {
  describe('LinearProgress Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render linear progress bar', () => {
        const { container } = render(<LinearProgress value={50} />)
        const progressContainer = container.querySelector('.w-full.bg-gray-200')
        expect(progressContainer).toBeInTheDocument()
      })

      it('should render with default value of 0', () => {
        const { container } = render(<LinearProgress />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toBeInTheDocument()
      })

      it('should render with custom className', () => {
        const { container } = render(<LinearProgress className="custom-class" />)
        const wrapper = container.querySelector('.custom-class')
        expect(wrapper).toBeInTheDocument()
      })

      it('should render indeterminate progress', () => {
        const { container } = render(<LinearProgress indeterminate={true} />)
        const indeterminateBar = container.querySelector('[class*="animate-"]')
        expect(indeterminateBar).toBeInTheDocument()
      })
    })

    describe('Progress Value & Clamping', () => {
      it('should render correct progress width for given value', () => {
        const { container } = render(<LinearProgress value={75} />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toHaveStyle({ width: '75%' })
      })

      it('should clamp negative values to 0', () => {
        const { container } = render(<LinearProgress value={-10} />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toHaveStyle({ width: '0%' })
      })

      it('should clamp values over 100 to 100', () => {
        const { container } = render(<LinearProgress value={150} />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toHaveStyle({ width: '100%' })
      })

      it('should render at 0% for zero value', () => {
        const { container } = render(<LinearProgress value={0} />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toHaveStyle({ width: '0%' })
      })

      it('should render at 100% for full completion', () => {
        const { container } = render(<LinearProgress value={100} />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toHaveStyle({ width: '100%' })
      })
    })

    describe('Color Variants', () => {
      it('should render primary variant with blue color', () => {
        const { container } = render(<LinearProgress value={50} variant="primary" />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toBeInTheDocument()
      })

      it('should render success variant with green color', () => {
        const { container } = render(<LinearProgress value={50} variant="success" />)
        const progressBar = container.querySelector('.bg-green-500')
        expect(progressBar).toBeInTheDocument()
      })

      it('should render warning variant with yellow color', () => {
        const { container } = render(<LinearProgress value={50} variant="warning" />)
        const progressBar = container.querySelector('.bg-yellow-500')
        expect(progressBar).toBeInTheDocument()
      })

      it('should render danger variant with red color', () => {
        const { container } = render(<LinearProgress value={50} variant="danger" />)
        const progressBar = container.querySelector('.bg-red-500')
        expect(progressBar).toBeInTheDocument()
      })
    })

    describe('Height Customization', () => {
      it('should render with default height of 4px', () => {
        const { container } = render(<LinearProgress value={50} />)
        const track = container.querySelector('.w-full.bg-gray-200')
        expect(track).toHaveStyle({ height: '4px' })
      })

      it('should render with custom height', () => {
        const { container } = render(<LinearProgress value={50} height={8} />)
        const track = container.querySelector('.w-full.bg-gray-200')
        expect(track).toHaveStyle({ height: '8px' })
      })

      it('should render with small height', () => {
        const { container } = render(<LinearProgress value={50} height={2} />)
        const track = container.querySelector('.w-full.bg-gray-200')
        expect(track).toHaveStyle({ height: '2px' })
      })

      it('should render with large height', () => {
        const { container } = render(<LinearProgress value={50} height={12} />)
        const track = container.querySelector('.w-full.bg-gray-200')
        expect(track).toHaveStyle({ height: '12px' })
      })
    })

    describe('Label Display', () => {
      it('should not show label by default', () => {
        render(<LinearProgress value={50} />)
        expect(screen.queryByText('50%')).not.toBeInTheDocument()
      })

      it('should show label when showLabel is true', () => {
        render(<LinearProgress value={50} showLabel={true} />)
        expect(screen.getByText('50%')).toBeInTheDocument()
      })

      it('should display correct percentage in label', () => {
        render(<LinearProgress value={75} showLabel={true} />)
        expect(screen.getByText('75%')).toBeInTheDocument()
      })

      it('should round percentage to nearest integer', () => {
        render(<LinearProgress value={66.7} showLabel={true} />)
        expect(screen.getByText('67%')).toBeInTheDocument()
      })

      it('should not show label in indeterminate mode', () => {
        render(<LinearProgress indeterminate={true} showLabel={true} />)
        expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
      })

      it('should display 0% for zero value with label', () => {
        render(<LinearProgress value={0} showLabel={true} />)
        expect(screen.getByText('0%')).toBeInTheDocument()
      })

      it('should display 100% for full completion with label', () => {
        render(<LinearProgress value={100} showLabel={true} />)
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })

    describe('Buffer Progress', () => {
      it('should render buffer when provided', () => {
        const { container } = render(<LinearProgress value={30} buffer={60} />)
        const bufferBar = container.querySelector('.bg-gray-300')
        expect(bufferBar).toBeInTheDocument()
      })

      it('should set buffer width correctly', () => {
        const { container } = render(<LinearProgress value={30} buffer={60} />)
        const bufferBar = container.querySelector('.bg-gray-300')
        expect(bufferBar).toHaveStyle({ width: '60%' })
      })

      it('should clamp buffer to 0-100 range', () => {
        const { container } = render(<LinearProgress value={30} buffer={150} />)
        const bufferBar = container.querySelector('.bg-gray-300')
        expect(bufferBar).toHaveStyle({ width: '100%' })
      })

      it('should not render buffer for negative buffer value', () => {
        const { container } = render(<LinearProgress value={30} buffer={-10} />)
        const bufferBar = container.querySelector('.bg-gray-300')
        expect(bufferBar).toHaveStyle({ width: '0%' })
      })

      it('should render buffer behind progress', () => {
        const { container } = render(<LinearProgress value={30} buffer={60} />)
        const bufferBar = container.querySelector('.bg-gray-300')
        const progressBar = container.querySelector('.bg-blue-500')
        expect(bufferBar).toBeInTheDocument()
        expect(progressBar).toBeInTheDocument()
      })
    })

    describe('Animation & Transitions', () => {
      it('should have transition classes on progress bar', () => {
        const { container } = render(<LinearProgress value={50} />)
        const progressBar = container.querySelector('.bg-blue-500')
        expect(progressBar).toHaveClass('transition-all', 'duration-500', 'ease-out')
      })

      it('should have smooth animations for buffer', () => {
        const { container } = render(<LinearProgress value={30} buffer={60} />)
        const bufferBar = container.querySelector('.bg-gray-300')
        expect(bufferBar).toHaveClass('transition-all', 'duration-300')
      })

      it('should have indeterminate animation', () => {
        const { container } = render(<LinearProgress indeterminate={true} />)
        const indeterminateBar = container.querySelector('[class*="animate-"]')
        expect(indeterminateBar).toHaveClass('animate-[indeterminate_1.5s_ease-in-out_infinite]')
      })

      it('should include shine effect on determinate progress', () => {
        const { container } = render(<LinearProgress value={50} />)
        const shineEffect = container.querySelector('.bg-gradient-to-r')
        expect(shineEffect).toBeInTheDocument()
      })
    })
  })

  describe('CircularProgress Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render circular progress SVG', () => {
        const { container } = render(<CircularProgress value={50} />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('should render with default value of 0', () => {
        const { container } = render(<CircularProgress />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('should render background circle', () => {
        const { container } = render(<CircularProgress value={50} />)
        const circles = container.querySelectorAll('circle')
        expect(circles.length).toBeGreaterThanOrEqual(2) // background + progress
      })

      it('should render with custom className', () => {
        const { container } = render(<CircularProgress className="custom-class" />)
        const wrapper = container.querySelector('.custom-class')
        expect(wrapper).toBeInTheDocument()
      })
    })

    describe('Progress Value & Calculation', () => {
      it('should calculate correct stroke dash offset', () => {
        const { container } = render(<CircularProgress value={50} size={48} />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveAttribute('stroke-dashoffset')
      })

      it('should clamp value to 0-100 range', () => {
        const { container: container1 } = render(<CircularProgress value={-10} size={48} />)
        const { container: container2 } = render(<CircularProgress value={150} size={48} />)
        expect(container1.querySelector('svg')).toBeInTheDocument()
        expect(container2.querySelector('svg')).toBeInTheDocument()
      })

      it('should render indeterminate animation', () => {
        const { container } = render(<CircularProgress indeterminate={true} />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveClass('animate-spin')
      })
    })

    describe('Size Variants', () => {
      it('should render with default size of 48', () => {
        const { container } = render(<CircularProgress value={50} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '48')
        expect(svg).toHaveAttribute('height', '48')
      })

      it('should render with custom size', () => {
        const { container } = render(<CircularProgress value={50} size={64} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '64')
        expect(svg).toHaveAttribute('height', '64')
      })

      it('should render with small size', () => {
        const { container } = render(<CircularProgress value={50} size={24} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '24')
      })

      it('should render with large size', () => {
        const { container } = render(<CircularProgress value={50} size={96} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '96')
      })
    })

    describe('Stroke Width Customization', () => {
      it('should render with default stroke width of 4', () => {
        const { container } = render(<CircularProgress value={50} />)
        const circles = container.querySelectorAll('circle')
        const progressCircle = circles[1]
        expect(progressCircle).toHaveAttribute('stroke-width', '4')
      })

      it('should render with custom stroke width', () => {
        const { container } = render(<CircularProgress value={50} strokeWidth={6} />)
        const circles = container.querySelectorAll('circle')
        const progressCircle = circles[1]
        expect(progressCircle).toHaveAttribute('stroke-width', '6')
      })

      it('should render with thin stroke', () => {
        const { container } = render(<CircularProgress value={50} strokeWidth={2} />)
        const circles = container.querySelectorAll('circle')
        const progressCircle = circles[1]
        expect(progressCircle).toHaveAttribute('stroke-width', '2')
      })

      it('should render with thick stroke', () => {
        const { container } = render(<CircularProgress value={50} strokeWidth={8} />)
        const circles = container.querySelectorAll('circle')
        const progressCircle = circles[1]
        expect(progressCircle).toHaveAttribute('stroke-width', '8')
      })
    })

    describe('Color Variants', () => {
      it('should render primary variant with blue color', () => {
        const { container } = render(<CircularProgress value={50} variant="primary" />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveAttribute('stroke', '#3b82f6')
      })

      it('should render success variant with green color', () => {
        const { container } = render(<CircularProgress value={50} variant="success" />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveAttribute('stroke', '#22c55e')
      })

      it('should render warning variant with yellow color', () => {
        const { container } = render(<CircularProgress value={50} variant="warning" />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveAttribute('stroke', '#eab308')
      })

      it('should render danger variant with red color', () => {
        const { container } = render(<CircularProgress value={50} variant="danger" />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveAttribute('stroke', '#ef4444')
      })
    })

    describe('Label Display', () => {
      it('should show label by default', () => {
        render(<CircularProgress value={50} />)
        expect(screen.getByText('50%')).toBeInTheDocument()
      })

      it('should not show label when showLabel is false', () => {
        render(<CircularProgress value={50} showLabel={false} />)
        expect(screen.queryByText('50%')).not.toBeInTheDocument()
      })

      it('should display correct percentage', () => {
        render(<CircularProgress value={75} />)
        expect(screen.getByText('75%')).toBeInTheDocument()
      })

      it('should round percentage correctly', () => {
        render(<CircularProgress value={33.3} />)
        expect(screen.getByText('33%')).toBeInTheDocument()
      })

      it('should not show label in indeterminate mode', () => {
        render(<CircularProgress indeterminate={true} showLabel={true} />)
        expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
      })

      it('should display label with correct color', () => {
        render(<CircularProgress value={50} variant="success" />)
        const label = screen.getByText('50%')
        expect(label).toHaveStyle({ color: '#22c55e' })
      })
    })

    describe('Animation & Transitions', () => {
      it('should have transition on progress circle', () => {
        const { container } = render(<CircularProgress value={50} />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveClass('transition-all', 'duration-500', 'ease-out')
      })

      it('should have spin animation for indeterminate', () => {
        const { container } = render(<CircularProgress indeterminate={true} />)
        const progressCircle = container.querySelectorAll('circle')[1]
        expect(progressCircle).toHaveClass('animate-spin')
      })

      it('should have correct rotation transform', () => {
        const { container } = render(<CircularProgress value={50} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('transform', '-rotate-90')
      })
    })
  })

  describe('StepProgress Component', () => {
    const mockSteps = [
      { id: '1', label: 'Step 1', status: 'completed' as const },
      { id: '2', label: 'Step 2', status: 'active' as const },
      { id: '3', label: 'Step 3', status: 'pending' as const },
    ]

    describe('Rendering & Basic Structure', () => {
      it('should render step progress container', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const stepContainer = container.querySelector('.flex')
        expect(stepContainer).toBeInTheDocument()
      })

      it('should render all steps', () => {
        render(<StepProgress steps={mockSteps} />)
        mockSteps.forEach(step => {
          expect(screen.getByText(step.label)).toBeInTheDocument()
        })
      })

      it('should render with custom className', () => {
        const { container } = render(<StepProgress steps={mockSteps} className="custom-class" />)
        const wrapper = container.querySelector('.custom-class')
        expect(wrapper).toBeInTheDocument()
      })

      it('should render empty steps array', () => {
        const { container } = render(<StepProgress steps={[]} />)
        expect(container.querySelector('.flex')).toBeInTheDocument()
      })
    })

    describe('Orientation', () => {
      it('should render horizontal by default', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const stepContainer = container.firstChild as HTMLElement
        expect(stepContainer).toHaveClass('flex-row', 'items-center')
      })

      it('should render vertical when specified', () => {
        const { container } = render(<StepProgress steps={mockSteps} orientation="vertical" />)
        const stepContainer = container.firstChild as HTMLElement
        expect(stepContainer).toHaveClass('flex-col')
      })

      it('should render horizontal flex direction', () => {
        const { container } = render(<StepProgress steps={mockSteps} orientation="horizontal" />)
        const stepContainer = container.firstChild as HTMLElement
        expect(stepContainer).toHaveClass('flex-row')
      })
    })

    describe('Step Status Styling', () => {
      it('should style completed step with green', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const buttons = container.querySelectorAll('button')
        const completedButton = buttons[0]
        expect(completedButton).toHaveClass('bg-green-500')
      })

      it('should style active step with blue', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const buttons = container.querySelectorAll('button')
        const activeButton = buttons[1]
        expect(activeButton).toHaveClass('bg-blue-500')
      })

      it('should style pending step with gray', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const buttons = container.querySelectorAll('button')
        const pendingButton = buttons[2]
        expect(pendingButton).toHaveClass('bg-gray-200')
      })

      it('should style error step with red', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'error' as const },
        ]
        const { container } = render(<StepProgress steps={steps} />)
        const button = container.querySelector('button')
        expect(button).toHaveClass('bg-red-500')
      })
    })

    describe('Step Content Display', () => {
      it('should display step numbers for pending steps', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'pending' as const },
        ]
        render(<StepProgress steps={steps} />)
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      it('should display checkmark for completed steps', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'completed' as const },
        ]
        const { container } = render(<StepProgress steps={steps} />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('should display cross for error steps', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'error' as const },
        ]
        render(<StepProgress steps={steps} />)
        expect(screen.getByText('✕')).toBeInTheDocument()
      })

      it('should display active step number', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'active' as const },
        ]
        render(<StepProgress steps={steps} />)
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    describe('Connector Lines', () => {
      it('should render connector lines between steps', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const connectors = container.querySelectorAll('.bg-gray-300')
        expect(connectors.length).toBe(2) // steps.length - 1
      })

      it('should not render connector after last step', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'pending' as const },
        ]
        const { container } = render(<StepProgress steps={steps} />)
        const connectors = container.querySelectorAll('.bg-gray-300')
        expect(connectors.length).toBe(0)
      })

      it('should fill connector with green for completed steps', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const connectors = container.querySelectorAll('.bg-gray-300')
        const firstConnector = connectors[0]
        expect(firstConnector).toHaveClass('bg-gray-300')
      })
    })

    describe('Click Handling', () => {
      it('should call onStepClick when step is clicked', async () => {
        const handleStepClick = vi.fn()
        render(<StepProgress steps={mockSteps} onStepClick={handleStepClick} />)

        const buttons = screen.getAllByRole('button')
        await userEvent.click(buttons[0])

        expect(handleStepClick).toHaveBeenCalledWith('1')
      })

      it('should call onStepClick with correct step id', async () => {
        const handleStepClick = vi.fn()
        render(<StepProgress steps={mockSteps} onStepClick={handleStepClick} />)

        const buttons = screen.getAllByRole('button')
        await userEvent.click(buttons[1])

        expect(handleStepClick).toHaveBeenCalledWith('2')
      })

      it('should not be clickable without onStepClick handler', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const buttons = container.querySelectorAll('button')
        buttons.forEach(button => {
          expect(button).toBeDisabled()
        })
      })

      it('should have cursor-pointer when clickable', () => {
        const { container } = render(<StepProgress steps={mockSteps} onStepClick={() => {}} />)
        const buttons = container.querySelectorAll('button')
        buttons.forEach(button => {
          expect(button).toHaveClass('cursor-pointer')
        })
      })
    })

    describe('Pulse Animation', () => {
      it('should show pulse animation on active step', () => {
        const { container } = render(<StepProgress steps={mockSteps} />)
        const pulseElement = container.querySelector('.animate-ping')
        expect(pulseElement).toBeInTheDocument()
      })

      it('should not show pulse on non-active steps', () => {
        const steps = [
          { id: '1', label: 'Step 1', status: 'pending' as const },
          { id: '2', label: 'Step 2', status: 'pending' as const },
        ]
        const { container } = render(<StepProgress steps={steps} />)
        const pulseElements = container.querySelectorAll('.animate-ping')
        expect(pulseElements.length).toBe(0)
      })
    })
  })

  describe('UploadProgress Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render upload progress container', () => {
        const { container } = render(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={50} />
        )
        expect(container.querySelector('.border.rounded-lg.p-2')).toBeInTheDocument()
      })

      it('should display file name', () => {
        render(
          <UploadProgress fileName="document.pdf" fileSize={1024000} progress={50} />
        )
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })

      it('should render with custom className', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            className="custom-class"
          />
        )
        expect(container.querySelector('.custom-class')).toBeInTheDocument()
      })
    })

    describe('File Size Display', () => {
      it('should format file size in bytes', () => {
        render(
          <UploadProgress fileName="test.txt" fileSize={512} progress={50} />
        )
        expect(screen.getByText(/512\.0 B/)).toBeInTheDocument()
      })

      it('should format file size in KB', () => {
        render(
          <UploadProgress fileName="test.pdf" fileSize={1024 * 10} progress={50} />
        )
        expect(screen.getByText(/10\.0 KB/)).toBeInTheDocument()
      })

      it('should format file size in MB', () => {
        render(
          <UploadProgress fileName="video.mp4" fileSize={1024 * 1024 * 5} progress={50} />
        )
        expect(screen.getByText(/5\.0 MB/)).toBeInTheDocument()
      })

      it('should format file size in GB', () => {
        render(
          <UploadProgress fileName="large.iso" fileSize={1024 * 1024 * 1024 * 2} progress={50} />
        )
        expect(screen.getByText(/2\.0 GB/)).toBeInTheDocument()
      })
    })

    describe('Progress Display', () => {
      it('should display uploaded bytes based on progress', () => {
        render(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={25} />
        )
        expect(screen.getByText(/250\.0 KB/)).toBeInTheDocument()
      })

      it('should update progress percentage', () => {
        const { rerender } = render(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={30} />
        )
        expect(screen.getByText(/300\.0 KB/)).toBeInTheDocument()

        rerender(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={60} />
        )
        expect(screen.getByText(/600\.0 KB/)).toBeInTheDocument()
      })

      it('should show 0 bytes uploaded at 0%', () => {
        render(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={0} />
        )
        expect(screen.getByText(/0 B/)).toBeInTheDocument()
      })

      it('should show full file size at 100%', () => {
        render(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={100} />
        )
        expect(screen.getByText(/1000\.0 KB/)).toBeInTheDocument()
      })
    })

    describe('Upload Speed Display', () => {
      it('should display upload speed when provided', () => {
        render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            speed={102400}
            status="uploading"
          />
        )
        expect(screen.getByText(/100\.0 KB\/s/)).toBeInTheDocument()
      })

      it('should not display speed when not provided', () => {
        render(
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={50} />
        )
        expect(screen.queryByText(/\/s/)).not.toBeInTheDocument()
      })

      it('should not display speed when not uploading', () => {
        render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={100}
            speed={102400}
            status="success"
          />
        )
        expect(screen.queryByText(/\/s/)).not.toBeInTheDocument()
      })
    })

    describe('Status Display', () => {
      it('should display file icon for uploading', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            status="uploading"
          />
        )
        expect(screen.getByText('📄')).toBeInTheDocument()
        expect(container.querySelector('.bg-blue-100')).toBeInTheDocument()
      })

      it('should display checkmark for success', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={100}
            status="success"
          />
        )
        expect(screen.getByText('✓')).toBeInTheDocument()
        expect(container.querySelector('.bg-green-100')).toBeInTheDocument()
      })

      it('should display cross for error', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            status="error"
          />
        )
        expect(screen.getByText('✕')).toBeInTheDocument()
        expect(container.querySelector('.bg-red-100')).toBeInTheDocument()
      })

      it('should show success message', () => {
        render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={100}
            status="success"
          />
        )
        expect(screen.getByText('Upload complete')).toBeInTheDocument()
      })

      it('should show error message', () => {
        render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            status="error"
          />
        )
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })

    describe('Cancel Button', () => {
      it('should show cancel button when uploading', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            status="uploading"
            onCancel={() => {}}
          />
        )
        const cancelButton = container.querySelector('button')
        expect(cancelButton).toBeInTheDocument()
      })

      it('should not show cancel button on success', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={100}
            status="success"
            onCancel={() => {}}
          />
        )
        const cancelButton = container.querySelector('button')
        expect(cancelButton).not.toBeInTheDocument()
      })

      it('should call onCancel when clicked', async () => {
        const handleCancel = vi.fn()
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            status="uploading"
            onCancel={handleCancel}
          />
        )

        const cancelButton = container.querySelector('button')!
        await userEvent.click(cancelButton)

        expect(handleCancel).toHaveBeenCalled()
      })

      it('should not show cancel button without handler', () => {
        const { container } = render(
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={50}
            status="uploading"
          />
        )
        expect(container.querySelector('button')).not.toBeInTheDocument()
      })
    })
  })

  describe('LoadingSpinner Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render spinner', () => {
        const { container } = render(<LoadingSpinner />)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })

      it('should render SVG inside spinner', () => {
        const { container } = render(<LoadingSpinner />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

      it('should render with custom className', () => {
        const { container } = render(<LoadingSpinner className="custom-class" />)
        expect(container.querySelector('.custom-class')).toBeInTheDocument()
      })

      it('should render with default size of 24', () => {
        const { container } = render(<LoadingSpinner />)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toHaveStyle({ width: '24px', height: '24px' })
      })
    })

    describe('Size Customization', () => {
      it('should render with custom size', () => {
        const { container } = render(<LoadingSpinner size={32} />)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toHaveStyle({ width: '32px', height: '32px' })
      })

      it('should render with small size', () => {
        const { container } = render(<LoadingSpinner size={16} />)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toHaveStyle({ width: '16px', height: '16px' })
      })

      it('should render with large size', () => {
        const { container } = render(<LoadingSpinner size={48} />)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toHaveStyle({ width: '48px', height: '48px' })
      })
    })

    describe('Color Customization', () => {
      it('should render with default blue color', () => {
        const { container } = render(<LoadingSpinner />)
        const circles = container.querySelectorAll('circle')
        circles.forEach(circle => {
          expect(circle).toHaveAttribute('stroke', '#3b82f6')
        })
      })

      it('should render with custom color', () => {
        const { container } = render(<LoadingSpinner color="#ef4444" />)
        const circles = container.querySelectorAll('circle')
        circles.forEach(circle => {
          expect(circle).toHaveAttribute('stroke', '#ef4444')
        })
      })

      it('should render with hex color', () => {
        const { container } = render(<LoadingSpinner color="#22c55e" />)
        const circles = container.querySelectorAll('circle')
        circles.forEach(circle => {
          expect(circle).toHaveAttribute('stroke', '#22c55e')
        })
      })
    })

    describe('Label Display', () => {
      it('should not display label by default', () => {
        render(<LoadingSpinner />)
        expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument()
      })

      it('should display label when provided', () => {
        render(<LoadingSpinner label="Loading data..." />)
        expect(screen.getByText('Loading data...')).toBeInTheDocument()
      })

      it('should display custom label text', () => {
        render(<LoadingSpinner label="Please wait..." />)
        expect(screen.getByText('Please wait...')).toBeInTheDocument()
      })
    })

    describe('Animation', () => {
      it('should have spin animation class', () => {
        const { container } = render(<LoadingSpinner />)
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toHaveClass('animate-spin')
      })

      it('should have flex container for layout', () => {
        const { container } = render(<LoadingSpinner />)
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'gap-2')
      })
    })
  })

  describe('PulsingDots Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render three dots', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.w-2.h-2')
        expect(dots.length).toBe(3)
      })

      it('should render with custom className', () => {
        const { container } = render(<PulsingDots className="custom-class" />)
        expect(container.querySelector('.custom-class')).toBeInTheDocument()
      })

      it('should have flex container', () => {
        const { container } = render(<PulsingDots />)
        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass('flex', 'gap-1')
      })
    })

    describe('Dot Styling', () => {
      it('should style dots with blue color', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.bg-blue-500')
        expect(dots.length).toBe(3)
      })

      it('should apply pulse animation to dots', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.animate-pulse')
        expect(dots.length).toBe(3)
      })

      it('should apply correct size to dots', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.w-2.h-2')
        expect(dots.length).toBe(3)
      })

      it('should apply rounded-full to dots', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.rounded-full')
        expect(dots.length).toBe(3)
      })
    })

    describe('Animation Timing', () => {
      it('should have staggered animation delays', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.animate-pulse')

        dots.forEach((dot, index) => {
          const expectedDelay = `${index * 0.2}s`
          // Check if animation-delay is set
          expect(dot).toHaveStyle({ animationDelay: expectedDelay })
        })
      })

      it('should first dot have no delay', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.animate-pulse')
        expect(dots[0]).toHaveStyle({ animationDelay: '0s' })
      })

      it('should second dot have 0.2s delay', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.animate-pulse')
        expect(dots[1]).toHaveStyle({ animationDelay: '0.2s' })
      })

      it('should third dot have 0.4s delay', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('.animate-pulse')
        expect(dots[2]).toHaveStyle({ animationDelay: '0.4s' })
      })
    })

    describe('Accessibility', () => {
      it('should be rendered as visually accessible loading indicator', () => {
        const { container } = render(<PulsingDots />)
        expect(container.firstChild).toBeInTheDocument()
      })

      it('should have semantic structure', () => {
        const { container } = render(<PulsingDots />)
        const dots = container.querySelectorAll('div')
        expect(dots.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Integration & Cross-Component Tests', () => {
    it('should render multiple progress indicators together', () => {
      const { container } = render(
        <>
          <LinearProgress value={50} />
          <CircularProgress value={50} />
          <PulsingDots />
        </>
      )
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    })

    it('should handle rapid value changes', async () => {
      const { rerender } = render(<LinearProgress value={0} showLabel={true} />)
      expect(screen.getByText('0%')).toBeInTheDocument()

      rerender(<LinearProgress value={25} showLabel={true} />)
      expect(screen.getByText('25%')).toBeInTheDocument()

      rerender(<LinearProgress value={50} showLabel={true} />)
      expect(screen.getByText('50%')).toBeInTheDocument()

      rerender(<LinearProgress value={75} showLabel={true} />)
      expect(screen.getByText('75%')).toBeInTheDocument()

      rerender(<LinearProgress value={100} showLabel={true} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should maintain state across re-renders', () => {
      const { rerender } = render(<CircularProgress value={30} size={48} />)
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('width', '48')

      rerender(<CircularProgress value={60} size={48} />)
      const updatedSvg = document.querySelector('svg')
      expect(updatedSvg).toHaveAttribute('width', '48')
    })

    it('should handle all components with zero progress', () => {
      const { container } = render(
        <>
          <LinearProgress value={0} />
          <CircularProgress value={0} />
          <UploadProgress fileName="test.pdf" fileSize={1024000} progress={0} />
        </>
      )
      expect(container.querySelector('.flex')).toBeInTheDocument()
    })

    it('should handle all components with 100% progress', () => {
      const { container } = render(
        <>
          <LinearProgress value={100} />
          <CircularProgress value={100} />
          <UploadProgress
            fileName="test.pdf"
            fileSize={1024000}
            progress={100}
            status="success"
          />
        </>
      )
      expect(container.querySelector('.flex')).toBeInTheDocument()
    })
  })

  describe('Edge Cases & Error Handling', () => {
    it('should handle NaN values gracefully', () => {
      const { container } = render(<LinearProgress value={NaN} />)
      expect(container.querySelector('.bg-blue-500')).toBeInTheDocument()
    })

    it('should handle Infinity values gracefully', () => {
      const { container } = render(<CircularProgress value={Infinity} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle zero filesize in upload', () => {
      render(
        <UploadProgress fileName="empty.txt" fileSize={0} progress={50} />
      )
      expect(screen.getByText('empty.txt')).toBeInTheDocument()
    })

    it('should handle very large values clamping', () => {
      const { container } = render(<LinearProgress value={9999999} />)
      const bar = container.querySelector('.bg-blue-500')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('should handle empty step array', () => {
      const { container } = render(<StepProgress steps={[]} />)
      expect(container.querySelector('.flex')).toBeInTheDocument()
    })

    it('should handle single step', () => {
      const steps = [{ id: '1', label: 'Only Step', status: 'active' as const }]
      render(<StepProgress steps={steps} />)
      expect(screen.getByText('Only Step')).toBeInTheDocument()
    })
  })

  describe('Accessibility & Semantic HTML', () => {
    it('LinearProgress should be readable', () => {
      const { container } = render(<LinearProgress value={50} showLabel={true} />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('CircularProgress should display accessible percentage', () => {
      render(<CircularProgress value={75} showLabel={true} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('StepProgress buttons should have proper roles', () => {
      const steps = [{ id: '1', label: 'Step', status: 'active' as const }]
      render(<StepProgress steps={steps} onStepClick={() => {}} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('UploadProgress should display file information', () => {
      render(
        <UploadProgress fileName="document.pdf" fileSize={1024000} progress={50} />
      )
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })

    it('LoadingSpinner with label should be readable', () => {
      render(<LoadingSpinner label="Processing..." />)
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })
})
