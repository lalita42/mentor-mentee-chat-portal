import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import type { Group, User } from "../types/index";

import { getGroups, getUsers } from "../services/api";

import {
  connectSocket,
  disconnectSocket,
  socket,
} from "../socket/socket";

import Sidebar from "../components/Sidebar";
import GroupChat from "../components/GroupChat";
import PrivateChat from "../components/PrivateChat";
import CreateGroupModal from "../components/CreateGroupModal";

function Dashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [user, setUser] = useState<User | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);

  const [privateUsers, setPrivateUsers] = useState<User[]>([]);

  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] =
    useState<Group | null>(null);

  const [selectedPrivateUser, setSelectedPrivateUser] =
    useState<User | null>(null);

  const [showCreateGroup, setShowCreateGroup] =
    useState(false);

  const [showEditGroup, setShowEditGroup] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [apiError, setApiError] = useState("");

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = useCallback(() => {
    console.log("========== LOGOUT ==========");

    try {
      disconnectSocket();
    } catch (error) {
      console.error(
        "SOCKET DISCONNECT ERROR:",
        error,
      );
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setOnlineUserIds([]);

    window.dispatchEvent(
      new Event("auth-change"),
    );

    navigate("/login", {
      replace: true,
    });
  }, [navigate]);

  // =========================================================
  // CHECK PRIVATE CHAT PERMISSION
  // =========================================================

  const isPrivateChatAllowed = useCallback(
    (
      person: User,
      groupsList: Group[] = groups,
      currentUser: User | null = user,
    ) => {
      if (!currentUser) {
        return false;
      }

      const currentUserId = String(
        currentUser._id ||
          currentUser.id ||
          "",
      );

      const personId = String(
        person._id ||
          person.id ||
          "",
      );

      // Invalid IDs
      if (!currentUserId || !personId) {
        return false;
      }

      // Cannot chat with yourself
      if (currentUserId === personId) {
        return false;
      }

      // ADMIN can chat with other users
      if (currentUser.role === "ADMIN") {
        return true;
      }

      // Only MENTOR <-> MENTEE
      const validRolePair =
        (currentUser.role === "MENTOR" &&
          person.role === "MENTEE") ||
        (currentUser.role === "MENTEE" &&
          person.role === "MENTOR");

      if (!validRolePair) {
        return false;
      }

      // Same group check
      return groupsList.some((group) => {
        const members = group.members || [];

        const currentUserInGroup =
          members.some((member: User) => {
            const memberId = String(
              member._id ||
                member.id ||
                "",
            );

            return (
              memberId === currentUserId
            );
          });

        const personInGroup =
          members.some((member: User) => {
            const memberId = String(
              member._id ||
                member.id ||
                "",
            );

            return memberId === personId;
          });

        return (
          currentUserInGroup &&
          personInGroup
        );
      });
    },
    [user, groups],
  );

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setApiError("");

      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        logout();
        return;
      }

      let currentUser: User;

      try {
        currentUser =
          JSON.parse(savedUser);
      } catch (error) {
        console.error(
          "USER JSON ERROR:",
          error,
        );

        logout();
        return;
      }

      // =====================================================
      // LOAD GROUPS
      // =====================================================

      let groupsArray: Group[] = [];

      try {
        const groupsResponse =
          await getGroups();

        if (Array.isArray(groupsResponse)) {
          groupsArray = groupsResponse;
        } else if (
          Array.isArray(
            groupsResponse?.groups,
          )
        ) {
          groupsArray =
            groupsResponse.groups;
        }

        setGroups(groupsArray);

        console.log(
          "GROUPS:",
          groupsArray,
        );
      } catch (error: any) {
        console.error(
          "GROUPS ERROR:",
          error?.response?.data ||
            error?.message ||
            error,
        );

        setGroups([]);

        if (
          error?.response?.status === 401
        ) {
          logout();
          return;
        }

        setApiError(
          "Unable to load groups.",
        );
      }

      // =====================================================
      // LOAD USERS
      // =====================================================

      try {
        const usersResponse =
          await getUsers();

        let usersArray: User[] = [];

        if (Array.isArray(usersResponse)) {
          usersArray = usersResponse;
        } else if (
          Array.isArray(
            usersResponse?.users,
          )
        ) {
          usersArray =
            usersResponse.users;
        }

        const currentId = String(
          currentUser._id ||
            currentUser.id ||
            "",
        );

        // ===================================================
        // FILTER PRIVATE USERS
        // ===================================================

        const filteredUsers =
          usersArray.filter(
            (person: User) => {
              const personId = String(
                person._id ||
                  person.id ||
                  "",
              );

              // Don't show yourself
              if (
                !personId ||
                personId === currentId
              ) {
                return false;
              }

              // ADMIN
              if (
                currentUser.role ===
                "ADMIN"
              ) {
                return true;
              }

              // Only Mentor <-> Mentee
              const validRolePair =
                (currentUser.role ===
                  "MENTEE" &&
                  person.role ===
                    "MENTOR") ||
                (currentUser.role ===
                  "MENTOR" &&
                  person.role ===
                    "MENTEE");

              if (!validRolePair) {
                return false;
              }

              // Same group
              return groupsArray.some(
                (group) => {
                  const members =
                    group.members || [];

                  const currentUserInGroup =
                    members.some(
                      (member: User) => {
                        const memberId =
                          String(
                            member._id ||
                              member.id ||
                              "",
                          );

                        return (
                          memberId ===
                          currentId
                        );
                      },
                    );

                  const personInGroup =
                    members.some(
                      (member: User) => {
                        const memberId =
                          String(
                            member._id ||
                              member.id ||
                              "",
                          );

                        return (
                          memberId ===
                          personId
                        );
                      },
                    );

                  return (
                    currentUserInGroup &&
                    personInGroup
                  );
                },
              );
            },
          );

        setPrivateUsers(
          filteredUsers,
        );

        console.log(
          "PRIVATE USERS:",
          filteredUsers,
        );
      } catch (error: any) {
        console.error(
          "USERS ERROR:",
          error?.response?.data ||
            error?.message ||
            error,
        );

        setPrivateUsers([]);

        if (
          error?.response?.status === 401
        ) {
          logout();
          return;
        }

        setApiError(
          "Unable to load private chat users.",
        );
      }
    } catch (error: any) {
      console.error(
        "DASHBOARD ERROR:",
        error,
      );

      if (
        error?.response?.status === 401
      ) {
        logout();
        return;
      }

      setApiError(
        "Some dashboard data could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  // =========================================================
  // SOCKET CONNECTION
  // =========================================================

  useEffect(() => {
    console.log(
      "========== DASHBOARD SOCKET ==========",
    );

    connectSocket();

    return () => {
      // Don't disconnect here.
      // Logout handles socket disconnect.
    };
  }, []);

  // =========================================================
  // REAL-TIME PRESENCE
  // =========================================================

  useEffect(() => {
    const handlePresenceUpdate = (
      ids: string[],
    ) => {
      const normalizedIds =
        Array.isArray(ids)
          ? ids.map(String)
          : [];

      console.log(
        "DASHBOARD PRESENCE:",
        normalizedIds,
      );

      setOnlineUserIds(
        normalizedIds,
      );
    };

    const requestPresence = () => {
      if (!socket.connected) {
        return;
      }

      console.log(
        "REQUESTING CURRENT PRESENCE",
      );

      socket.emit("presence:get");
    };

    // IMPORTANT:
    // Register listener first
    socket.on(
      "presence:update",
      handlePresenceUpdate,
    );

    // Request presence whenever socket connects
    socket.on(
      "connect",
      requestPresence,
    );

    // If already connected
    if (socket.connected) {
      requestPresence();
    }

    return () => {
      socket.off(
        "presence:update",
        handlePresenceUpdate,
      );

      socket.off(
        "connect",
        requestPresence,
      );
    };
  }, []);

  // =========================================================
  // INITIAL DASHBOARD LOAD
  // =========================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const savedUser =
      localStorage.getItem("user");

    if (!token || !savedUser) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      const parsedUser: User =
        JSON.parse(savedUser);

      setUser(parsedUser);

      loadDashboard();
    } catch (error) {
      console.error(
        "USER JSON ERROR:",
        error,
      );

      logout();
    }
  }, [
    navigate,
    loadDashboard,
    logout,
  ]);

  // =========================================================
  // REFRESH
  // =========================================================

  const refreshDashboard = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    await loadDashboard();
  };

  // =========================================================
  // GROUP SELECT
  // =========================================================

  const selectGroup = (
    group: Group,
  ) => {
    setSelectedGroup(group);
    setSelectedPrivateUser(null);
  };

  // =========================================================
  // PRIVATE USER SELECT
  // =========================================================

  const selectPrivateUser = (
    person: User,
  ) => {
    if (
      !isPrivateChatAllowed(person)
    ) {
      alert(
        "You can only privately chat with an allowed user from your group.",
      );

      return;
    }

    setSelectedPrivateUser(person);
    setSelectedGroup(null);
  };

  // =========================================================
  // PRIVATE CHAT FROM GROUP
  // =========================================================

  const handlePrivateSelect = (
    person: User,
  ) => {
    if (
      !isPrivateChatAllowed(person)
    ) {
      alert(
        "You can only privately chat with an allowed user from your group.",
      );

      return;
    }

    setSelectedPrivateUser(person);
    setSelectedGroup(null);
  };

  // =========================================================
  // LOADING
  // =========================================================

if (loading) {
  return (
    <div className="dashboard-loader">
      <div className="loader-content">

        {/* Logo */}
        <div className="loader-logo">
          <div className="loader-logo-inner">
            💬
          </div>
        </div>

        {/* Brand */}
        <div className="loader-brand">
          MentorChat
        </div>

        <div className="loader-subtitle">
          Mentorship Hub
        </div>

        {/* Loading text */}
        <div className="loader-status">
          <span>Preparing your workspace</span>

          <span className="loader-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>

        {/* Progress line */}
        <div className="loader-progress">
          <div className="loader-progress-bar" />
        </div>

        <div className="loader-hint">
          Loading groups and conversations
        </div>

      </div>
    </div>
  );
}
  // =========================================================
  // USER NOT FOUND
  // =========================================================

  if (!user) {
    return (
      <div className="dashboard-session-screen">
        <div className="dashboard-session-card">
          <div className="dashboard-session-icon">
            🔐
          </div>

          <h2>
            Session not found
          </h2>

          <p>
            Your login session could not
            be found. Please login again.
          </p>

          <button
            type="button"
            onClick={logout}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div className="app-layout">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        user={user}
        groups={groups}
        selectedGroupId={
          selectedGroup?._id || null
        }
        selectedPrivateUserId={
          selectedPrivateUser
            ? selectedPrivateUser._id ||
              selectedPrivateUser.id ||
              null
            : null
        }
        privateUsers={privateUsers}
        onlineUserIds={onlineUserIds}
        onGroupSelect={selectGroup}
        onPrivateSelect={
          selectPrivateUser
        }
        onCreateGroup={() =>
          setShowCreateGroup(true)
        }
        onEditGroup={(group) => {
          setSelectedGroup(group);
          setShowEditGroup(true);
        }}
        onReports={() =>
          navigate("/reports")
        }
        onLogout={logout}
      />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">
        {/* TOP BAR */}

        <header className="dashboard-topbar">
          <div className="topbar-left">
            <div className="topbar-brand-dot" />

            <span className="topbar-brand">
              MentorChat
            </span>
          </div>

          <div className="topbar-right">
            <div className="topbar-user-info">
              <span className="topbar-role">
                {user.role}
              </span>

              <span className="topbar-divider" />

              <span className="topbar-user-name">
                {user.name}
              </span>
            </div>

            <button
              type="button"
              className="dashboard-refresh-button"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              <span
                className={
                  refreshing
                    ? "refresh-symbol spinning"
                    : "refresh-symbol"
                }
              >
                ↻
              </span>

              <span>
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </span>
            </button>
          </div>
        </header>

        {/* ERROR */}

        {apiError && (
          <div className="dashboard-api-error">
            <div className="api-error-left">
              <span className="api-error-icon">
                !
              </span>

              <span>
                {apiError}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setApiError("")
              }
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* ===================================================
            GROUP CHAT
        =================================================== */}

        {selectedGroup && (
          <GroupChat
            key={selectedGroup._id}
            currentUser={user}
            group={selectedGroup}
            onPrivateSelect={handlePrivateSelect}
          />
        )}

        {/* ===================================================
            PRIVATE CHAT
        =================================================== */}

        {selectedPrivateUser && (
          <PrivateChat
            key={
              selectedPrivateUser._id ||
              selectedPrivateUser.id
            }
            currentUser={user}
            otherUser={
              selectedPrivateUser
            }
            isAllowedMentorChat={
              isPrivateChatAllowed(
                selectedPrivateUser,
              )
            }
            isOtherUserOnline={onlineUserIds.includes(
              String(
                selectedPrivateUser._id ||
                  selectedPrivateUser.id ||
                  "",
              ),
            )}
          />
        )}

        {/* ===================================================
            WELCOME PAGE
        =================================================== */}

        {!selectedGroup &&
          !selectedPrivateUser && (
            <WelcomeSection
              user={user}
              groups={groups}
              privateUsers={privateUsers}
            />
          )}
      </main>

      {/* =====================================================
          CREATE GROUP
      ===================================================== */}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() =>
            setShowCreateGroup(false)
          }
          onCreated={async () => {
            setShowCreateGroup(false);
            await loadDashboard();
          }}
        />
      )}

      {/* =====================================================
          EDIT GROUP
      ===================================================== */}

      {showEditGroup &&
        selectedGroup && (
          <CreateGroupModal
            group={selectedGroup}
            onClose={() =>
              setShowEditGroup(false)
            }
            onCreated={async () => {
              setShowEditGroup(false);
              setSelectedGroup(null);
              await loadDashboard();
            }}
          />
        )}
    </div>
  );
}

// =============================================================
// WELCOME SECTION
// =============================================================

function WelcomeSection({
  user,
  groups,
  privateUsers,
}: {
  user: User;
  groups: Group[];
  privateUsers: User[];
}) {
  return (
    <section className="welcome-section">
      <div className="welcome-container">

        {/* HERO */}

        <div className="welcome-hero">
          <div className="welcome-icon">
            💬
          </div>

          <div className="welcome-eyebrow">
            MENTORCHAT WORKSPACE
          </div>

          <h1>
            Welcome to{" "}
            <span>MentorChat</span>
          </h1>

          <p className="welcome-greeting">
            Hello,{" "}
            <strong>{user.name}</strong>{" "}
            👋
          </p>

          <p className="welcome-description">
            Select a group or private
            conversation from the sidebar
            to start chatting.
          </p>
        </div>

        {/* FEATURE CARDS */}

        <div className="welcome-features">
          <FeatureCard
            icon="👥"
            title="Group Chat"
            text="Connect and communicate with your batch members."
          />

          <FeatureCard
            icon="🔒"
            title="Private Chat"
            text="Have private conversations with allowed mentors or mentees."
          />

          <FeatureCard
            icon="📎"
            title="File Sharing"
            text="Share useful files, documents and learning resources."
          />

          <FeatureCard
            icon="📢"
            title="Announcements"
            text="Stay updated with important group announcements."
          />
        </div>

        {/* STATUS */}

        <div className="welcome-bottom">
          <div className="welcome-status">
            <span className="status-green-dot" />

            <span>
              {groups.length > 0
                ? `${groups.length} ${
                    groups.length === 1
                      ? "group"
                      : "groups"
                  } available`
                : "No groups available yet"}
            </span>
          </div>

          <div className="welcome-status">
            <span className="status-blue-dot" />

            <span>
              {privateUsers.length > 0
                ? `${privateUsers.length} private ${
                    privateUsers.length === 1
                      ? "contact"
                      : "contacts"
                  }`
                : "No private contacts"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// FEATURE CARD
// =============================================================

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="welcome-feature-card">
      <div className="feature-icon">
        {icon}
      </div>

      <div className="feature-card-content">
        <h3>{title}</h3>

        <p>{text}</p>
      </div>
    </div>
  );
}

export default Dashboard;