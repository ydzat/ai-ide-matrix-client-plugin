// Input Component
// Styled input component with validation states

import * as React from 'react';

/**
 * Input component with validation states and consistent styling
 * @param {object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.error - Whether input has error state
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.label - Input label
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement} Input component
 */
export function Input({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  error = false,
  errorMessage = '',
  label = '',
  className = '',
  ...props
}) {
  const inputId = React.useMemo(() =>
    `input-${Math.random().toString(36).substr(2, 9)}`, []
  );

  const baseClasses = [
    'flex',
    'h-10',
    'w-full',
    'rounded-md',
    'border',
    'bg-[var(--bg-elevated)]',
    'px-3',
    'py-2',
    'text-sm',
    'text-[var(--text-primary)]',
    'placeholder:text-[var(--text-tertiary)]',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50'
  ];

  const stateClasses = error ? [
    'border-[var(--border-error)]',
    'focus:border-[var(--border-error)]',
    'focus:ring-[var(--status-error)]'
  ] : [
    'border-[var(--border-primary)]',
    'focus:border-[var(--border-focus)]',
    'focus:ring-[var(--border-focus)]'
  ];

  const inputClasses = [
    ...baseClasses,
    ...stateClasses,
    className
  ].join(' ');

  const handleChange = (event) => {
    if (disabled) return;
    onChange?.(event);
  };

  return React.createElement('div', {
    className: 'space-y-2'
  }, [
    label && React.createElement('label', {
      key: 'label',
      htmlFor: inputId,
      className: 'text-sm font-medium text-[var(--text-primary)]'
    }, label),

    React.createElement('input', {
      key: 'input',
      id: inputId,
      type,
      placeholder,
      value,
      onChange: handleChange,
      disabled,
      className: inputClasses,
      'aria-invalid': error,
      'aria-describedby': error && errorMessage ? `${inputId}-error` : undefined,
      ...props
    }),

    error && errorMessage && React.createElement('p', {
      key: 'error',
      id: `${inputId}-error`,
      className: 'text-sm text-[var(--status-error)]'
    }, errorMessage)
  ]);
}

/**
 * Textarea component with similar styling to Input
 */
export function Textarea({
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  error = false,
  errorMessage = '',
  label = '',
  rows = 3,
  className = '',
  ...props
}) {
  const textareaId = React.useMemo(() =>
    `textarea-${Math.random().toString(36).substr(2, 9)}`, []
  );

  const baseClasses = [
    'flex',
    'min-h-[80px]',
    'w-full',
    'rounded-md',
    'border',
    'bg-[var(--bg-elevated)]',
    'px-3',
    'py-2',
    'text-sm',
    'text-[var(--text-primary)]',
    'placeholder:text-[var(--text-tertiary)]',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
    'resize-none'
  ];

  const stateClasses = error ? [
    'border-[var(--border-error)]',
    'focus:border-[var(--border-error)]',
    'focus:ring-[var(--status-error)]'
  ] : [
    'border-[var(--border-primary)]',
    'focus:border-[var(--border-focus)]',
    'focus:ring-[var(--border-focus)]'
  ];

  const textareaClasses = [
    ...baseClasses,
    ...stateClasses,
    className
  ].join(' ');

  const handleChange = (event) => {
    if (disabled) return;
    onChange?.(event);
  };

  return React.createElement('div', {
    className: 'space-y-2'
  }, [
    label && React.createElement('label', {
      key: 'label',
      htmlFor: textareaId,
      className: 'text-sm font-medium text-[var(--text-primary)]'
    }, label),

    React.createElement('textarea', {
      key: 'textarea',
      id: textareaId,
      placeholder,
      value,
      onChange: handleChange,
      disabled,
      rows,
      className: textareaClasses,
      'aria-invalid': error,
      'aria-describedby': error && errorMessage ? `${textareaId}-error` : undefined,
      ...props
    }),

    error && errorMessage && React.createElement('p', {
      key: 'error',
      id: `${textareaId}-error`,
      className: 'text-sm text-[var(--status-error)]'
    }, errorMessage)
  ]);
}

export default {
  Input,
  Textarea
};