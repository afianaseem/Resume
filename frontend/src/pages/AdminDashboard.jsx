import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  adminData,
  adminDeleteResume,
  adminDeleteUser,
} from "../api/resumes";
import { TEMPLATE_COLORS, TEMPLATES } from "../templates";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [tab, setTab] = useState("users");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = async () => {
    try {
      // ONE request instead of three independent serverless requests.
      const data = await adminData({
        q: query,
        from_date: fromDate,
        to_date: toDate,
      });

      setOverview(data.overview);
      setUsers(data.users);
      setResumes(data.resumes);
      setError("");
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Could not load administrator data."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteResume = async (r) => {
    if (
      !window.confirm(
        `Delete "${r.name}" from ${r.owner_name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await adminDeleteResume(r.id);

      setResumes((current) =>
        current.filter((item) => item.id !== r.id)
      );

      setOverview((current) =>
        current
          ? {
              ...current,
              resumes: Math.max(0, current.resumes - 1),
            }
          : current
      );

      setUsers((current) =>
        current.map((user) =>
          user.id === r.owner_id
            ? {
                ...user,
                resume_count: Math.max(
                  0,
                  user.resume_count - 1
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

  const deleteUser = async (u) => {
    if (
      !window.confirm(
        `Delete user ${u.name} and ALL ${u.resume_count} resume(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await adminDeleteUser(u.id);

      setUsers((current) =>
        current.filter((user) => user.id !== u.id)
      );

      setResumes((current) =>
        current.filter((resume) => resume.owner_id !== u.id)
      );

      await load();
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Could not delete user."
      );
    }
  };

  const q = query.trim().toLowerCase();

  const filteredResumes = q
    ? resumes.filter((r) =>
        [
          r.name,
          r.owner_name,
          r.owner_email,
          r.template,
        ].some((value) =>
          (value || "")
            .toLowerCase()
            .includes(q)
        )
      )
    : resumes;

  const filteredUsers = q
    ? users.filter((u) =>
        [u.name, u.email].some((value) =>
          (value || "")
            .toLowerCase()
            .includes(q)
        )
      )
    : users;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-content admin-page">
        {/* PAGE HEADER */}
        <div className="page-header">
          <div>
            <span className="eyebrow">
              ADMINISTRATION
            </span>

            <h1>Admin dashboard</h1>

            <p className="text-muted">
              Manage users, resumes, and recent activity
              from one responsive workspace.
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="form-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* STATISTICS */}
        {overview && (
          <div className="dashboard-stats admin-stats">
            <div className="stat-card">
              <div className="stat-icon">◉</div>

              <div>
                <span className="stat-label">
                  Total users
                </span>

                <strong>
                  {overview.users}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">▤</div>

              <div>
                <span className="stat-label">
                  Total resumes
                </span>

                <strong>
                  {overview.resumes}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">↗</div>

              <div>
                <span className="stat-label">
                  Created this week
                </span>

                <strong>
                  {overview.resumes_this_week || 0}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✓</div>

              <div>
                <span className="stat-label">
                  Active users
                </span>

                <strong>
                  {overview.active_users ??
                    overview.users}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="admin-toolbar">
          <div
            className="admin-tabs"
            role="tablist"
            aria-label="Admin sections"
          >
            <button
              type="button"
              className={
                tab === "users" ? "active" : ""
              }
              onClick={() => setTab("users")}
            >
              All users
            </button>

            <button
              type="button"
              className={
                tab === "resumes" ? "active" : ""
              }
              onClick={() => setTab("resumes")}
            >
              All resumes
            </button>

            <button
              type="button"
              className={
                tab === "activity" ? "active" : ""
              }
              onClick={() => setTab("activity")}
            >
              Activity
            </button>
          </div>

          <div className="admin-filter-bar">
            <div className="admin-search">
              <span className="admin-search-icon">
                ⌕
              </span>

              <input
                type="search"
                placeholder={
                  tab === "resumes"
                    ? "Search resumes or owners…"
                    : "Search users…"
                }
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && load()
                }
              />
            </div>

            {tab === "resumes" && (
              <>
                <input
                  className="admin-date-input"
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(e.target.value)
                  }
                  title="Created from"
                />

                <input
                  className="admin-date-input"
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(e.target.value)
                  }
                  title="Created to"
                />
              </>
            )}

            <button
              className="btn-primary"
              type="button"
              onClick={load}
            >
              Apply
            </button>
          </div>
        </div>

        {/* RESUMES */}
        {tab === "resumes" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Resume</th>
                  <th>Owner</th>
                  <th>Template</th>
                  <th>Color</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredResumes.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Resume">
                      <strong>{r.name}</strong>
                    </td>

                    <td data-label="Owner">
                      {r.owner_name}

                      <small>
                        {r.owner_email}
                      </small>
                    </td>

                    <td data-label="Template">
                      {TEMPLATES.find(
                        (t) => t.id === r.template
                      )?.name || r.template}
                    </td>

                    <td data-label="Color">
                      <span
                        className="admin-color-dot"
                        style={{
                          background:
                            TEMPLATE_COLORS.find(
                              (c) =>
                                c.id === r.color
                            )?.value || "#888",
                        }}
                      />

                      {r.color}
                    </td>

                    <td data-label="Updated">
                      {new Date(
                        r.updated_at
                      ).toLocaleDateString()}
                    </td>

                    <td
                      data-label="Actions"
                      className="admin-row-actions"
                    >
                      <Link
                        className="btn-ghost"
                        to={`/admin/resumes/${r.id}`}
                      >
                        ◎ View
                      </Link>

                      <button
                        className="btn-ghost danger"
                        onClick={() =>
                          deleteResume(r)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredResumes.length && (
              <div className="empty-state">
                <h2>
                  {resumes.length
                    ? "No resumes match your search"
                    : "No resumes"}
                </h2>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Resumes</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td data-label="User">
                      <strong>{u.name}</strong>
                    </td>

                    <td data-label="Email">
                      {u.email}
                    </td>

                    <td data-label="Role">
                      {u.is_admin ? (
                        <span className="admin-role-badge">
                          Administrator
                        </span>
                      ) : (
                        "User"
                      )}
                    </td>

                    <td data-label="Resumes">
                      {u.resume_count}
                    </td>

                    <td data-label="Joined">
                      {new Date(
                        u.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td
                      data-label="Actions"
                      className="admin-row-actions"
                    >
                      {!u.is_admin && (
                        <button
                          className="btn-ghost danger"
                          onClick={() =>
                            deleteUser(u)
                          }
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredUsers.length && (
              <div className="empty-state">
                <h2>
                  {users.length
                    ? "No users match your search"
                    : "No users"}
                </h2>
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          <div className="activity-grid">
            <section className="admin-activity-card">
              <div className="section-heading-row">
                <div>
                  <h2>Recently updated</h2>
                  <p>Latest resume changes</p>
                </div>
              </div>

              {resumes
                .slice(0, 8)
                .map((r) => (
                  <div
                    className="activity-row"
                    key={`u${r.id}`}
                  >
                    <div className="activity-dot">
                      ↗
                    </div>

                    <div>
                      <strong>{r.name}</strong>

                      <span>
                        {r.owner_name} ·{" "}
                        {new Date(
                          r.updated_at
                        ).toLocaleString()}
                      </span>
                    </div>

                    <Link
                      className="btn-ghost"
                      to={`/admin/resumes/${r.id}`}
                    >
                      View
                    </Link>
                  </div>
                ))}
            </section>

            <section className="admin-activity-card">
              <div className="section-heading-row">
                <div>
                  <h2>Recently created</h2>
                  <p>
                    Newest resumes in the system
                  </p>
                </div>
              </div>

              {[...resumes]
                .sort(
                  (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
                )
                .slice(0, 8)
                .map((r) => (
                  <div
                    className="activity-row"
                    key={`c${r.id}`}
                  >
                    <div className="activity-dot">
                      ＋
                    </div>

                    <div>
                      <strong>{r.name}</strong>

                      <span>
                        {r.owner_name} ·{" "}
                        {new Date(
                          r.created_at
                        ).toLocaleString()}
                      </span>
                    </div>

                    <Link
                      className="btn-ghost"
                      to={`/admin/resumes/${r.id}`}
                    >
                      View
                    </Link>
                  </div>
                ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
