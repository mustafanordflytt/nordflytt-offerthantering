import React from 'react'
import { cn } from '@/lib/utils'

interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  asChild?: boolean
  size?: 'default' | 'sm' | 'lg'
  variant?: 'button' | 'icon' | 'checkbox' | 'list-item'
  disabled?: boolean
}

const TouchTarget = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  ({ 
    children, 
    className, 
    asChild = false, 
    size = 'default',
    variant = 'button',
    disabled = false,
    onClick,
    ...props 
  }, ref) => {
    const baseClasses = "touch-manipulation select-none transition-all duration-200"
    
    const sizeClasses = {
      sm: "min-h-[44px] min-w-[44px]",
      default: "min-h-[44px] min-w-[44px]",
      lg: "min-h-[48px] min-w-[48px]"
    }
    
    const variantClasses = {
      button: "inline-flex items-center justify-center px-4 py-2 rounded-md font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      icon: "inline-flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      checkbox: "inline-flex items-center justify-center cursor-pointer hover:bg-accent/50 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "list-item": "flex items-center w-full px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    }
    
    const classes = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      disabled && "pointer-events-none opacity-50",
      className
    )

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      onClick?.(e)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, children.props.className),
        onClick: handleClick,
        ref
      })
    }

    return (
      <div
        ref={ref}
        className={classes}
        onClick={handleClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

TouchTarget.displayName = "TouchTarget"

// Specialized components
export const TouchButton = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  (props, ref) => (
    <TouchTarget {...props} ref={ref} variant="button" />
  )
)

export const TouchIconButton = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  (props, ref) => (
    <TouchTarget {...props} ref={ref} variant="icon" />
  )
)

export const TouchCheckbox = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  (props, ref) => (
    <TouchTarget {...props} ref={ref} variant="checkbox" />
  )
)

export const TouchListItem = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  (props, ref) => (
    <TouchTarget {...props} ref={ref} variant="list-item" />
  )
)

TouchButton.displayName = "TouchButton"
TouchIconButton.displayName = "TouchIconButton"
TouchCheckbox.displayName = "TouchCheckbox"
TouchListItem.displayName = "TouchListItem"

export { TouchTarget }