import { useEffect, useMemo, useState } from "react";

import type { Group, User } from "../types";

import { createGroup, getUsers, updateGroup } from "../services/api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  group?: Group | null;
}

function CreateGroupModal({ onClose, onCreated, group = null }: Props) {
  const [groupName, setGroupName] = useState(group?.name || "");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const isEditMode = Boolean(group);

  const [saving, setSaving] = useState(false);
  
  const [error, setError] = useState("");

  // ============================================
  // LOAD ALL USERS
  // ============================================
  useEffect(() => {
    loadAllUsers();
  }, []);

  // Select existing group members when editing a group.
  useEffect(() => {
    if (!group?.members) {
      setSelectedUsers([]);
      return;
    }

    const memberIds = group.members
      .map((member: any) => {
        if (typeof member === "string") {
          return member;
        }

        return member?._id || member?.id || "";
      })
      .filter(Boolean);

    setSelectedUsers(memberIds);
  }, [group]);

  async function loadAllUsers() {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await getUsers();

      let allUsers: User[] = [];

      if (Array.isArray(response)) {
        allUsers = response;
      } else if (response && Array.isArray(response.users)) {
        allUsers = response.users;
      } else if (response && Array.isArray(response.data)) {
        allUsers = response.data;
      }

      const mentorMenteeUsers = allUsers.filter(
        (user) => user.role === "MENTOR" || user.role === "MENTEE",
      );

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

      setUsers(uniqueUsers);

      if (uniqueUsers.length === 0) {
        setError("No Mentor or Mentee users found.");
      }
    } catch (err: any) {
      console.error("LOAD USERS ERROR:", err);

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

  function getUserId(user: User): string {
    return user._id || user.id || "";
  }

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

  function selectAll() {
    const ids = filteredUsers.map(getUserId).filter(Boolean);

    setSelectedUsers((previous) => {
      return Array.from(new Set([...previous, ...ids]));
    });
  }

  function clearSelection() {
    setSelectedUsers([]);
  }

  async function handleSaveGroup() {
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
      setSaving(true);
      setError("");

      if (isEditMode && group) {
        const groupId = group._id;

        if (!groupId) {
          alert("Invalid group ID.");
          return;
        }

        await updateGroup(groupId, {
          name,
          memberIds: selectedUsers,
        });

        alert("Group updated successfully!");
      } else {
        await createGroup(name, selectedUsers);

        alert("Group created successfully!");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      console.error(
        isEditMode ? "UPDATE GROUP ERROR:" : "CREATE GROUP ERROR:",
        err,
      );

      const message = err?.response?.data?.message;

      if (Array.isArray(message)) {
        alert(message.join(", "));
      } else {
        alert(
          message ||
            (isEditMode
              ? "Could not update group."
              : "Could not create group."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>{isEditMode ? "Edit Group" : "Create New Group"}</h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#666",
                fontSize: "13px",
              }}
            >
              {isEditMode
                ? "Update group name and members"
                : "Select mentors and mentees"}
            </p>
          </div>

          <button type="button" onClick={onClose} disabled={saving}>
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
          disabled={saving}
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
          disabled={loadingUsers || saving}
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
          <strong>Mentors & Mentees</strong>

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
            <button type="button" onClick={selectAll} disabled={saving}>
              Select All
            </button>

            <button
              type="button"
              onClick={clearSelection}
              disabled={saving || selectedUsers.length === 0}
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
            <div className="empty-small">Loading mentors and mentees...</div>
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
                disabled={saving}
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
                    disabled={saving}
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
            disabled={saving}
            style={{
              flex: 1,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={handleSaveGroup}
            disabled={
              saving ||
              loadingUsers ||
              !groupName.trim() ||
              selectedUsers.length === 0
            }
            style={{
              flex: 1,
            }}
          >
            {saving
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
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
