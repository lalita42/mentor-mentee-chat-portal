import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import type { Group, User } from "../types/index";

import { getGroups, getUsers } from "../services/api";

import { disconnectSocket } from "../socket/socket";

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

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [selectedPrivateUser, setSelectedPrivateUser] = useState<User | null>(
    null,
  );

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [apiError, setApiError] = useState("");

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = useCallback(() => {
    console.log("========== LOGOUT ==========");

    // Disconnect socket
    try {
      disconnectSocket();
    } catch (error) {
      console.error("SOCKET DISCONNECT ERROR:", error);
    }

    // Remove login session
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    console.log("Token after logout:", localStorage.getItem("token"));

    console.log("User after logout:", localStorage.getItem("user"));

    // Tell App that authentication changed
    window.dispatchEvent(new Event("auth-change"));

    // Go to login
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

      const currentUserId = currentUser._id || currentUser.id || "";

      const personId = person._id || person.id || "";

      // -----------------------------------------------------
      // Invalid IDs
      // -----------------------------------------------------

      if (!currentUserId || !personId) {
        return false;
      }

      // -----------------------------------------------------
      // Cannot chat with yourself
      // -----------------------------------------------------

      if (currentUserId === personId) {
        return false;
      }

      // -----------------------------------------------------
      // ADMIN
      // -----------------------------------------------------

      if (currentUser.role === "ADMIN") {
        return true;
      }

      // -----------------------------------------------------
      // Only MENTOR <-> MENTEE
      // -----------------------------------------------------

      const validRolePair =
        (currentUser.role === "MENTOR" && person.role === "MENTEE") ||
        (currentUser.role === "MENTEE" && person.role === "MENTOR");

      if (!validRolePair) {
        return false;
      }

      // -----------------------------------------------------
      // SAME GROUP CHECK
      // -----------------------------------------------------

      const sameGroup = groupsList.some((group) => {
        const members = group.members || [];

        const currentUserInGroup = members.some((member: User) => {
          const memberId = member._id || member.id || "";

          return memberId === currentUserId;
        });

        const personInGroup = members.some((member: User) => {
          const memberId = member._id || member.id || "";

          return memberId === personId;
        });

        return currentUserInGroup && personInGroup;
      });

      return sameGroup;
    },
    [user, groups],
  );

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setApiError("");

      // ===================================================
      // GET CURRENT USER FROM STORAGE
      // ===================================================

      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        logout();
        return;
      }

      let currentUser: User;

      try {
        currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error("USER JSON ERROR:", error);

        logout();
        return;
      }

      // ===================================================
      // LOAD GROUPS
      // ===================================================

      let groupsArray: Group[] = [];

      try {
        console.log("Loading groups...");

        const groupsResponse = await getGroups();

        console.log("Groups response:", groupsResponse);

        if (Array.isArray(groupsResponse)) {
          groupsArray = groupsResponse;
        } else if (Array.isArray(groupsResponse?.groups)) {
          groupsArray = groupsResponse.groups;
        }

        console.log("Final groups:", groupsArray);

        setGroups(groupsArray);
      } catch (error: any) {
        console.error(
          "GROUPS ERROR:",
          error?.response?.data || error?.message || error,
        );

        setGroups([]);

        if (error?.response?.status === 401) {
          logout();
          return;
        }
      }

      // ===================================================
      // LOAD USERS
      // ===================================================

      try {
        console.log("Loading users...");

        const usersResponse = await getUsers();

        console.log("Users response:", usersResponse);

        let usersArray: User[] = [];

        if (Array.isArray(usersResponse)) {
          usersArray = usersResponse;
        } else if (Array.isArray(usersResponse?.users)) {
          usersArray = usersResponse.users;
        }

        // =================================================
        // CURRENT USER ID
        // =================================================

        const currentId = currentUser._id || currentUser.id || "";

        // =================================================
        // FILTER PRIVATE USERS
        //
        // Only SAME GROUP users
        // =================================================

        const filteredUsers = usersArray.filter((person: User) => {
          const personId = person._id || person.id || "";

          // -------------------------------------------
          // Don't show yourself
          // -------------------------------------------

          if (!personId || personId === currentId) {
            return false;
          }

          // -------------------------------------------
          // ADMIN
          // -------------------------------------------

          if (currentUser.role === "ADMIN") {
            return true;
          }

          // -------------------------------------------
          // Check valid role pair
          // -------------------------------------------

          const validRolePair =
            (currentUser.role === "MENTEE" && person.role === "MENTOR") ||
            (currentUser.role === "MENTOR" && person.role === "MENTEE");

          if (!validRolePair) {
            return false;
          }

          // -------------------------------------------
          // SAME GROUP
          // -------------------------------------------

          const sameGroup = groupsArray.some((group) => {
            const members = group.members || [];

            const currentUserInGroup = members.some((member: User) => {
              const memberId = member._id || member.id || "";

              return memberId === currentId;
            });

            const personInGroup = members.some((member: User) => {
              const memberId = member._id || member.id || "";

              return memberId === personId;
            });

            return currentUserInGroup && personInGroup;
          });

          return sameGroup;
        });

        console.log("ALLOWED PRIVATE USERS:", filteredUsers);

        setPrivateUsers(filteredUsers);
      } catch (error: any) {
        console.error(
          "USERS ERROR:",
          error?.response?.data || error?.message || error,
        );

        setPrivateUsers([]);

        if (error?.response?.status === 401) {
          logout();
          return;
        }
      }
    } catch (error: any) {
      console.error("DASHBOARD ERROR:", error);

      if (error?.response?.status === 401) {
        logout();
        return;
      }

      setApiError("Some dashboard data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  // =========================================================
  // INITIALIZE DASHBOARD
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    const savedUser = localStorage.getItem("user");

    console.log("========== DASHBOARD ==========");

    console.log("Token exists:", !!token);

    console.log("Saved user:", savedUser);

    // -------------------------------------------------------
    // NO LOGIN SESSION
    // -------------------------------------------------------

    if (!token || !savedUser) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    // -------------------------------------------------------
    // PARSE USER
    // -------------------------------------------------------

    try {
      const parsedUser: User = JSON.parse(savedUser);

      console.log("Dashboard user:", parsedUser);

      setUser(parsedUser);

      loadDashboard();
    } catch (error) {
      console.error("USER JSON ERROR:", error);

      logout();
    }
  }, [navigate, loadDashboard, logout]);

  // =========================================================
  // REFRESH
  // =========================================================

  const refreshDashboard = async () => {
    setRefreshing(true);

    await loadDashboard();
  };

  // =========================================================
  // GROUP SELECT
  // =========================================================

  const selectGroup = (group: Group) => {
    console.log("GROUP SELECTED:", group);

    setSelectedGroup(group);

    // Close private chat
    setSelectedPrivateUser(null);
  };

  // =========================================================
  // PRIVATE USER SELECT
  // =========================================================

  const selectPrivateUser = (person: User) => {
    console.log("PRIVATE USER SELECTED:", person);

    // Double-check permission
    if (!isPrivateChatAllowed(person)) {
      alert("You can only privately chat with a user from your group.");

      return;
    }

    // Open private chat
    setSelectedPrivateUser(person);

    // Close group chat
    setSelectedGroup(null);
  };

  // =========================================================
  // CHAT FROM GROUP ROSTER
  // =========================================================

  const handlePrivateSelect = (person: User) => {
    console.log("CHAT BUTTON CLICKED:", person);

    // Check same-group permission
    if (!isPrivateChatAllowed(person)) {
      alert("You can only privately chat with a user from your group.");

      return;
    }

    // Open selected private chat
    setSelectedPrivateUser(person);

    // Close current group
    setSelectedGroup(null);
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "45px",
              height: "45px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #2563eb",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />

          <h2>Loading Dashboard...</h2>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Please wait
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // USER NOT FOUND
  // =========================================================

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <h2>Session not found</h2>

          <p>Please login again.</p>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 20px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
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
    <div
      className="app-layout"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        user={user}
        groups={groups}
        selectedGroupId={selectedGroup?._id || null}
        selectedPrivateUserId={
          selectedPrivateUser
            ? selectedPrivateUser._id || selectedPrivateUser.id || null
            : null
        }
        privateUsers={privateUsers}
        onGroupSelect={selectGroup}
        onPrivateSelect={selectPrivateUser}
        onCreateGroup={() => setShowCreateGroup(true)}
        onReports={() => {
          console.log("Reports clicked");
        }}
        onLogout={logout}
      />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className="main-content"
        style={{
          position: "relative",
        }}
      >
        {/* ===================================================
            TOP BAR
        =================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <span
            style={{
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {user.role}
          </span>

          <button
            type="button"
            onClick={refreshDashboard}
            disabled={refreshing}
            style={{
              padding: "7px 13px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              borderRadius: "7px",
              cursor: "pointer",
            }}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* ===================================================
            API WARNING
        =================================================== */}

        {apiError && (
          <div
            style={{
              margin: "15px 20px",
              padding: "12px 15px",
              background: "#fff7ed",
              color: "#9a3412",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
            }}
          >
            {apiError}
          </div>
        )}

        {/* ===================================================
            GROUP CHAT
        =================================================== */}

        {selectedGroup && (
          <GroupChat
            key={selectedGroup._id}
            group={selectedGroup}
            currentUser={user}
            onPrivateSelect={handlePrivateSelect}
          />
        )}

        {/* ===================================================
            PRIVATE CHAT
        =================================================== */}

        {selectedPrivateUser && (
          <PrivateChat
            key={selectedPrivateUser._id || selectedPrivateUser.id}
            currentUser={user}
            otherUser={selectedPrivateUser}
            isAllowedMentorChat={isPrivateChatAllowed(selectedPrivateUser)}
          />
        )}

        {/* ===================================================
            WELCOME PAGE
        =================================================== */}

        {!selectedGroup && !selectedPrivateUser && (
          <div
            style={{
              minHeight: "calc(100vh - 70px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "30px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                maxWidth: "850px",
                width: "100%",
                textAlign: "center",
              }}
            >
              {/* ICON */}

              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "24px",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                  margin: "0 auto 20px",
                }}
              >
                💬
              </div>

              {/* TITLE */}

              <h1
                style={{
                  margin: "0 0 10px",
                  fontSize: "32px",
                  color: "#111827",
                }}
              >
                Welcome to MentorChat
              </h1>

              {/* USER */}

              <p
                style={{
                  fontSize: "18px",
                  color: "#374151",
                  margin: "0 0 8px",
                }}
              >
                Hello, <strong>{user.name}</strong> 👋
              </p>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: "30px",
                }}
              >
                Select a group or private chat to start messaging.
              </p>

              {/* FEATURES */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  textAlign: "left",
                }}
              >
                <FeatureCard
                  icon="👥"
                  title="Group Chat"
                  text="Connect with your batch"
                />

                <FeatureCard
                  icon="🔒"
                  title="Private Chat"
                  text="Talk privately with your group mentor or mentee"
                />

                <FeatureCard
                  icon="📎"
                  title="File Sharing"
                  text="Share images and PDF files"
                />

                <FeatureCard
                  icon="📢"
                  title="Announcements"
                  text="Stay updated with important news"
                />
              </div>

              {/* NO GROUPS */}

              {groups.length === 0 && (
                <div
                  style={{
                    marginTop: "25px",
                    padding: "15px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    color: "#6b7280",
                  }}
                >
                  No groups available yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =====================================================
          CREATE GROUP MODAL
      ===================================================== */}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={async () => {
            setShowCreateGroup(false);

            await loadDashboard();
          }}
        />
      )}
    </div>
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
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          marginBottom: "12px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: "0 0 7px",
          fontSize: "16px",
          color: "#111827",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "1.5",
          color: "#6b7280",
        }}
      >
        {text}
      </p>
    </div>
  );
}

export default Dashboard;
