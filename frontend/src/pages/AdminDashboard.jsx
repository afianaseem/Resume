import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  adminData,
  adminDeleteResume,
  adminDeleteUser,
  adminSetUserStatus,
} from "../api/resumes";
import { TEMPLATE_COLORS, TEMPLATES } from "../templates";
import { useDialog } from "../context/DialogContext";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTemplateName(id) {
  return (
    TEMPLATES.find((template) => template.id === id)?.name ||
    id ||
    "Classic"
  );
}

function getTemplateColor(id) {
  return (
    TEMPLATE_COLORS.find((color) => color.id === id) ||
    TEMPLATE_COLORS[0]
  );
}

function StatCard({ icon, label, value, description }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>

      <div className="admin-stat-content">
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function ResumeAdminCard({ resume, onDelete }) {
  const templateColor = getTemplateColor(resume.color);

  return (
    <article className="admin-resume-card">
      <div className="admin-resume-card-top">
        <div className="admin-resume-document-icon">
          <span>R</span>
        </div>

        <div className="admin-resume-card-actions-top">
          <span
            className="admin-template-color"
            style={{
              backgroundColor: templateColor.value,
            }}
            title={templateColor.name}
          />

          <span className="admin-template-label">
            {getTemplateName(resume.template)}
          </span>
        </div>
      </div>

      <div className="admin-resume-card-body">
        <h3 title={resume.name}>
          {resume.name || "Untitled resume"}
        </h3>

        <div className="admin-owner">
          <div className="admin-owner-avatar">
            {(resume.owner_name || "U")
              .trim()
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="admin-owner-info">
            <strong>{resume.owner_name || "Unknown user"}</strong>
            <span>{resume.owner_email || "No email"}</span>
          </div>
        </div>
      </div>

      <div className="admin-resume-meta">
        <div>
          <span>Updated</span>
          <strong>{formatDate(resume.updated_at)}</strong>
        </div>

        <div>
          <span>Color</span>
          <strong>{templateColor.name}</strong>
        </div>
      </div>

      <div className="admin-card-actions">
        <Link
          className="admin-card-view-button"
          to={`/admin/resumes/${resume.id}`}
        >
          <span>◎</span>
          View resume
        </Link>

        <button
          type="button"
          className="admin-card-delete-button"
          onClick={() => onDelete(resume)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function UserAdminCard({ user, onDelete, onReactivate }) {
  const initial = (user.name || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <article className="admin-user-card">
      <div className="admin-user-card-header">
        <div className="admin-user-avatar">{initial}</div>

        <div className="admin-user-main">
          <h3>{user.name || "Unnamed user"}</h3>

          <span>{user.email || "No email"}</span>
        </div>

        {user.is_admin ? (
          <span className="admin-role-badge">
            Administrator
          </span>
        ) : (
          <span className="admin-user-badge">User</span>
        )}
      </div>

      <div className="admin-user-card-details">
        <div>
          <span>Resumes</span>
          <strong>{user.resume_count || 0}</strong>
        </div>

        <div>
          <span>Joined</span>
          <strong>{formatDate(user.created_at)}</strong>
        </div>
      </div>

      <div className="admin-user-card-actions">
        {user.is_admin ? (
          <span className="admin-protected-label">
            Protected administrator account
          </span>
        ) : user.is_deleted || user.deleted_at || user.is_active === false ? (
          <button
            type="button"
            className="admin-card-activate-button"
            onClick={() => onReactivate(user)}
          >
            Activate user
          </button>
        ) : (
          <button
            type="button"
            className="admin-card-delete-button"
            onClick={() => onDelete(user)}
          >
            Delete user
          </button>
        )}
      </div>
    </article>
  );
}

function ActivityItem({ resume, type }) {
  return (
    <div className="admin-activity-item">
      <div
        className={`admin-activity-icon ${
          type === "created" ? "created" : "updated"
        }`}
      >
        {type === "created" ? "+" : "↗"}
      </div>

      <div className="admin-activity-content">
        <strong>{resume.name || "Untitled resume"}</strong>

        <span>
          {type === "created"
            ? "Created by"
            : "Updated by"}{" "}
          <b>{resume.owner_name || "Unknown user"}</b>
        </span>

        <small>
          {formatDateTime(
            type === "created"
              ? resume.created_at
              : resume.updated_at
          )}
        </small>
      </div>

      <Link
        className="admin-activity-view"
        to={`/admin/resumes/${resume.id}`}
      >
        View
      </Link>
    </div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [tab, setTab] = useState("users");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { confirm } = useDialog();

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await adminData({
        q: query.trim(),
        from_date: fromDate,
        to_date: toDate,
      });

      setOverview(data?.overview || null);
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setResumes(
        Array.isArray(data?.resumes) ? data.resumes : []
      );
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Could not load administrator data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteResume = async (resume) => {
    const confirmed = await confirm(
      "Delete resume?",
      `Delete “${resume.name}" from ${resume.owner_name}? This cannot be undone.`,
      { tone: "danger", confirmLabel: "Delete resume" }
    );

    if (!confirmed) return;

    try {
      setError("");

      await adminDeleteResume(resume.id);

      setResumes((current) =>
        current.filter((item) => item.id !== resume.id)
      );

      setOverview((current) =>
        current
          ? {
              ...current,
              resumes: Math.max(
                0,
                (current.resumes || 0) - 1
              ),
              resumes_this_week:
                current.resumes_this_week || 0,
            }
          : current
      );

      setUsers((current) =>
        current.map((user) =>
          user.id === resume.owner_id
            ? {
                ...user,
                resume_count: Math.max(
                  0,
                  (user.resume_count || 0) - 1
                ),
              }
            : user
        )
      );
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Could not delete resume."
      );
    }
  };

  const deleteUser = async (user) => {
    const confirmed = await confirm(
      "Deactivate user?",
      `Deactivate ${user.name}? Their resumes will be preserved and their account can be activated again.`,
      { tone: "danger", confirmLabel: "Deactivate user" }
    );

    if (!confirmed) return;

    try {
      setError("");

      await adminDeleteUser(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, is_active: false, is_deleted: true, deleted_at: new Date().toISOString() }
            : item
        )
      );

      setOverview((current) =>
        current
          ? {
              ...current,
              users: current.users || 0,
              resumes: current.resumes || 0,
              active_users:
                typeof current.active_users === "number"
                  ? Math.max(
                      0,
                      current.active_users -
                        (user.is_active === false ? 0 : 1)
                    )
                  : current.active_users,
            }
          : current
      );
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Could not deactivate user."
      );
    }
  };

  const reactivateUser = async (user) => {
    try {
      setError("");
      const updated = await adminSetUserStatus(user.id, true);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, ...updated, is_active: true, is_deleted: false, deleted_at: null }
            : item
        )
      );
      setOverview((current) =>
        current && user.is_active === false
          ? { ...current, active_users: (current.active_users || 0) + 1 }
          : current
      );
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Could not activate user."
      );
    }
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users;

    return users.filter((user) =>
      [user.name, user.email].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    );
  }, [users, normalizedQuery]);

  const filteredResumes = useMemo(() => {
    if (!normalizedQuery) return resumes;

    return resumes.filter((resume) =>
      [
        resume.name,
        resume.owner_name,
        resume.owner_email,
        resume.template,
        resume.color,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    );
  }, [resumes, normalizedQuery]);

  const recentUpdated = useMemo(
    () =>
      [...resumes]
        .sort(
          (a, b) =>
            new Date(b.updated_at || 0) -
            new Date(a.updated_at || 0)
        )
        .slice(0, 10),
    [resumes]
  );

  const recentCreated = useMemo(
    () =>
      [...resumes]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        )
        .slice(0, 10),
    [resumes]
  );

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-content admin-page">
        {/* HEADER */}
        <section className="admin-hero">
          <div>
            <span className="eyebrow">ADMINISTRATION</span>

            <h1>Admin dashboard</h1>

            <p>
              A clean overview of your ResumeForge
              workspace, users, resumes and activity.
            </p>
          </div>

          <div className="admin-hero-badge">
            <span className="admin-live-dot" />
            System overview
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="form-error admin-error">
            <span>!</span>
            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={load}
              className="admin-error-retry"
            >
              Retry
            </button>
          </div>
        )}

        {/* STATS */}
        {overview && (
          <section className="admin-stats-grid">
            <StatCard
              icon="◉"
              label="Total users"
              value={overview.users}
              description="Registered accounts"
            />

            <StatCard
              icon="▤"
              label="Total resumes"
              value={overview.resumes}
              description="Resumes in workspace"
            />

            <StatCard
              icon="↗"
              label="Created this week"
              value={overview.resumes_this_week || 0}
              description="New resumes"
            />

            <StatCard
              icon="✓"
              label="Active users"
              value={
                overview.active_users ??
                overview.users ??
                0
              }
              description="Currently active"
            />
          </section>
        )}

        {/* MAIN CONTROL PANEL */}
        <section className="admin-workspace">
          <div className="admin-workspace-header">
            <div>
              <span className="admin-section-kicker">
                WORKSPACE
              </span>

              <h2>
                {tab === "users"
                  ? "Users"
                  : tab === "resumes"
                  ? "Resumes"
                  : "Activity"}
              </h2>

              <p>
                {tab === "users"
                  ? `${filteredUsers.length} user${
                      filteredUsers.length === 1 ? "" : "s"
                    }`
                  : tab === "resumes"
                  ? `${filteredResumes.length} resume${
                      filteredResumes.length === 1
                        ? ""
                        : "s"
                    }`
                  : "Latest system activity"}
              </p>
            </div>

            <div className="admin-tab-switcher">
              <button
                type="button"
                className={tab === "users" ? "active" : ""}
                onClick={() => setTab("users")}
              >
                <span>◉</span>
                Users
              </button>

              <button
                type="button"
                className={
                  tab === "resumes" ? "active" : ""
                }
                onClick={() => setTab("resumes")}
              >
                <span>▤</span>
                Resumes
              </button>

              <button
                type="button"
                className={
                  tab === "activity" ? "active" : ""
                }
                onClick={() => setTab("activity")}
              >
                <span>↗</span>
                Activity
              </button>
            </div>
          </div>

          {/* FILTERS */}
          {tab !== "activity" && (
            <div className="admin-filter-panel">
              <div className="admin-search-large">
                <span>⌕</span>

                <input
                  type="search"
                  value={query}
                  placeholder={
                    tab === "users"
                      ? "Search by name or email..."
                      : "Search resumes, owners, templates..."
                  }
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      load();
                    }
                  }}
                />

                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>

              {tab === "resumes" && (
                <div className="admin-date-group">
                  <div>
                    <label htmlFor="admin-from-date">
                      From
                    </label>

                    <input
                      id="admin-from-date"
                      type="date"
                      value={fromDate}
                      onChange={(event) =>
                        setFromDate(event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-to-date">
                      To
                    </label>

                    <input
                      id="admin-to-date"
                      type="date"
                      value={toDate}
                      onChange={(event) =>
                        setToDate(event.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                className="admin-apply-button"
                onClick={load}
                disabled={loading}
              >
                {loading ? "Loading..." : "Apply filters"}
              </button>
            </div>
          )}

          {/* USERS */}
          {tab === "users" && (
            <div className="admin-card-grid">
              {loading && !users.length ? (
                <div className="admin-loading-state">
                  <div className="loading-spinner" />
                  <h3>Loading users...</h3>
                  <p>Getting administrator data ready.</p>
                </div>
              ) : filteredUsers.length ? (
                filteredUsers.map((user) => (
                  <UserAdminCard
                    key={user.id}
                    user={user}
                    onDelete={deleteUser}
                    onReactivate={reactivateUser}
                  />
                ))
              ) : (
                <div className="admin-empty-state">
                  <div>◉</div>
                  <h3>
                    {users.length
                      ? "No users found"
                      : "No users yet"}
                  </h3>
                  <p>
                    {users.length
                      ? "Try a different search term."
                      : "Registered users will appear here."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* RESUMES */}
          {tab === "resumes" && (
            <div className="admin-card-grid admin-resume-grid">
              {loading && !resumes.length ? (
                <div className="admin-loading-state">
                  <div className="loading-spinner" />
                  <h3>Loading resumes...</h3>
                  <p>Getting resume data ready.</p>
                </div>
              ) : filteredResumes.length ? (
                filteredResumes.map((resume) => (
                  <ResumeAdminCard
                    key={resume.id}
                    resume={resume}
                    onDelete={deleteResume}
                  />
                ))
              ) : (
                <div className="admin-empty-state">
                  <div>▤</div>
                  <h3>
                    {resumes.length
                      ? "No resumes found"
                      : "No resumes yet"}
                  </h3>
                  <p>
                    {resumes.length
                      ? "Try a different search or date range."
                      : "Created resumes will appear here."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY */}
          {tab === "activity" && (
            <div className="admin-activity-grid">
              <section className="admin-activity-panel">
                <div className="admin-panel-heading">
                  <div className="admin-panel-heading-icon">
                    ↗
                  </div>

                  <div>
                    <h3>Recently updated</h3>
                    <p>Latest resume changes</p>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {recentUpdated.length ? (
                    recentUpdated.map((resume) => (
                      <ActivityItem
                        key={`updated-${resume.id}`}
                        resume={resume}
                        type="updated"
                      />
                    ))
                  ) : (
                    <div className="admin-small-empty">
                      No recent updates.
                    </div>
                  )}
                </div>
              </section>

              <section className="admin-activity-panel">
                <div className="admin-panel-heading">
                  <div className="admin-panel-heading-icon">
                    +
                  </div>

                  <div>
                    <h3>Recently created</h3>
                    <p>Newest resumes in the system</p>
                  </div>
                </div>

                <div className="admin-activity-list">
                  {recentCreated.length ? (
                    recentCreated.map((resume) => (
                      <ActivityItem
                        key={`created-${resume.id}`}
                        resume={resume}
                        type="created"
                      />
                    ))
                  ) : (
                    <div className="admin-small-empty">
                      No recent resumes.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
