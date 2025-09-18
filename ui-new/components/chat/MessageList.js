// Message List Component
// Displays messages in a room with virtual scrolling and real-time updates

import * as React from 'react';
import { roomsStore } from '../../stores/RoomsStore.js';
import { apiClient } from '../../utils/ApiClient.js';
import { eventBus, MATRIX_EVENTS } from '../../utils/EventBus.js';

/**
 * Message Component
 * Renders individual message with sender info, content, and metadata
 */
function Message({ message, previousMessage, nextMessage, currentUserId }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getSenderDisplayName = () => {
    return message.sender_display_name || message.sender || 'Unknown User';
  };

  const getSenderAvatar = () => {
    const displayName = getSenderDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  const isFromSameUser = previousMessage && previousMessage.sender === message.sender;
  const isConsecutive = isFromSameUser &&
    (new Date(message.origin_server_ts) - new Date(previousMessage.origin_server_ts)) < 5 * 60 * 1000; // 5 minutes

  const isOwnMessage = message.sender === currentUserId;

  // Message content rendering
  const renderMessageContent = () => {
    switch (message.msgtype) {
      case 'm.text':
        return React.createElement('div', {
          className: 'text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words'
        }, message.body);

      case 'm.emote':
        return React.createElement('div', {
          className: 'text-sm text-[var(--text-secondary)] italic'
        }, `* ${getSenderDisplayName()} ${message.body}`);

      case 'm.notice':
        return React.createElement('div', {
          className: 'text-sm text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded'
        }, message.body);

      case 'm.image':
      case 'm.file':
      case 'm.video':
      case 'm.audio':
        return React.createElement('div', {
          className: 'text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-2 rounded border-l-4 border-[var(--interactive-primary)]'
        }, [
          React.createElement('div', {
            key: 'filename',
            className: 'font-medium'
          }, message.filename || message.body),
          message.info && React.createElement('div', {
            key: 'info',
            className: 'text-xs text-[var(--text-tertiary)] mt-1'
          }, `${message.info.mimetype || 'Unknown type'} • ${
            message.info.size ? (message.info.size / 1024).toFixed(1) + ' KB' : 'Unknown size'
          }`)
        ]);

      default:
        return React.createElement('div', {
          className: 'text-sm text-[var(--text-tertiary)] italic'
        }, `Unsupported message type: ${message.msgtype}`);
    }
  };

  return React.createElement('div', {
    className: `group relative ${isConsecutive ? 'mt-1' : 'mt-4'} ${isOwnMessage ? 'ml-12' : 'mr-12'}`
  }, [
    // Sender info (only for first message in sequence)
    !isConsecutive && React.createElement('div', {
      key: 'sender-info',
      className: `flex items-center space-x-3 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`
    }, [
      !isOwnMessage && React.createElement('div', {
        key: 'avatar',
        className: 'w-6 h-6 rounded-full bg-[var(--interactive-primary)] flex items-center justify-center text-[var(--text-inverse)] text-xs font-semibold'
      }, getSenderAvatar()),

      React.createElement('div', {
        key: 'name-time',
        className: `flex items-center space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`
      }, [
        React.createElement('span', {
          key: 'name',
          className: 'text-sm font-medium text-[var(--text-primary)]'
        }, getSenderDisplayName()),

        React.createElement('span', {
          key: 'time',
          className: 'text-xs text-[var(--text-tertiary)]'
        }, formatTime(message.origin_server_ts))
      ]),

      isOwnMessage && React.createElement('div', {
        key: 'avatar',
        className: 'w-6 h-6 rounded-full bg-[var(--interactive-primary)] flex items-center justify-center text-[var(--text-inverse)] text-xs font-semibold'
      }, getSenderAvatar())
    ]),

    // Message content
    React.createElement('div', {
      key: 'content',
      className: `${isOwnMessage ? 'text-right' : 'text-left'} ${isConsecutive ? 'ml-9' : ''}`
    }, [
      React.createElement('div', {
        key: 'bubble',
        className: `inline-block max-w-full px-3 py-2 rounded-lg ${
          isOwnMessage
            ? 'bg-[var(--interactive-primary)] text-[var(--text-inverse)]'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
        }`
      }, [
        renderMessageContent()
      ])
    ]),

    // Message actions (visible on hover)
    React.createElement('div', {
      key: 'actions',
      className: `absolute top-0 ${isOwnMessage ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity`
    }, [
      React.createElement('div', {
        key: 'action-buttons',
        className: 'flex items-center space-x-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-md shadow-sm p-1'
      }, [
        React.createElement('button', {
          key: 'react',
          className: 'p-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] rounded',
          title: 'Add reaction'
        }, '😊'),

        React.createElement('button', {
          key: 'reply',
          className: 'p-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] rounded',
          title: 'Reply'
        }, '↩'),

        React.createElement('button', {
          key: 'more',
          className: 'p-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] rounded',
          title: 'More actions'
        }, '⋯')
      ])
    ])
  ]);
}

/**
 * Date Separator Component
 * Shows date separators between messages from different days
 */
function DateSeparator({ date }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return React.createElement('div', {
    className: 'flex items-center justify-center my-4'
  }, [
    React.createElement('div', {
      key: 'separator',
      className: 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs px-3 py-1 rounded-full border border-[var(--border-primary)]'
    }, formatDate(date))
  ]);
}

/**
 * Main Message List Component
 */
export function MessageList({ roomId }) {
  const [messages, setMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const messagesEndRef = React.useRef(null);

  // Get current user ID from auth store
  React.useEffect(() => {
    const authState = JSON.parse(localStorage.getItem('matrix-auth-state') || '{}');
    setCurrentUserId(authState.user?.user_id);
  }, []);

  // Load messages when room changes
  React.useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    loadMessages();
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for new messages
  React.useEffect(() => {
    const handleNewMessage = (data) => {
      if (data.roomId === roomId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    eventBus.on(MATRIX_EVENTS.MESSAGE_RECEIVED, handleNewMessage);

    return () => {
      eventBus.off(MATRIX_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
    };
  }, [roomId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getRoomMessages(roomId);
      if (response.success && response.data?.chunk) {
        // Sort messages by timestamp
        const sortedMessages = response.data.chunk.sort((a, b) =>
          new Date(a.origin_server_ts) - new Date(b.origin_server_ts)
        );
        setMessages(sortedMessages);
      } else {
        setError(response.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group messages by date for date separators
  const groupedMessages = React.useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.origin_server_ts);
      const messageDateString = messageDate.toDateString();

      if (currentDate !== messageDateString) {
        currentDate = messageDateString;
        groups.push({ type: 'date', date: messageDate });
      }

      groups.push({
        type: 'message',
        message,
        previousMessage: index > 0 ? messages[index - 1] : null,
        nextMessage: index < messages.length - 1 ? messages[index + 1] : null
      });
    });

    return groups;
  }, [messages]);

  if (isLoading) {
    return React.createElement('div', {
      className: 'flex-1 flex items-center justify-center'
    }, [
      React.createElement('div', {
        key: 'loading',
        className: 'text-center'
      }, [
        React.createElement('div', {
          key: 'spinner',
          className: 'w-6 h-6 border-2 border-[var(--interactive-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2'
        }),
        React.createElement('p', {
          key: 'text',
          className: 'text-sm text-[var(--text-secondary)]'
        }, 'Loading messages...')
      ])
    ]);
  }

  if (error) {
    return React.createElement('div', {
      className: 'flex-1 flex items-center justify-center'
    }, [
      React.createElement('div', {
        key: 'error',
        className: 'text-center max-w-md mx-auto p-6'
      }, [
        React.createElement('p', {
          key: 'message',
          className: 'text-[var(--status-error)] mb-4'
        }, error),
        React.createElement('button', {
          key: 'retry',
          className: 'px-4 py-2 bg-[var(--interactive-primary)] text-[var(--text-inverse)] rounded-md hover:bg-[var(--interactive-primary-hover)] transition-colors',
          onClick: loadMessages
        }, 'Retry')
      ])
    ]);
  }

  if (messages.length === 0) {
    return React.createElement('div', {
      className: 'flex-1 flex items-center justify-center'
    }, [
      React.createElement('div', {
        key: 'empty',
        className: 'text-center max-w-md mx-auto p-6'
      }, [
        React.createElement('p', {
          key: 'message',
          className: 'text-[var(--text-secondary)] mb-2'
        }, 'No messages yet'),
        React.createElement('p', {
          key: 'subtitle',
          className: 'text-sm text-[var(--text-tertiary)]'
        }, 'Be the first to send a message in this room!')
      ])
    ]);
  }

  return React.createElement('div', {
    className: 'flex-1 overflow-y-auto px-4 py-2 scrollbar-thin'
  }, [
    React.createElement('div', {
      key: 'messages',
      className: 'space-y-1'
    }, groupedMessages.map((item, index) => {
      if (item.type === 'date') {
        return React.createElement(DateSeparator, {
          key: `date-${item.date.getTime()}`,
          date: item.date
        });
      } else {
        return React.createElement(Message, {
          key: item.message.event_id || `message-${index}`,
          message: item.message,
          previousMessage: item.previousMessage,
          nextMessage: item.nextMessage,
          currentUserId
        });
      }
    })),

    // Scroll anchor
    React.createElement('div', {
      key: 'scroll-anchor',
      ref: messagesEndRef
    })
  ]);
}

export default MessageList;