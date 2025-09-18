// Message Input Component
// Handles message composition and sending with formatting support

import * as React from 'react';
import { Button, IconButton } from '../base/Button.js';
import { apiClient } from '../../utils/ApiClient.js';
import { eventBus, MATRIX_EVENTS } from '../../utils/EventBus.js';

/**
 * Message Input Component
 * Provides rich text input for composing and sending messages
 */
export function MessageInput({ roomId, disabled = false }) {
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showFormatting, setShowFormatting] = React.useState(false);
  const textareaRef = React.useRef(null);
  const typingTimeoutRef = React.useRef(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Handle typing indicators
  React.useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      // Send typing notification to server
      apiClient.sendTyping(roomId, true).catch(console.error);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        apiClient.sendTyping(roomId, false).catch(console.error);
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, roomId, isTyping]);

  const handleInputChange = (event) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) {
      return;
    }

    try {
      setIsSending(true);

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        apiClient.sendTyping(roomId, false).catch(console.error);
      }

      // Send message
      const response = await apiClient.sendMessage(roomId, trimmedMessage);

      if (response.success) {
        setMessage('');
        // Emit event for message sent
        eventBus.emit(MATRIX_EVENTS.MESSAGE_SENT, {
          roomId,
          message: trimmedMessage,
          eventId: response.event_id
        });
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error notification
      eventBus.emit(MATRIX_EVENTS.ERROR, {
        message: 'Failed to send message: ' + error.message
      });
    } finally {
      setIsSending(false);
    }
  };

  const insertText = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + text + message.substring(end);

    setMessage(newMessage);

    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const handleEmojiSelect = (emoji) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };

  const applyFormatting = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'quoted text'}`;
        break;
      default:
        return;
    }

    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      if (!selectedText) {
        // Select the placeholder text
        const placeholderStart = start + formattedText.indexOf(formattedText.match(/[a-z ]+/)[0]);
        const placeholderEnd = placeholderStart + formattedText.match(/[a-z ]+/)[0].length;
        textarea.selectionStart = placeholderStart;
        textarea.selectionEnd = placeholderEnd;
      }
    }, 0);
  };

  // Common emojis for quick access
  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥'];

  return React.createElement('div', {
    className: 'border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4'
  }, [
    // Formatting toolbar (if enabled)
    showFormatting && React.createElement('div', {
      key: 'formatting-toolbar',
      className: 'flex items-center space-x-2 mb-3 pb-3 border-b border-[var(--border-primary)]'
    }, [
      React.createElement('div', {
        key: 'format-buttons',
        className: 'flex items-center space-x-1'
      }, [
        React.createElement(IconButton, {
          key: 'bold',
          size: 'sm',
          variant: 'ghost',
          onClick: () => applyFormatting('bold'),
          title: 'Bold (Ctrl+B)'
        }, 'B'),

        React.createElement(IconButton, {
          key: 'italic',
          size: 'sm',
          variant: 'ghost',
          onClick: () => applyFormatting('italic'),
          title: 'Italic (Ctrl+I)'
        }, 'I'),

        React.createElement(IconButton, {
          key: 'code',
          size: 'sm',
          variant: 'ghost',
          onClick: () => applyFormatting('code'),
          title: 'Inline code'
        }, '<>'),

        React.createElement(IconButton, {
          key: 'quote',
          size: 'sm',
          variant: 'ghost',
          onClick: () => applyFormatting('quote'),
          title: 'Quote'
        }, '"'),

        React.createElement(IconButton, {
          key: 'codeblock',
          size: 'sm',
          variant: 'ghost',
          onClick: () => applyFormatting('codeblock'),
          title: 'Code block'
        }, '{}')
      ])
    ]),

    // Main input area
    React.createElement('div', {
      key: 'input-area',
      className: 'flex items-end space-x-3'
    }, [
      // Text input
      React.createElement('div', {
        key: 'input-container',
        className: 'flex-1 relative'
      }, [
        React.createElement('textarea', {
          key: 'textarea',
          ref: textareaRef,
          value: message,
          onChange: handleInputChange,
          onKeyPress: handleKeyPress,
          placeholder: disabled ? 'You cannot send messages to this room' : 'Type a message...',
          disabled: disabled || isSending,
          className: `w-full min-h-[40px] max-h-[120px] px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:border-transparent ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`,
          style: { scrollbarWidth: 'thin' }
        }),

        // Character count (if approaching limit)
        message.length > 800 && React.createElement('div', {
          key: 'char-count',
          className: `absolute bottom-1 right-1 text-xs ${
            message.length > 1000 ? 'text-[var(--status-error)]' : 'text-[var(--text-tertiary)]'
          }`
        }, `${message.length}/1000`)
      ]),

      // Action buttons
      React.createElement('div', {
        key: 'actions',
        className: 'flex items-center space-x-2'
      }, [
        // Emoji picker toggle
        React.createElement('div', {
          key: 'emoji-container',
          className: 'relative'
        }, [
          React.createElement(IconButton, {
            key: 'emoji-button',
            size: 'sm',
            variant: 'ghost',
            onClick: () => setShowEmojiPicker(!showEmojiPicker),
            className: showEmojiPicker ? 'bg-[var(--interactive-secondary)]' : ''
          }, '😊'),

          // Emoji picker
          showEmojiPicker && React.createElement('div', {
            key: 'emoji-picker',
            className: 'absolute bottom-full right-0 mb-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg shadow-lg p-3 z-10'
          }, [
            React.createElement('div', {
              key: 'emoji-grid',
              className: 'grid grid-cols-5 gap-2'
            }, commonEmojis.map(emoji =>
              React.createElement('button', {
                key: emoji,
                className: 'p-2 hover:bg-[var(--interactive-secondary)] rounded text-lg',
                onClick: () => handleEmojiSelect(emoji)
              }, emoji)
            ))
          ])
        ]),

        // Formatting toggle
        React.createElement(IconButton, {
          key: 'format-button',
          size: 'sm',
          variant: 'ghost',
          onClick: () => setShowFormatting(!showFormatting),
          className: showFormatting ? 'bg-[var(--interactive-secondary)]' : '',
          title: 'Toggle formatting toolbar'
        }, 'Aa'),

        // Send button
        React.createElement(Button, {
          key: 'send-button',
          size: 'sm',
          onClick: handleSendMessage,
          disabled: !message.trim() || isSending || disabled,
          loading: isSending,
          className: 'px-4'
        }, isSending ? 'Sending...' : 'Send')
      ])
    ]),

    // Typing indicator
    isTyping && React.createElement('div', {
      key: 'typing-indicator',
      className: 'mt-2 text-xs text-[var(--text-tertiary)]'
    }, 'Typing...')
  ]);
}

export default MessageInput;