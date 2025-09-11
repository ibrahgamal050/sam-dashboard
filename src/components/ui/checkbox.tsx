import React, { forwardRef } from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          className={`form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary ${className}`}
          ref={ref}
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
