// Button Component
// Radix UI Button wrapper with consistent styling and theming

import * as React from 'react';

/**
 * Button component with multiple variants and sizes
 * @param {object} props - Component props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'ghost', 'destructive'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {function} props.onClick - Click handler
 * @returns {React.ReactElement} Button component
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className = '',
  onClick,
  ...props
}) {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'font-medium',
    'transition-colors',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50'
  ];

  const variantClasses = {
    primary: [
      'bg-[var(--interactive-primary)]',
      'text-[var(--text-inverse)]',
      'hover:bg-[var(--interactive-primary-hover)]',
      'active:bg-[var(--interactive-primary-active)]',
      'focus-visible:ring-[var(--border-focus)]'
    ],
    secondary: [
      'bg-[var(--interactive-secondary)]',
      'text-[var(--text-primary)]',
      'border',
      'border-[var(--border-primary)]',
      'hover:bg-[var(--interactive-secondary-hover)]',
      'active:bg-[var(--interactive-secondary-active)]',
      'focus-visible:ring-[var(--border-focus)]'
    ],
    ghost: [
      'text-[var(--text-primary)]',
      'hover:bg-[var(--interactive-secondary)]',
      'active:bg-[var(--interactive-secondary-hover)]',
      'focus-visible:ring-[var(--border-focus)]'
    ],
    destructive: [
      'bg-[var(--status-error)]',
      'text-[var(--text-inverse)]',
      'hover:bg-[var(--status-error)]/90',
      'active:bg-[var(--status-error)]/80',
      'focus-visible:ring-[var(--status-error)]'
    ]
  };

  const sizeClasses = {
    sm: ['h-8', 'px-3', 'text-sm'],
    md: ['h-10', 'px-4', 'text-sm'],
    lg: ['h-12', 'px-6', 'text-base']
  };

  const classes = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    className
  ].join(' ');

  const handleClick = (event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return React.createElement('button', {
    className: classes,
    disabled: disabled || loading,
    onClick: handleClick,
    'aria-disabled': disabled || loading,
    ...props
  }, [
    loading && React.createElement('div', {
      key: 'spinner',
      className: 'mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'
    }),
    children
  ]);
}

/**
 * Icon Button component for icon-only buttons
 */
export function IconButton({
  size = 'md',
  variant = 'ghost',
  children,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: ['h-8', 'w-8'],
    md: ['h-10', 'w-10'],
    lg: ['h-12', 'w-12']
  };

  const iconButtonClasses = [
    'rounded-full',
    'p-0',
    ...sizeClasses[size],
    className
  ].join(' ');

  return React.createElement(Button, {
    variant,
    className: iconButtonClasses,
    ...props
  }, children);
}

export default {
  Button,
  IconButton
};