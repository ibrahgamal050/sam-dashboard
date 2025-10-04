import React, { forwardRef } from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  onCheckedChange?: (checked: boolean) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      onChange?.(event)
      onCheckedChange?.(event.target.checked)
    }

    const mergedClassName = [
      'form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          className={mergedClassName}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {label && (
          <label className="ml-2 text-sm text-gray-700">{label}</label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
