import type { Group, User } from "../types";

interface Props {
  user: User;

  groups: Group[];

  selectedGroupId: string | null;

  selectedPrivateUserId: string | null;

  privateUsers: User[];

  onGroupSelect: (group: Group) => void;

  onPrivateSelect: (user: User) => void;

  onCreateGroup: () => void;

  onReports: () => void;

  onLogout: () => void;
}

function Sidebar({
  user,
  groups,
  selectedGroupId,
  selectedPrivateUserId,
  privateUsers,
  onGroupSelect,
  onPrivateSelect,
  onCreateGroup,
  onReports,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      {/* ================= HEADER ================= */}
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">💬</div>

          <div className="brand-text">
            <strong>MentorChat</strong>
            <span>Learning Workspace</span>
          </div>
        </div>
      </div>

      {/* ================= PROFILE ================= */}
      <div className="profile-box">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>

        <div className="profile-info">
          <strong>{user.name}</strong>

          <span className="profile-role">{user.role}</span>
        </div>

        <div className="online-dot" />
      </div>

      {/* ================= INBOX ================= */}
      <div className="sidebar-section">
        <div className="section-heading">
          <span>YOUR INBOX</span>
        </div>

        <div className="conversation-label">CONVERSATIONS</div>

        {/* ================= GROUPS ================= */}
        <div className="sidebar-subsection">
          <div className="subsection-title">
            <span>GROUPS</span>

            {groups.length > 0 && (
              <span className="count-badge">{groups.length}</span>
            )}
          </div>

          {groups.length === 0 ? (
            <div className="empty-small">No groups yet</div>
          ) : (
            <div className="sidebar-list">
              {groups.map((group) => {
                const groupId = group._id || "";

                const isActive = selectedGroupId === groupId;

                return (
                  <button
                    key={groupId}
                    type="button"
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => onGroupSelect(group)}
                  >
                    <span className="item-icon group-icon">#</span>

                    <span className="item-text">{group.name}</span>

                    {isActive && <span className="active-indicator" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= PRIVATE CHAT ================= */}
        <div className="sidebar-subsection private-section">
          <div className="subsection-title">
            <span>PRIVATE CHAT</span>

            {privateUsers.length > 0 && (
              <span className="count-badge">{privateUsers.length}</span>
            )}
          </div>

          {privateUsers.length === 0 ? (
            <div className="empty-small">No available users</div>
          ) : (
            <div className="sidebar-list">
              {privateUsers.map((person) => {
                const personId = person._id || person.id || "";

                const isActive = selectedPrivateUserId === personId;

                return (
                  <button
                    key={personId}
                    type="button"
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => onPrivateSelect(person)}
                  >
                    <span
                      className={`private-avatar ${
                        person.role === "MENTOR"
                          ? "mentor-avatar"
                          : person.role === "ADMIN"
                            ? "admin-avatar"
                            : "mentee-avatar"
                      }`}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </span>

                    <span className="private-user-info">
                      <span className="item-text">{person.name}</span>

                      <small>{person.role}</small>
                    </span>

                    {isActive && <span className="active-indicator" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= ADMIN ACTIONS ================= */}
      {user.role === "ADMIN" && (
        <div className="admin-actions">
          <div className="admin-title">ADMIN TOOLS</div>

          <button
            type="button"
            className="sidebar-action"
            onClick={onCreateGroup}
          >
            <span className="action-icon">+</span>

            <span>Create Group</span>
          </button>

          <button type="button" className="sidebar-action" onClick={onReports}>
            <span className="action-icon">⚑</span>

            <span>Reports</span>
          </button>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <div className="logout-area">
        <div className="workspace-status">
          <span className="status-dot" />

          <span>Workspace connected</span>
        </div>

        <button type="button" className="logout-btn" onClick={onLogout}>
          <span>↪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
