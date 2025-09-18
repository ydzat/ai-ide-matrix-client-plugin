// Matrix Client Main Component
// Main application component that orchestrates the entire Matrix client UI

import * as React from 'react';
import { themeManager } from './styles/themes.js';
import { authStore } from './stores/AuthStore.js';
import { roomsStore } from './stores/RoomsStore.js';
import { eventBus, MATRIX_EVENTS } from './utils/EventBus.js';
import LoginForm from './components/auth/LoginForm.js';
import Sidebar from './components/layout/Sidebar.js';
import ChatArea from './components/chat/ChatArea.js';

/**
 * Main Matrix Client Application Component
 */
export function MatrixClient() {
  const [authState, setAuthState] = React.useState(authStore.getState());
  const [roomsState, setRoomsState] = React.useState(roomsStore.getState());
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize application
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize theme system
        themeManager.initialize();

        // Initialize auth store (checks for existing session)
        await authStore.initialize();

        // If authenticated, initialize rooms store
        if (authStore.getState().isAuthenticated) {
          await roomsStore.initialize();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Matrix client:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Subscribe to store changes
  React.useEffect(() => {
    const unsubscribeAuth = authStore.subscribe(setAuthState);
    const unsubscribeRooms = roomsStore.subscribe(setRoomsState);

    return () => {
      unsubscribeAuth();
      unsubscribeRooms();
    };
  }, []);

  // Initialize rooms when authentication succeeds
  React.useEffect(() => {
    if (authState.isAuthenticated && !roomsState.rooms.size) {
      roomsStore.initialize().catch(error => {
        console.error('Failed to initialize rooms:', error);
      });
    }
  }, [authState.isAuthenticated, roomsState.rooms.size]);

  // Show loading screen during initialization
  if (!isInitialized) {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center bg-[var(--bg-primary)]'
    }, [
      React.createElement('div', {
        key: 'loading',
        className: 'text-center space-y-4'
      }, [
        React.createElement('div', {
          key: 'spinner',
          className: 'h-8 w-8 animate-spin rounded-full border-4 border-[var(--border-primary)] border-t-[var(--interactive-primary)] mx-auto'
        }),
        React.createElement('p', {
          key: 'text',
          className: 'text-[var(--text-secondary)]'
        }, 'Initializing Matrix Client...')
      ])
    ]);
  }

  // Show login form if not authenticated
  if (!authState.isAuthenticated) {
    return React.createElement(LoginForm);
  }

  // Show main application interface
  return React.createElement('div', {
    className: 'h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]'
  }, [
    // Left sidebar
    React.createElement(Sidebar, {
      key: 'sidebar'
    }),

    // Main content area
    React.createElement(ChatArea, {
      key: 'main',
      roomId: roomsState.selectedRoomId
    })
  ]);
}

export default MatrixClient;