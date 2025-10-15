'use client';

import { useRef } from 'react';

export function useVariableInsertion() {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const input = inputRef.current;
    const textarea = textareaRef.current;
    
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      
      // Insert the variable at the cursor position
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      // Update the input value
      input.value = newText;
      
      // Trigger onChange event for React state
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      // Set cursor position after the inserted variable
      const newCursorPos = start + variable.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    } else if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      // Insert the variable at the cursor position
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      // Update the textarea value
      textarea.value = newText;
      
      // Trigger onChange event for React state
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
      
      // Set cursor position after the inserted variable
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }
  };

  return {
    inputRef,
    textareaRef,
    insertVariable
  };
}
