# Matrix Client Plugin for AI IDE

A VS Code extension that provides a Matrix/Element-style chat interface directly within the IDE.

## 🎨 UI Design

The plugin follows the official Element Web client design with a three-column layout:

### 1. Activity Bar (Left Column)
- **User Avatar**: Click to open user menu with settings and logout options
- **Home Space**: Default view showing all rooms and direct messages
- **Spaces**: Custom Matrix spaces with unread indicators
- **Settings Button**: Access to plugin configuration

### 2. Left Panel (Middle Column)
- **Search Bar**: Filter rooms and conversations
- **Room Tabs**: Switch between "Rooms" and "People" (direct messages)
- **Room List**:
  - Sorted by priority: mentions → unread → recent activity → alphabetical
  - Shows unread badges and mention counts
  - Displays online status for direct messages
- **Quick Actions**: Create room and join room buttons

### 3. Main Content (Right Column)
- **Room Header**:
  - Room name, topic, and member count
  - Action buttons: Video call, Threads, Room info, People (toggle member list)
- **Message Area**: Scrollable message history with proper formatting
- **Message Composer**:
  - Auto-resizing text input
  - Attachment and emoji buttons
  - Send button with keyboard shortcuts (Enter to send, Shift+Enter for new line)

### 4. Member List (Collapsible Right Sidebar)
- **Member Sorting**: Following Element's hierarchy:
  1. Current user (you)
  2. Online administrators
  3. Online members
  4. Offline administrators
  5. Offline members
- **Member Info**: Avatar, display name, user ID, presence status, and role badges
- **Click to View Profile**: Opens member profile dialog

## 🎯 Key Features

### Element Web Compatibility
- **Exact Layout Match**: Pixel-perfect recreation of Element Web's interface
- **Consistent Styling**: Uses Element's color scheme and design tokens
- **Familiar Interactions**: All buttons and actions work as expected from Element

### Advanced Member Management
- **Real-time Presence**: Shows online/away/offline status from Matrix server
- **Role Detection**: Automatically detects and displays admin/moderator badges
- **Smart Sorting**: Members sorted by status and role as per Element's algorithm
- **Profile Integration**: Click any member to view their full profile

### Modern UI Components
- **Radix UI Integration**: Uses professional UI components instead of custom implementations
- **Responsive Design**: Adapts to different screen sizes and panel configurations
- **Smooth Animations**: Subtle transitions and hover effects
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Matrix Protocol Support
- **Full E2EE**: End-to-end encryption with device verification
- **Real-time Sync**: Live message updates and typing indicators
- **Rich Media**: Support for images, files, and formatted messages
- **Spaces Support**: Full Matrix Spaces integration with hierarchical organization

## 🚀 Usage

### Opening the Plugin
1. Open VS Code
2. Click the Matrix icon in the Activity Bar
3. Sign in with your Matrix credentials
4. Start chatting!

### Navigation
- **Switch Spaces**: Click space icons in the Activity Bar
- **Filter Rooms**: Use the search bar in the Left Panel
- **Toggle Views**: Switch between "Rooms" and "People" tabs
- **Show/Hide Members**: Click the "People" button in the room header

### Messaging
- **Send Messages**: Type and press Enter (Shift+Enter for new lines)
- **Attach Files**: Click the paperclip icon
- **Add Emojis**: Click the emoji button
- **View Threads**: Click the threads button in room header

### Member Interaction
- **View Online Status**: Green dot = online, yellow = away, gray = offline
- **Identify Roles**: Red badge = admin, yellow badge = moderator
- **Access Profiles**: Click any member in the member list

## 🔧 Technical Details

### Architecture
- **Component-based**: Modular UI components for maintainability
- **State Management**: Centralized state with reactive updates
- **Event-driven**: Real-time updates via Matrix sync API
- **Extensible**: Plugin architecture for additional features

### Dependencies
- **Radix UI**: Professional React components
- **Matrix SDK**: Official Matrix protocol implementation
- **VS Code API**: Native IDE integration
- **Lucide Icons**: Consistent iconography

### Performance
- **Virtual Scrolling**: Efficient rendering of large message lists
- **Lazy Loading**: On-demand loading of room history and media
- **Optimized Rendering**: Minimal DOM updates for smooth performance
- **Memory Management**: Proper cleanup and garbage collection

## 📚 API Documentation

For detailed API documentation, see:
- [Matrix-nio Proxy API Documentation](../../docs/07-api-design/01-matrix-nio-proxy-api-documentation.md)
- [E2EE Compatibility Report](../../docs/07-api-design/02-e2ee-compatibility-report.md)
- [Comprehensive Test Report](../../docs/07-api-design/03-comprehensive-test-report.md)

## 🧪 Testing

To test the UI components:

```bash
# Open the test page
open test-ui.html
```

The test page provides a mock environment with sample data to verify the UI layout and interactions.

## 🎨 Customization

The plugin uses CSS custom properties for theming:

```css
--color-bg-primary: #0d1117;
--color-bg-secondary: #161b22;
--color-bg-tertiary: #21262d;
--color-border: #30363d;
--color-text-primary: #f0f6fc;
--color-text-secondary: #8b949e;
--color-accent: #238636;
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the provided test page
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.