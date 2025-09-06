/**
 * Matrix Client Plugin for AI IDE
 * 
 * Provides secure, decentralized messaging integration using Matrix protocol.
 * This plugin acts as a bridge between the AI IDE and Matrix networks.
 */

// Plugin state
let matrixClientState = {
    connected: false,
    homeserver: '',
    userId: '',
    accessToken: '',
    deviceId: 'ai-ide-matrix-client',
    rooms: new Map(),
    subscriptionActive: false,
    websocket: null,
    currentRoom: null,
    messageHistory: new Map() // roomId -> messages array
};

// Extension activation function
function activate(context) {
    console.log('Matrix Client plugin is now active!');
    
    // Initialize plugin state from configuration
    initializeFromConfig();
    
    // Register all commands
    registerCommands(context);
    
    // Subscribe to message proxy if auto-connect is enabled
    const config = vscode.workspace.getConfiguration('matrix-client');
    if (config.get('autoConnect') && matrixClientState.accessToken) {
        setTimeout(() => {
            connectToMatrix();
        }, 2000); // Delay to ensure backend is ready
    }
    
    // Log successful activation
    console.log('Matrix Client plugin commands registered successfully');
    
    // Return public API
    return {
        getState: () => matrixClientState,
        connect: connectToMatrix,
        disconnect: disconnectFromMatrix,
        sendMessage: sendMatrixMessage,
        joinRoom: joinRoom,
        leaveRoom: leaveRoom,
        loadRooms: loadRooms,
        getRooms: () => Array.from(matrixClientState.rooms.values()),
        getCurrentRoom: () => matrixClientState.currentRoom,
        setCurrentRoom: (roomId) => {
            const room = matrixClientState.rooms.get(roomId);
            if (room) {
                matrixClientState.currentRoom = room;
                return room;
            }
            return null;
        },
        getMessageHistory: (roomId) => matrixClientState.messageHistory.get(roomId) || [],
        isConnected: () => matrixClientState.connected,
        // New API methods for UI
        login: loginToMatrix,
        getUserProfile: getUserProfile,
        getJoinedRooms: getJoinedRooms,
        getRoomState: getRoomState
    };
}

// Initialize plugin state from VSCode configuration
function initializeFromConfig() {
    const config = vscode.workspace.getConfiguration('matrix-client');
    
    matrixClientState.homeserver = config.get('homeserver') || 'https://matrix.org';
    matrixClientState.accessToken = config.get('accessToken') || '';
    matrixClientState.userId = config.get('userId') || '';
    matrixClientState.deviceId = config.get('deviceId') || 'ai-ide-matrix-client';
    
    console.log('Matrix Client initialized with config:', {
        homeserver: matrixClientState.homeserver,
        userId: matrixClientState.userId,
        hasToken: !!matrixClientState.accessToken
    });
}

// Register all plugin commands
function registerCommands(context) {
    // Connect command
    const connectCommand = vscode.commands.registerCommand('matrix-client.connect', async () => {
        try {
            await connectToMatrix();
            vscode.window.showInformationMessage('Connected to Matrix successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to connect to Matrix: ${error.message}`);
        }
    });
    
    // Disconnect command
    const disconnectCommand = vscode.commands.registerCommand('matrix-client.disconnect', async () => {
        try {
            await disconnectFromMatrix();
            vscode.window.showInformationMessage('Disconnected from Matrix');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to disconnect: ${error.message}`);
        }
    });
    
    // Send message command
    const sendMessageCommand = vscode.commands.registerCommand('matrix-client.sendMessage', async () => {
        if (!matrixClientState.connected) {
            vscode.window.showWarningMessage('Please connect to Matrix first');
            return;
        }
        
        const roomId = await vscode.window.showInputBox({
            prompt: 'Enter room ID or user ID',
            placeholder: '!room:matrix.org or @user:matrix.org'
        });
        
        if (!roomId) return;
        
        const message = await vscode.window.showInputBox({
            prompt: 'Enter your message',
            placeholder: 'Type your message here...'
        });
        
        if (!message) return;
        
        try {
            await sendMatrixMessage(roomId, message);
            vscode.window.showInformationMessage('Message sent successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to send message: ${error.message}`);
        }
    });
    
    // Join room command
    const joinRoomCommand = vscode.commands.registerCommand('matrix-client.joinRoom', async () => {
        if (!matrixClientState.connected) {
            vscode.window.showWarningMessage('Please connect to Matrix first');
            return;
        }

        const roomId = await vscode.window.showInputBox({
            prompt: 'Enter room ID or alias to join',
            placeholder: '!room:matrix.org or #room:matrix.org'
        });

        if (roomId) {
            try {
                await joinRoom(roomId);
                vscode.window.showInformationMessage(`Successfully joined room: ${roomId}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to join room: ${error.message}`);
            }
        }
    });

    // Leave room command
    const leaveRoomCommand = vscode.commands.registerCommand('matrix-client.leaveRoom', async () => {
        if (!matrixClientState.connected) {
            vscode.window.showWarningMessage('Please connect to Matrix first');
            return;
        }

        // Show list of joined rooms to choose from
        const roomItems = Array.from(matrixClientState.rooms.values()).map(room => ({
            label: room.name || room.id,
            description: room.id,
            detail: room.topic || `${room.memberCount} members`
        }));

        if (roomItems.length === 0) {
            vscode.window.showInformationMessage('No rooms to leave');
            return;
        }

        const selectedRoom = await vscode.window.showQuickPick(roomItems, {
            placeHolder: 'Select room to leave'
        });

        if (selectedRoom) {
            try {
                await leaveRoom(selectedRoom.description);
                vscode.window.showInformationMessage(`Left room: ${selectedRoom.label}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to leave room: ${error.message}`);
            }
        }
    });
    
    // Show settings command
    const showSettingsCommand = vscode.commands.registerCommand('matrix-client.showSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'matrix-client');
    });
    
    // Add all commands to subscriptions
    context.subscriptions.push(
        connectCommand,
        disconnectCommand,
        sendMessageCommand,
        joinRoomCommand,
        leaveRoomCommand,
        showSettingsCommand
    );
}

// Connect to Matrix using message proxy
async function connectToMatrix() {
    if (matrixClientState.connected) {
        console.log('Already connected to Matrix');
        return;
    }

    if (!matrixClientState.accessToken) {
        throw new Error('Access token not configured. Please set matrix-client.accessToken in settings.');
    }

    try {
        // First, configure the Element adapter with our settings
        const adapterConfig = {
            homeserver: matrixClientState.homeserver,
            access_token: matrixClientState.accessToken,
            user_id: matrixClientState.userId,
            device_id: matrixClientState.deviceId
        };

        // Configure Element adapter
        const configResponse = await fetch('http://localhost:8000/api/message-proxy/adapters/element/configure', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adapterConfig)
        });

        if (!configResponse.ok) {
            const errorText = await configResponse.text();
            throw new Error(`Failed to configure Element adapter: ${errorText}`);
        }

        console.log('Element adapter configured successfully');

        // Connect the adapter
        const connectResponse = await fetch('http://localhost:8000/api/message-proxy/adapters/element/connect', {
            method: 'POST'
        });

        if (!connectResponse.ok) {
            const errorText = await connectResponse.text();
            throw new Error(`Failed to connect Element adapter: ${errorText}`);
        }

        console.log('Element adapter connected successfully');

        // Subscribe to Matrix messages through message proxy
        const subscribeResponse = await fetch('http://localhost:8000/api/message-proxy/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plugin_id: 'ai-ide-matrix-client-plugin',
                sources: ['element'],
                keywords: [], // Subscribe to all messages
                room_ids: [] // Subscribe to all rooms
            })
        });

        if (!subscribeResponse.ok) {
            throw new Error(`Failed to subscribe to messages: ${subscribeResponse.statusText}`);
        }

        const subscribeResult = await subscribeResponse.json();
        console.log('Subscribed to Matrix messages:', subscribeResult);

        // Update connection state
        matrixClientState.connected = true;
        matrixClientState.subscriptionActive = true;

        // Start listening for messages via WebSocket
        setupMessageListener();

        // Load initial rooms
        await loadRooms();

        console.log('Connected to Matrix successfully');

    } catch (error) {
        console.error('Failed to connect to Matrix:', error);
        throw error;
    }
}

// Disconnect from Matrix
async function disconnectFromMatrix() {
    if (!matrixClientState.connected) {
        console.log('Not connected to Matrix');
        return;
    }

    try {
        // Close WebSocket connection
        if (matrixClientState.websocket) {
            matrixClientState.websocket.close();
            matrixClientState.websocket = null;
        }

        // Unsubscribe from messages
        const unsubscribeResponse = await fetch(
            `http://localhost:8000/api/message-proxy/subscribe/ai-ide-matrix-client-plugin`,
            {
                method: 'DELETE'
            }
        );

        if (!unsubscribeResponse.ok) {
            console.warn('Failed to unsubscribe from messages:', unsubscribeResponse.statusText);
        }

        // Disconnect the Element adapter
        const disconnectResponse = await fetch('http://localhost:8000/api/message-proxy/adapters/element/disconnect', {
            method: 'POST'
        });

        if (!disconnectResponse.ok) {
            console.warn('Failed to disconnect Element adapter:', disconnectResponse.statusText);
        }

        // Update connection state
        matrixClientState.connected = false;
        matrixClientState.subscriptionActive = false;
        matrixClientState.rooms.clear();

        console.log('Disconnected from Matrix');

    } catch (error) {
        console.error('Error during disconnect:', error);
        throw error;
    }
}

// Send message through Matrix
async function sendMatrixMessage(targetId, text) {
    if (!matrixClientState.connected) {
        throw new Error('Not connected to Matrix');
    }
    
    try {
        const response = await fetch('http://localhost:8000/api/message-proxy/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plugin_id: 'ai-ide-matrix-client-plugin',
                source: 'element',
                target_type: targetId.startsWith('@') ? 'person' : 'room',
                target_id: targetId,
                text: text,
                attachments: []
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Message sent:', result);
        
        return result;
        
    } catch (error) {
        console.error('Failed to send Matrix message:', error);
        throw error;
    }
}

// Setup WebSocket message listener
function setupMessageListener() {
    try {
        const wsUrl = 'ws://localhost:8000/ws/extensions';
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = function(event) {
            console.log('WebSocket connected for Matrix client');
            matrixClientState.websocket = websocket;

            // Send identification message
            websocket.send(JSON.stringify({
                type: 'identify',
                plugin_id: 'ai-ide-matrix-client-plugin'
            }));
        };

        websocket.onmessage = function(event) {
            try {
                const message = JSON.parse(event.data);
                handleIncomingMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = function(event) {
            console.log('WebSocket connection closed:', event.code, event.reason);
            matrixClientState.websocket = null;

            // Attempt to reconnect if still connected to Matrix
            if (matrixClientState.connected) {
                setTimeout(() => {
                    console.log('Attempting to reconnect WebSocket...');
                    setupMessageListener();
                }, 5000);
            }
        };

    } catch (error) {
        console.error('Failed to setup WebSocket listener:', error);
    }
}

// Handle incoming messages from WebSocket
function handleIncomingMessage(message) {
    console.log('Received message:', message);

    switch (message.type) {
        case 'messageEvent':
            handleMatrixMessage(message.data);
            break;
        case 'roomEvent':
            handleRoomEvent(message.data);
            break;
        case 'userEvent':
            handleUserEvent(message.data);
            break;
        case 'connectionStatus':
            handleConnectionStatus(message.data);
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
}

// Handle Matrix message events
function handleMatrixMessage(messageData) {
    console.log('Matrix message received:', messageData);

    // Update room's last message
    const roomId = messageData.room_id;
    if (matrixClientState.rooms.has(roomId)) {
        const room = matrixClientState.rooms.get(roomId);
        room.lastMessage = {
            sender: messageData.sender?.name || messageData.sender?.id || 'Unknown',
            content: messageData.content?.text || '',
            timestamp: messageData.timestamp
        };
        room.lastActivity = messageData.timestamp;

        // Increment unread count if not from current user
        if (messageData.sender?.id !== matrixClientState.userId) {
            room.unreadCount = (room.unreadCount || 0) + 1;
        }
    }

    // Show notification if enabled
    const config = vscode.workspace.getConfiguration('matrix-client');
    if (config.get('showNotifications') && messageData.sender?.id !== matrixClientState.userId) {
        vscode.window.showInformationMessage(
            `New message from ${messageData.sender?.name || 'Unknown'}: ${messageData.content?.text || ''}`,
            'View'
        ).then(selection => {
            if (selection === 'View') {
                // TODO: Open chat view for this room
                console.log('Opening chat view for room:', roomId);
            }
        });
    }
}

// Handle room events
function handleRoomEvent(roomData) {
    console.log('Room event received:', roomData);

    // Update room information
    if (roomData.id) {
        matrixClientState.rooms.set(roomData.id, {
            id: roomData.id,
            name: roomData.name || roomData.id,
            topic: roomData.topic,
            memberCount: roomData.member_count || 0,
            isPublic: roomData.is_public || false,
            isEncrypted: roomData.is_encrypted || false,
            isDirect: roomData.is_direct || false,
            unreadCount: roomData.unread_count || 0,
            lastActivity: roomData.last_activity,
            lastMessage: roomData.last_message
        });
    }
}

// Handle user events
function handleUserEvent(userData) {
    console.log('User event received:', userData);
    // TODO: Handle user presence, profile updates, etc.
}

// Handle connection status changes
function handleConnectionStatus(statusData) {
    console.log('Connection status changed:', statusData);

    if (statusData.connected !== undefined) {
        matrixClientState.connected = statusData.connected;

        if (!statusData.connected) {
            // Connection lost, clear state
            matrixClientState.rooms.clear();
            matrixClientState.subscriptionActive = false;
        }
    }
}

// Load rooms from Matrix
async function loadRooms() {
    try {
        console.log('Loading rooms from Matrix...');

        // Query rooms through message proxy
        const response = await fetch('http://localhost:8000/api/message-proxy/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plugin_id: 'ai-ide-matrix-client-plugin',
                sources: ['element'],
                query_type: 'rooms',
                limit: 100
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Loaded rooms:', result);

            // Process rooms data
            if (result.rooms) {
                result.rooms.forEach(room => {
                    matrixClientState.rooms.set(room.id, {
                        id: room.id,
                        name: room.name || room.id,
                        topic: room.topic,
                        memberCount: room.member_count || 0,
                        isPublic: room.is_public || false,
                        isEncrypted: room.is_encrypted || false,
                        isDirect: room.is_direct || false,
                        unreadCount: room.unread_count || 0,
                        lastActivity: room.last_activity,
                        lastMessage: room.last_message,
                        status: 'joined'
                    });
                });

                console.log(`Loaded ${result.rooms.length} rooms`);
            }
        } else {
            console.warn('Failed to load rooms:', response.statusText);
        }

    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Join a Matrix room
async function joinRoom(roomId) {
    try {
        console.log('Joining room:', roomId);

        const response = await fetch('http://localhost:8000/api/message-proxy/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plugin_id: 'ai-ide-matrix-client-plugin',
                source: 'element',
                action: 'join_room',
                room_id: roomId
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Joined room successfully:', result);

            // Add room to local state
            matrixClientState.rooms.set(roomId, {
                id: roomId,
                name: roomId.replace(/[!#@]/, '').split(':')[0],
                topic: '',
                memberCount: 1,
                isPublic: roomId.startsWith('#'),
                isEncrypted: false,
                isDirect: roomId.startsWith('@'),
                unreadCount: 0,
                lastActivity: new Date().toISOString(),
                lastMessage: null,
                status: 'joined'
            });

            return result;
        } else {
            throw new Error(`Failed to join room: ${response.statusText}`);
        }

    } catch (error) {
        console.error('Error joining room:', error);
        throw error;
    }
}

// Leave a Matrix room
async function leaveRoom(roomId) {
    try {
        console.log('Leaving room:', roomId);

        const response = await fetch('http://localhost:8000/api/message-proxy/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plugin_id: 'ai-ide-matrix-client-plugin',
                source: 'element',
                action: 'leave_room',
                room_id: roomId
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Left room successfully:', result);

            // Remove room from local state
            matrixClientState.rooms.delete(roomId);

            return result;
        } else {
            throw new Error(`Failed to leave room: ${response.statusText}`);
        }

    } catch (error) {
        console.error('Error leaving room:', error);
        throw error;
    }
}

// New API methods for UI integration

// Login to Matrix (for UI)
async function loginToMatrix(homeserver, username, password) {
    try {
        // Create temporary element adapter instance for login
        const response = await fetch('http://localhost:8000/api/message-proxy/element/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                homeserver: homeserver,
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const result = await response.json();

            if (result.success) {
                // Update plugin state with login credentials
                matrixClientState.homeserver = homeserver;
                matrixClientState.userId = result.user_id;
                matrixClientState.accessToken = result.access_token;
                matrixClientState.deviceId = result.device_id;

                // Save to VSCode settings for persistence
                const config = vscode.workspace.getConfiguration('matrix-client');
                await config.update('homeserver', homeserver, vscode.ConfigurationTarget.Global);
                await config.update('userId', result.user_id, vscode.ConfigurationTarget.Global);
                await config.update('accessToken', result.access_token, vscode.ConfigurationTarget.Global);
                await config.update('deviceId', result.device_id, vscode.ConfigurationTarget.Global);
            }

            return result;
        } else {
            const error = await response.json();
            return { success: false, error: error.message || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Get user profile (for UI)
async function getUserProfile(accessToken, userId) {
    try {
        const response = await fetch('http://localhost:8000/api/message-proxy/element/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: accessToken,
                user_id: userId
            })
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            return { success: false, error: error.message || 'Failed to get profile' };
        }
    } catch (error) {
        console.error('Get profile error:', error);
        return { success: false, error: error.message };
    }
}

// Get joined rooms (for UI)
async function getJoinedRooms(accessToken) {
    try {
        const response = await fetch('http://localhost:8000/api/message-proxy/element/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: accessToken
            })
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            return { success: false, error: error.message || 'Failed to get rooms' };
        }
    } catch (error) {
        console.error('Get rooms error:', error);
        return { success: false, error: error.message };
    }
}

// Get room state (for UI)
async function getRoomState(accessToken, roomId) {
    try {
        const response = await fetch('http://localhost:8000/api/message-proxy/element/room-state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: accessToken,
                room_id: roomId
            })
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            return { success: false, error: error.message || 'Failed to get room state' };
        }
    } catch (error) {
        console.error('Get room state error:', error);
        return { success: false, error: error.message };
    }
}

// Extension deactivation function
function deactivate() {
    console.log('Matrix Client plugin is being deactivated');

    // Disconnect if connected
    if (matrixClientState.connected) {
        disconnectFromMatrix().catch(error => {
            console.error('Error disconnecting during deactivation:', error);
        });
    }
}

// Export the activation and deactivation functions
module.exports = {
    activate,
    deactivate
};
