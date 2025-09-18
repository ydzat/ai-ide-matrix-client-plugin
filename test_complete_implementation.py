#!/usr/bin/env python3
"""
Complete Matrix Client Implementation Test
Tests all implemented features of the Matrix client
"""

import asyncio
import aiohttp
import json
import os
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/message-proxy/element"
USERDATA_FILE = Path(__file__).parent / "userdata"

async def load_test_credentials():
    """Load test credentials from userdata file"""
    try:
        if USERDATA_FILE.exists():
            with open(USERDATA_FILE, 'r') as f:
                lines = [line.strip() for line in f.readlines()]
                if len(lines) >= 3:
                    homeserver = lines[0]
                    username = lines[1]
                    password = lines[2]
                    
                    # Format user ID if needed
                    if not username.startswith('@'):
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

async def test_complete_matrix_client():
    """Test complete Matrix client implementation"""
    print("🧪 Complete Matrix Client Implementation Test")
    print("=" * 60)
    
    # Load test credentials
    creds = await load_test_credentials()
    print(f"📋 Test Configuration:")
    print(f"   Homeserver: {creds['homeserver']}")
    print(f"   User ID: {creds['user_id'] or 'Not set'}")
    print(f"   Has Credentials: {'Yes' if creds.get('username') and creds.get('password') else 'No'}")
    print()
    
    test_results = {
        'passed': 0,
        'failed': 0,
        'total': 0
    }
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Message Proxy Health Check
        print("1️⃣ Testing Message Proxy Health...")
        test_results['total'] += 1
        status, result = await test_api_endpoint(session, '/health')
        if status == 200:
            print("   ✅ Message proxy is healthy")
            test_results['passed'] += 1
        else:
            print(f"   ❌ Message proxy health check failed: {result}")
            test_results['failed'] += 1
            return test_results
        
        # Test 2: Authentication System
        if creds.get('username') and creds.get('password'):
            print("\n2️⃣ Testing Authentication System...")
            test_results['total'] += 1
            status, result = await test_api_endpoint(session, '/login', 'POST', {
                'homeserver': creds['homeserver'],
                'username': creds['username'],
                'password': creds['password']
            })
            
            if status == 200 and result.get('success'):
                print("   ✅ Login successful")
                print(f"   👤 User: {result.get('user_id', 'Unknown')}")
                creds['access_token'] = result.get('access_token')
                creds['device_id'] = result.get('device_id')
                creds['user_id'] = result.get('user_id')
                test_results['passed'] += 1
            else:
                print(f"   ❌ Login failed: {result.get('error', 'Unknown error')}")
                test_results['failed'] += 1
                return test_results
        else:
            print("\n2️⃣ Skipping authentication test (no credentials)")
            return test_results
        
        # Test 3: Room List and Navigation
        print("\n3️⃣ Testing Room List and Navigation...")
        test_results['total'] += 1
        rooms = []
        status, result = await test_api_endpoint(session, '/rooms')
        if status == 200:
            # Handle different response formats
            if isinstance(result, dict):
                if result.get('success'):
                    rooms = result.get('data', [])
                elif 'rooms' in result:
                    rooms = result['rooms']
                elif 'joined_rooms' in result:
                    rooms = result['joined_rooms']
                else:
                    # Direct room list
                    rooms = result if isinstance(result, list) else []
            elif isinstance(result, list):
                rooms = result

            print(f"   ✅ Retrieved {len(rooms)} rooms")

            if rooms:
                # Show room categories
                direct_rooms = [r for r in rooms if r.get('is_direct', False)]
                regular_rooms = [r for r in rooms if not r.get('is_direct', False) and not r.get('is_space', False)]
                spaces = [r for r in rooms if r.get('is_space', False)]

                print(f"   📁 Direct Messages: {len(direct_rooms)}")
                print(f"   🏠 Rooms: {len(regular_rooms)}")
                print(f"   🌐 Spaces: {len(spaces)}")

                # Show first few room names
                for i, room in enumerate(rooms[:3]):
                    name = room.get('name') or room.get('canonical_alias') or room.get('room_id', 'Unknown')
                    print(f"   🏠 {name}")

            test_results['passed'] += 1
        else:
            print(f"   ❌ Failed to get rooms: HTTP {status} - {result.get('error', 'Unknown error')}")
            test_results['failed'] += 1
        
        # Test 4: Chat Interface
        if rooms:
            print("\n4️⃣ Testing Chat Interface...")
            test_results['total'] += 1
            first_room = rooms[0]
            room_id = first_room['room_id']
            room_name = first_room.get('name') or first_room.get('canonical_alias') or room_id
            
            print(f"   Testing with room: {room_name}")
            
            # Get messages
            status, result = await test_api_endpoint(session, f'/rooms/{room_id}/messages')
            if status == 200:
                messages = []
                # Handle different response formats
                if isinstance(result, dict):
                    if result.get('success'):
                        messages = result.get('data', {}).get('chunk', [])
                    elif 'chunk' in result:
                        messages = result['chunk']
                    elif 'messages' in result:
                        messages = result['messages']

                print(f"   ✅ Retrieved {len(messages)} messages")

                # Show recent messages
                for msg in messages[-2:]:
                    sender = msg.get('sender', 'Unknown')
                    content = msg.get('body', msg.get('content', {}).get('body', 'No content'))
                    if len(content) > 40:
                        content = content[:37] + "..."
                    print(f"   💬 {sender}: {content}")

                test_results['passed'] += 1
            else:
                print(f"   ❌ Failed to get messages: HTTP {status} - {result.get('error', 'Unknown error')}")
                test_results['failed'] += 1
        else:
            print("\n4️⃣ Skipping chat interface test (no rooms)")
        
        # Test 5: Member List
        if rooms:
            print("\n5️⃣ Testing Member List...")
            test_results['total'] += 1
            room_id = rooms[0]['room_id']
            
            status, result = await test_api_endpoint(session, f'/rooms/{room_id}/members')
            if status == 200:
                members = []
                # Handle different response formats
                if isinstance(result, dict):
                    if result.get('success'):
                        members = result.get('data', [])
                    elif 'members' in result:
                        members = result['members']
                elif isinstance(result, list):
                    members = result

                print(f"   ✅ Retrieved {len(members)} members")

                # Categorize members (handle both dict and string formats)
                dict_members = [m for m in members if isinstance(m, dict)]
                admins = [m for m in dict_members if m.get('power_level', 0) >= 100]
                moderators = [m for m in dict_members if 50 <= m.get('power_level', 0) < 100]
                regular_members = [m for m in dict_members if m.get('power_level', 0) < 50]

                print(f"   👑 Admins: {len(admins)}")
                print(f"   🛡️  Moderators: {len(moderators)}")
                print(f"   👤 Members: {len(regular_members)}")
                test_results['passed'] += 1
            else:
                print(f"   ❌ Failed to get members: HTTP {status} - {result.get('error', 'Unknown error')}")
                test_results['failed'] += 1
        else:
            print("\n5️⃣ Skipping member list test (no rooms)")
        
        # Test 6: Message Sending
        if rooms:
            print("\n6️⃣ Testing Message Sending...")
            test_results['total'] += 1
            room_id = rooms[0]['room_id']
            
            test_message = "🧪 Matrix Client Implementation Test - All systems operational!"
            status, result = await test_api_endpoint(session, f'/rooms/{room_id}/send', 'POST', {
                'message': test_message,
                'msg_type': 'm.text'
            })
            
            if status == 200 and result.get('success'):
                print("   ✅ Test message sent successfully")
                print(f"   📤 Event ID: {result.get('event_id', 'Unknown')}")
                test_results['passed'] += 1
            else:
                print(f"   ❌ Failed to send message: {result.get('error', 'Unknown error')}")
                test_results['failed'] += 1
        else:
            print("\n6️⃣ Skipping message sending test (no rooms)")
        
        # Test 7: Typing Indicators
        if rooms:
            print("\n7️⃣ Testing Typing Indicators...")
            test_results['total'] += 1
            room_id = rooms[0]['room_id']
            
            # Start typing
            status, result = await test_api_endpoint(session, f'/rooms/{room_id}/typing', 'PUT', {
                'typing': True,
                'timeout': 5000
            })
            
            if status == 200:
                print("   ✅ Typing indicator sent")
                
                # Stop typing
                await test_api_endpoint(session, f'/rooms/{room_id}/typing', 'PUT', {
                    'typing': False,
                    'timeout': 0
                })
                print("   ✅ Typing indicator stopped")
                test_results['passed'] += 1
            else:
                print(f"   ❌ Failed to send typing indicator: {result.get('error', 'Unknown error')}")
                test_results['failed'] += 1
        else:
            print("\n7️⃣ Skipping typing indicators test (no rooms)")
        
        # Test 8: Logout
        print("\n8️⃣ Testing Logout...")
        test_results['total'] += 1
        status, result = await test_api_endpoint(session, '/logout', 'POST')
        if status == 200:
            print("   ✅ Logout successful")
            test_results['passed'] += 1
        else:
            print(f"   ❌ Logout failed: {result.get('error', 'Unknown error')}")
            test_results['failed'] += 1
    
    # Final Results
    print("\n" + "=" * 60)
    print("🎉 Complete Matrix Client Implementation Test Results")
    print(f"✅ Passed: {test_results['passed']}/{test_results['total']}")
    print(f"❌ Failed: {test_results['failed']}/{test_results['total']}")
    
    if test_results['failed'] == 0:
        print("🎊 All tests passed! Matrix client implementation is working correctly.")
    else:
        print(f"⚠️  {test_results['failed']} test(s) failed. Please check the implementation.")
    
    return test_results

if __name__ == "__main__":
    asyncio.run(test_complete_matrix_client())
