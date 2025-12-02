import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface BaseFormFieldProps {
  id: string
  label: string
  error?: string
  required?: boolean
  description?: string
  className?: string
}

interface InputFieldProps extends BaseFormFieldProps {
  type: "text" | "email" | "number" | "password" | "tel" | "url"
  value: string
  onChange: (value: string) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

interface TextareaFieldProps extends BaseFormFieldProps {
  type: "textarea"
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

interface SelectFieldProps extends BaseFormFieldProps {
  type: "select"
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps

export function FormField(props: FormFieldProps) {
  const { id, label, error, required, description, className } = props
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`
  const hasError = Boolean(error)

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
      </Label>

      {props.type === "textarea" ? (
        <Textarea
          id={id}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows}
          required={required}
          aria-invalid={hasError}
          aria-describedby={cn(
            description && descriptionId,
            error && errorId
          )}
          className={cn(hasError && "border-destructive")}
        />
      ) : props.type === "select" ? (
        <Select
          value={props.value}
          onValueChange={props.onChange}
          required={required}
        >
          <SelectTrigger
            id={id}
            aria-invalid={hasError}
            aria-describedby={cn(
              description && descriptionId,
              error && errorId
            )}
            className={cn(hasError && "border-destructive")}
          >
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={props.type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          min={props.type === "number" ? props.min : undefined}
          max={props.type === "number" ? props.max : undefined}
          step={props.type === "number" ? props.step : undefined}
          required={required}
          aria-invalid={hasError}
          aria-describedby={cn(
            description && descriptionId,
            error && errorId
          )}
          className={cn(hasError && "border-destructive")}
        />
      )}

      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
