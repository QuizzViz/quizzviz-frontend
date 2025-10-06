"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

interface ComboboxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  popoverClassName?: string
  emptyText?: string
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(({
  options,
  value,
  onChange,
  placeholder = "Search or select a topic...",
  className,
  inputClassName,
  popoverClassName,
  emptyText = "No results found."
}, forwardedRef) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Use useImperativeHandle to handle the forwarded ref
  React.useImperativeHandle(forwardedRef, () => containerRef.current as HTMLDivElement)

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.value.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [options, inputValue])

  // Handle outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle option selection
  const handleSelect = (option: Option) => {
    onChange(option.value)
    setInputValue(option.label)
    setIsOpen(false)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  // Handle input click
  const handleInputClick = () => {
    if (!isOpen) {
      setIsOpen(true)
      if (!inputValue) {
        setInputValue('')
      }
    }
  }

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue && !filteredOptions.length) {
      onChange(inputValue)
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Set initial input value when value prop changes
  React.useEffect(() => {
    if (value) {
      const selectedOption = options.find(opt => opt.value === value)
      setInputValue(selectedOption?.label || value)
    } else {
      setInputValue('')
    }
  }, [value, options])

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full", className)}
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-2 border rounded-md text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "bg-background text-foreground border-input",
            "placeholder:text-muted-foreground/50",
            inputClassName
          )}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
        </button>
      </div>

      {isOpen && (
        <div className={cn("absolute z-10 mt-1 w-full rounded-md bg-popover shadow-lg", popoverClassName)}>
          <div className="max-h-60 overflow-auto rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              <ul className="py-1">
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    className={cn(
                      "relative cursor-pointer select-none py-2 pl-10 pr-4",
                      "hover:bg-accent hover:text-accent-foreground",
                      value === option.value && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="block truncate">{option.label}</span>
                    {value === option.value && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-foreground">
                        <Check className="h-5 w-5" />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

Combobox.displayName = "Combobox"

export { Combobox }
