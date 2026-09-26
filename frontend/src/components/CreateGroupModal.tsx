import { useEffect, useMemo, useState } from "react";

import type { User } from "../types";

import { createGroup, getUsers } from "../services/api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function CreateGroupModal({ onClose, onCreated }: Props) {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  // ============================================
  // LOAD ALL USERS
  // ============================================
  useEffect(() => {
    loadAllUsers();
  }, []);

  async function loadAllUsers() {
    try {
      setLoadingUsers(true);
      setError("");

      console.log("========== CREATE GROUP ==========");

      console.log("Loading ALL users...");

      // IMPORTANT:
      // Do NOT pass role here.
      // This gets all registered users.
      const response = await getUsers();

      console.log("ALL USERS API RESPONSE:", response);

      // ==========================================
      // Handle all possible response formats
      // ==========================================

      let allUsers: User[] = [];

      if (Array.isArray(response)) {
        allUsers = response;
      } else if (response && Array.isArray(response.users)) {
        allUsers = response.users;
      } else if (response && Array.isArray(response.data)) {
        allUsers = response.data;
      }

      console.log("ALL USERS FROM API:", allUsers);

      // ==========================================
      // ONLY MENTOR + MENTEE
      // ADMIN SHOULD NOT BE GROUP MEMBER
      // ==========================================

      const mentorMenteeUsers = allUsers.filter(
        (user) => user.role === "MENTOR" || user.role === "MENTEE",
      );

      // ==========================================
      // REMOVE DUPLICATES
      // ==========================================

      const uniqueUsers = Array.from(
        new Map(
          mentorMenteeUsers
            .map((user) => {
              const id = user._id || user.id || "";

              return [id, user] as const;
            })
            .filter(([id]) => Boolean(id)),
        ).values(),
      );

      console.log("MENTOR + MENTEE USERS:", uniqueUsers);

      console.log("TOTAL USERS:", uniqueUsers.length);

      setUsers(uniqueUsers);

      if (uniqueUsers.length === 0) {
        setError("No Mentor or Mentee users found.");
      }
    } catch (err: any) {
      console.error("LOAD ALL USERS ERROR:", err);

      console.error("STATUS:", err?.response?.status);

      console.error("SERVER RESPONSE:", err?.response?.data);

      setUsers([]);

      const message = err?.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message.join(", "));
      } else {
        setError(
          message || "Unable to load users. Make sure backend is running.",
        );
      }
    } finally {
      setLoadingUsers(false);
    }
  }

  // ============================================
  // GET USER ID
  // ============================================

  function getUserId(user: User): string {
    return user._id || user.id || "";
  }

  // ============================================
  // SELECT USER
  // ============================================

  function toggleUser(userId: string) {
    if (!userId) {
      return;
    }

    setSelectedUsers((previous) => {
      if (previous.includes(userId)) {
        return previous.filter((id) => id !== userId);
      }

      return [...previous, userId];
    });
  }

  // ============================================
  // SEARCH
  // ============================================

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return users;
    }

    return users.filter((user) => {
      const name = user.name?.toLowerCase() || "";

      const email = user.email?.toLowerCase() || "";

      const role = user.role?.toLowerCase() || "";

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        role.includes(searchValue)
      );
    });
  }, [users, search]);

  // ============================================
  // SELECT ALL
  // ============================================

  function selectAll() {
    const ids = filteredUsers.map(getUserId).filter(Boolean);

    setSelectedUsers((previous) => {
      return Array.from(new Set([...previous, ...ids]));
    });
  }

  // ============================================
  // CLEAR ALL
  // ============================================

  function clearSelection() {
    setSelectedUsers([]);
  }

  // ============================================
  // CREATE GROUP
  // ============================================

  async function handleCreateGroup() {
    const name = groupName.trim();

    if (!name) {
      alert("Please enter group name.");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Please select at least one Mentor or Mentee.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      console.log("========== CREATE GROUP ==========");

      console.log("GROUP NAME:", name);

      console.log("SELECTED MEMBERS:", selectedUsers);

      await createGroup(name, selectedUsers);

      alert("Group created successfully!");

      onCreated();
      onClose();
    } catch (err: any) {
      console.error("CREATE GROUP ERROR:", err);

      console.error("SERVER RESPONSE:", err?.response?.data);

      const message = err?.response?.data?.message;

      if (Array.isArray(message)) {
        alert(message.join(", "));
      } else {
        alert(message || "Could not create group.");
      }
    } finally {
      setCreating(false);
    }
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>Create New Group</h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#666",
                fontSize: "13px",
              }}
            >
              Select mentors and mentees
            </p>
          </div>

          <button type="button" onClick={onClose} disabled={creating}>
            ✕
          </button>
        </div>

        {/* GROUP NAME */}

        <label>Group Name</label>

        <input
          type="text"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="e.g. MERN Batch 2026"
          disabled={creating}
        />

        {/* SEARCH */}

        <label
          style={{
            display: "block",
            marginTop: "15px",
          }}
        >
          Search Users
        </label>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email or role..."
          disabled={loadingUsers || creating}
        />

        {/* USER HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "15px",
            marginBottom: "8px",
          }}
        >
          <strong>All Mentors & Mentees</strong>

          <span
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            {selectedUsers.length} selected
          </span>
        </div>

        {/* ACTION BUTTONS */}

        {!loadingUsers && users.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <button type="button" onClick={selectAll} disabled={creating}>
              Select All
            </button>

            <button
              type="button"
              onClick={clearSelection}
              disabled={creating || selectedUsers.length === 0}
            >
              Clear
            </button>

            <span
              style={{
                marginLeft: "auto",
                fontSize: "12px",
                color: "#777",
                alignSelf: "center",
              }}
            >
              Total: {users.length}
            </span>
          </div>
        )}

        {/* USERS */}

        <div
          className="user-selector"
          style={{
            maxHeight: "350px",
            overflowY: "auto",
          }}
        >
          {/* LOADING */}

          {loadingUsers && (
            <div className="empty-small">
              Loading all mentors and mentees...
            </div>
          )}

          {/* ERROR */}

          {!loadingUsers && error && (
            <div
              className="empty-small"
              style={{
                color: "#d32f2f",
                textAlign: "center",
              }}
            >
              <div>{error}</div>

              <button
                type="button"
                onClick={loadAllUsers}
                style={{
                  marginTop: "10px",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* NO SEARCH RESULT */}

          {!loadingUsers && !error && filteredUsers.length === 0 && (
            <div className="empty-small">No users found for "{search}"</div>
          )}

          {/* USER LIST */}

          {!loadingUsers &&
            !error &&
            filteredUsers.map((user) => {
              const id = getUserId(user);

              if (!id) {
                return null;
              }

              const selected = selectedUsers.includes(id);

              const isMentor = user.role === "MENTOR";

              return (
                <label
                  key={id}
                  className="select-user"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    marginBottom: "6px",
                    border: selected ? "2px solid #4f46e5" : "1px solid #ddd",
                    borderRadius: "8px",
                    background: selected ? "#f5f3ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  {/* CHECKBOX */}

                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleUser(id)}
                    disabled={creating}
                  />

                  {/* ICON */}

                  <span
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      background: isMentor ? "#e0f2fe" : "#dcfce7",
                    }}
                  >
                    {isMentor ? "👨‍🏫" : "👨‍🎓"}
                  </span>

                  {/* NAME + EMAIL */}

                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                      }}
                    >
                      {user.name || "Unknown User"}
                    </strong>

                    <small
                      style={{
                        display: "block",
                        color: "#777",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.email}
                    </small>
                  </span>

                  {/* ROLE */}

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "12px",
                      background: isMentor ? "#e0f2fe" : "#dcfce7",
                      color: isMentor ? "#0369a1" : "#15803d",
                    }}
                  >
                    {user.role}
                  </span>
                </label>
              );
            })}
        </div>

        {/* SELECTED INFO */}

        {selectedUsers.length > 0 && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px 10px",
              background: "#f3f4f6",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <strong>{selectedUsers.length}</strong> member
            {selectedUsers.length !== 1 ? "s" : ""} selected.
          </div>
        )}

        {/* FOOTER */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            style={{
              flex: 1,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={handleCreateGroup}
            disabled={
              creating ||
              loadingUsers ||
              !groupName.trim() ||
              selectedUsers.length === 0
            }
            style={{
              flex: 1,
            }}
          >
            {creating
              ? "Creating..."
              : `Create Group${
                  selectedUsers.length ? ` (${selectedUsers.length})` : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;
