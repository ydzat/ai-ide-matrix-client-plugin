/**
 * MemberList Component
 * Displays room members with online status, roles, and actions
 */

import { useState, useEffect, useRef } from '../../../ui/utils/react-hooks.js';
import { eventBus, MATRIX_EVENTS } from '../../utils/EventBus.js';
import { apiClient } from '../../utils/ApiClient.js';

export function MemberList({ roomId, isVisible, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const memberListRef = useRef(null);

  // Load members when room changes or component becomes visible
  useEffect(() => {
    if (roomId && isVisible) {
      loadMembers();
    }
  }, [roomId, isVisible]);

  // Listen for member updates
  useEffect(() => {
    const handleMemberUpdate = (data) => {
      if (data.roomId === roomId) {
        loadMembers();
      }
    };

    eventBus.on(MATRIX_EVENTS.ROOM_MEMBER_UPDATE, handleMemberUpdate);
    return () => eventBus.off(MATRIX_EVENTS.ROOM_MEMBER_UPDATE, handleMemberUpdate);
  }, [roomId]);

  const loadMembers = async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.getRoomMembers(roomId);
      if (response.success) {
        setMembers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.display_name?.toLowerCase().includes(query) ||
      member.user_id?.toLowerCase().includes(query)
    );
  });

  // Group members by status and role
  const groupedMembers = filteredMembers.reduce((groups, member) => {
    const powerLevel = member.power_level || 0;
    let category;
    
    if (powerLevel >= 100) {
      category = 'admins';
    } else if (powerLevel >= 50) {
      category = 'moderators';
    } else {
      category = 'members';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(member);
    return groups;
  }, {});

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowMemberProfile(true);
  };

  const handleStartDM = async (userId) => {
    try {
      const response = await apiClient.createDirectMessage(userId);
      if (response.success) {
        eventBus.emit(MATRIX_EVENTS.ROOM_SELECTED, { roomId: response.room_id });
        onClose?.();
      }
    } catch (error) {
      console.error('Failed to start DM:', error);
    }
  };

  const renderMemberGroup = (title, members, icon) => {
    if (!members || members.length === 0) return null;

    return (
      <div className="member-group">
        <div className="member-group-header">
          <span className="member-group-icon">{icon}</span>
          <span className="member-group-title">{title}</span>
          <span className="member-group-count">({members.length})</span>
        </div>
        <div className="member-group-list">
          {members.map(member => (
            <MemberItem
              key={member.user_id}
              member={member}
              onClick={() => handleMemberClick(member)}
              onStartDM={() => handleStartDM(member.user_id)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="member-list-container">
      <div className="member-list-header">
        <h3>Members</h3>
        <button 
          className="member-list-close"
          onClick={onClose}
          aria-label="Close member list"
        >
          ✕
        </button>
      </div>

      <div className="member-search">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="member-search-input"
        />
      </div>

      <div className="member-list-content" ref={memberListRef}>
        {loading ? (
          <div className="member-list-loading">
            <div className="loading-spinner"></div>
            <span>Loading members...</span>
          </div>
        ) : (
          <>
            {renderMemberGroup('Admins', groupedMembers.admins, '👑')}
            {renderMemberGroup('Moderators', groupedMembers.moderators, '🛡️')}
            {renderMemberGroup('Members', groupedMembers.members, '👤')}
            
            {filteredMembers.length === 0 && !loading && (
              <div className="member-list-empty">
                {searchQuery ? 'No members found' : 'No members to display'}
              </div>
            )}
          </>
        )}
      </div>

      {showMemberProfile && selectedMember && (
        <MemberProfile
          member={selectedMember}
          roomId={roomId}
          onClose={() => setShowMemberProfile(false)}
          onStartDM={() => handleStartDM(selectedMember.user_id)}
        />
      )}
    </div>
  );
}

function MemberItem({ member, onClick, onStartDM }) {
  const displayName = member.display_name || member.user_id;
  const isOnline = member.presence === 'online';
  const lastSeen = member.last_active_ago ? 
    new Date(Date.now() - member.last_active_ago).toLocaleString() : null;

  return (
    <div className="member-item" onClick={onClick}>
      <div className="member-avatar">
        {member.avatar_url ? (
          <img 
            src={member.avatar_url} 
            alt={displayName}
            className="member-avatar-img"
          />
        ) : (
          <div className="member-avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={`member-status ${isOnline ? 'online' : 'offline'}`}></div>
      </div>
      
      <div className="member-info">
        <div className="member-name">{displayName}</div>
        <div className="member-id">{member.user_id}</div>
        {lastSeen && !isOnline && (
          <div className="member-last-seen">Last seen: {lastSeen}</div>
        )}
      </div>

      <div className="member-actions">
        <button
          className="member-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onStartDM();
          }}
          title="Start direct message"
        >
          💬
        </button>
      </div>
    </div>
  );
}

function MemberProfile({ member, roomId, onClose, onStartDM }) {
  const displayName = member.display_name || member.user_id;
  const powerLevel = member.power_level || 0;
  
  const getRoleText = (level) => {
    if (level >= 100) return 'Admin';
    if (level >= 50) return 'Moderator';
    return 'Member';
  };

  return (
    <div className="member-profile-overlay" onClick={onClose}>
      <div className="member-profile" onClick={(e) => e.stopPropagation()}>
        <div className="member-profile-header">
          <button className="member-profile-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="member-profile-content">
          <div className="member-profile-avatar">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={displayName} />
            ) : (
              <div className="member-profile-avatar-placeholder">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="member-profile-info">
            <h3>{displayName}</h3>
            <p className="member-profile-id">{member.user_id}</p>
            <p className="member-profile-role">{getRoleText(powerLevel)}</p>
            
            {member.presence && (
              <p className="member-profile-status">
                Status: {member.presence}
              </p>
            )}
          </div>
          
          <div className="member-profile-actions">
            <button 
              className="btn btn-primary"
              onClick={onStartDM}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
