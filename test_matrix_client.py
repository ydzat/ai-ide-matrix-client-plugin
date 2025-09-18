#!/usr/bin/env python3
"""
Matrix Client Test Script
Tests the Matrix client functionality through the message proxy API
"""

import asyncio
import aiohttp
import json
import os
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/message-proxy/element"

# Test user credentials (from userdata file)
USERDATA_FILE = Path(__file__).parent / "userdata"

async def load_test_credentials():
    """Load test credentials from userdata file"""
    try:
        # Try to read plain text format (homeserver, username, password)
        if USERDATA_FILE.exists():
            with open(USERDATA_FILE, 'r') as f:
                lines = [line.strip() for line in f.readlines()]
                if len(lines) >= 3:
                    homeserver = lines[0]
                    username = lines[1]
                    password = lines[2]

                    # Format user ID if needed
                    if not username.startswith('@'):
                        # Extract domain from homeserver
                        domain = homeserver.replace('https://', '').replace('http://', '')
                        user_id = f"@{username}:{domain}"
                    else:
                        user_id = username

                    return {
                        'homeserver': homeserver,
                        'username': username,
                        'password': password,
                        'user_id': user_id,
                        'access_token': None,
                        'device_id': None
                    }
    except Exception as e:
        print(f"Could not load credentials from userdata: {e}")

    # Fallback to environment variables or defaults
    return {
        'homeserver': os.getenv('MATRIX_HOMESERVER', 'https://matrix.org'),
        'user_id': os.getenv('MATRIX_USER_ID'),
        'access_token': os.getenv('MATRIX_ACCESS_TOKEN'),
        'device_id': os.getenv('MATRIX_DEVICE_ID')
    }

async def test_api_endpoint(session, endpoint, method='GET', data=None):
    """Test a single API endpoint"""
    url = f"{API_BASE}{endpoint}"

    try:
        if method == 'GET':
            async with session.get(url) as response:
                result = await response.json()
                return response.status, result
        elif method == 'POST':
            async with session.post(url, json=data) as response:
                result = await response.json()
                return response.status, result
        elif method == 'PUT':
            async with session.put(url, json=data) as response:
                result = await response.json()
                return response.status, result
    except Exception as e:
        return None, {'error': str(e)}

async def test_matrix_client():
    """Test Matrix client functionality"""
    print("🧪 Testing Matrix Client Implementation")
    print("=" * 50)

    # Load test credentials
    creds = await load_test_credentials()
    print(f"📋 Test Configuration:")
    print(f"   Homeserver: {creds['homeserver']}")
    print(f"   User ID: {creds['user_id'] or 'Not set'}")
    print(f"   Has Access Token: {'Yes' if creds['access_token'] else 'No'}")
    print()

    async with aiohttp.ClientSession() as session:
        # Test 1: Check if message proxy is available
        print("1️⃣ Testing Message Proxy Availability...")
        status, result = await test_api_endpoint(session, '/health')
        if status == 200:
            print("   ✅ Message proxy is available")
        else:
            print(f"   ❌ Message proxy unavailable: {result}")
            return

        # Test 2: Test login (if we have credentials)
        if creds['user_id'] and creds['access_token']:
            print("\n2️⃣ Testing Session Restoration...")
            status, result = await test_api_endpoint(session, '/restore_session', 'POST', {
                'homeserver_url': creds['homeserver'],
                'user_id': creds['user_id'],
                'access_token': creds['access_token'],
                'device_id': creds['device_id']
            })

            if status == 200 and result.get('success'):
                print("   ✅ Session restored successfully")
                user_info = result.get('user', {})
                print(f"   👤 User: {user_info.get('display_name', user_info.get('user_id', 'Unknown'))}")
            else:
                print(f"   ❌ Session restoration failed: {result.get('error', 'Unknown error')}")
                return
        elif creds.get('username') and creds.get('password'):
            print("\n2️⃣ Testing Login...")
            status, result = await test_api_endpoint(session, '/login', 'POST', {
                'homeserver': creds['homeserver'],
                'username': creds['username'],
                'password': creds['password']
            })

            if status == 200 and result.get('success'):
                print("   ✅ Login successful")
                user_info = result.get('user', {})
                print(f"   👤 User: {user_info.get('display_name', user_info.get('user_id', 'Unknown'))}")

                # Update credentials with login result
                creds['access_token'] = result.get('access_token')
                creds['device_id'] = result.get('device_id')
                creds['user_id'] = result.get('user_id')
            else:
                print(f"   ❌ Login failed: {result.get('error', 'Unknown error')}")
                return
        else:
            print("\n2️⃣ Skipping authentication test (no credentials available)")
            print("   ℹ️  To test with real credentials, add them to userdata/ directory")
            return

        # Test 3: Get rooms
        print("\n3️⃣ Testing Room List...")
        rooms = []  # Initialize rooms variable
        status, result = await test_api_endpoint(session, '/rooms')
        if status == 200 and result.get('success'):
            rooms = result.get('data', [])
            print(f"   ✅ Found {len(rooms)} rooms")

            # Show first few rooms
            for i, room in enumerate(rooms[:3]):
                room_name = room.get('name') or room.get('canonical_alias') or room.get('room_id', 'Unknown')
                member_count = room.get('member_count', 0)
                print(f"   📁 {room_name} ({member_count} members)")

            if len(rooms) > 3:
                print(f"   ... and {len(rooms) - 3} more rooms")
        else:
            print(f"   ❌ Failed to get rooms: {result.get('error', 'Unknown error')}")

        # Test 4: Get messages from first room
        if rooms:
            first_room = rooms[0]
            room_id = first_room['room_id']
            room_name = first_room.get('name') or first_room.get('canonical_alias') or room_id

            print(f"\n4️⃣ Testing Messages from '{room_name}'...")
            status, result = await test_api_endpoint(session, f'/rooms/{room_id}/messages')

            if status == 200 and result.get('success'):
                messages = result.get('data', {}).get('chunk', [])
                print(f"   ✅ Found {len(messages)} messages")

                # Show recent messages
                for msg in messages[-3:]:
                    sender = msg.get('sender', 'Unknown')
                    content = msg.get('body', msg.get('content', {}).get('body', 'No content'))
                    if len(content) > 50:
                        content = content[:47] + "..."
                    print(f"   💬 {sender}: {content}")
            else:
                print(f"   ❌ Failed to get messages: {result.get('error', 'Unknown error')}")
        else:
            print("\n4️⃣ Skipping message test (no rooms available)")

        # Test 5: Test sending a message (optional)
        print("\n5️⃣ Testing Message Sending...")
        if rooms and len(rooms) > 0:
            test_room = rooms[0]
            room_id = test_room['room_id']

            # Send a test message
            test_message = "🧪 Test message from Matrix client implementation"
            status, result = await test_api_endpoint(session, f'/rooms/{room_id}/send', 'POST', {
                'message': test_message,
                'msg_type': 'm.text'
            })

            if status == 200 and result.get('success'):
                print("   ✅ Test message sent successfully")
                print(f"   📤 Event ID: {result.get('event_id', 'Unknown')}")
            else:
                print(f"   ❌ Failed to send message: {result.get('error', 'Unknown error')}")
        else:
            print("   ⏭️  Skipping message sending (no rooms available)")

    print("\n" + "=" * 50)
    print("🎉 Matrix Client Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_matrix_client())