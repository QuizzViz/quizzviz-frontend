import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<typeof Input>

interface NumberInputProps extends Omit<InputProps, 'onChange' | 'value' | 'type' | 'min' | 'max' | 'step'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  showMaxIndicator?: boolean
}

export function NumberInput({
  className,
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  showMaxIndicator = false,
  ...props
}: NumberInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    const newValue = Math.min(Number(value) + step, max)
    onChange(newValue)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    const newValue = Math.max(Number(value) - step, min)
    onChange(newValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      onChange(min)
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max)
      onChange(clampedValue)
    }
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="w-full">
      {showMaxIndicator && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">
            Max: {max}
          </span>
        </div>
      )}
      <div 
        className={cn(
          "flex items-center h-10 w-full rounded-md border border-input bg-background/50 overflow-hidden transition-all",
          className
        )}
        onClick={handleContainerClick}
      >
        <button
          type="button"
          className={cn(
            "h-full px-3 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            value <= min ? "opacity-50 cursor-not-allowed" : ""
          )}
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Decrease value"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        
        <div className="relative flex-1 h-full flex items-center justify-center">
          <Input
            ref={inputRef}
            type="number"
            className={cn(
              "h-full w-full border-0 rounded-none text-center text-foreground bg-transparent p-0",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            min={min}
            max={max}
            {...props}
          />
        </div>
        
        <button
          type="button"
          className={cn(
            "h-full px-3 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            value >= max ? "opacity-50 cursor-not-allowed" : ""
          )}
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label="Increase value"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
