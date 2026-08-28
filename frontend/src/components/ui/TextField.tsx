'use client';

import { forwardRef, type ReactNode } from 'react';
import { Text, TextField as RadixTextField } from '@radix-ui/themes';

export interface TextFieldProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadixTextField.Root>,
  'children' | 'id'
> {
  /** Field id; also used to derive the help/error text id. Required so labels and aria-describedby stay wired up. */
  id: string;
  /** Rendered above the field as a <label>. Omit and render your own label when it needs extra content (e.g. a link). */
  label?: ReactNode;
  /** Rendered below the field. Ignored while `error` is set. */
  helpText?: ReactNode;
  /** Rendered below the field instead of helpText, and switches the field to its invalid state. */
  error?: ReactNode;
  slotStart?: ReactNode;
  slotEnd?: ReactNode;
}

/**
 * App-wide entry point for Radix's TextField — a labeled input with
 * optional help/error text and slot adornments (icons, inline buttons).
 * Import this instead of '@radix-ui/themes' directly so pages share one
 * label/help/error wiring convention.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      helpText,
      error,
      slotStart,
      slotEnd,
      'aria-describedby': describedBy,
      ...props
    },
    ref
  ) {
    const helpId = `${id}-help`;
    const message = error ?? helpText;

    return (
      <div>
        {label && (
          <Text
            as="label"
            htmlFor={id}
            size="2"
            weight="medium"
            mb="1"
            style={{ display: 'block' }}
          >
            {label}
          </Text>
        )}
        <RadixTextField.Root
          {...props}
          ref={ref}
          id={id}
          color={error ? 'red' : props.color}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={
            [describedBy, message ? helpId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
        >
          {slotStart && (
            <RadixTextField.Slot side="left">{slotStart}</RadixTextField.Slot>
          )}
          {slotEnd && (
            <RadixTextField.Slot side="right">{slotEnd}</RadixTextField.Slot>
          )}
        </RadixTextField.Root>
        {message && (
          <Text
            as="p"
            id={helpId}
            size="1"
            color={error ? 'red' : 'gray'}
            mt="1"
            mb="0"
          >
            {message}
          </Text>
        )}
      </div>
    );
  }
);
