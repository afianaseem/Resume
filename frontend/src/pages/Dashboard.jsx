import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listResumes, deleteResume, createResume } from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import { getTemplate } from "../templates";
import { useDialog } from "../context/DialogContext";

function formatDate(iso) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

/*
 * ResumeDocument is intentionally expensive because it is the real A4
 * renderer. The old dashboard rendered one full document for every resume
 * immediately. On a dashboard with several resumes this created a large
 * amount of DOM/layout work before the page became interactive.
 *
 * Render the real preview only when its card is near the viewport.
 */
function LazyResumeThumbnail({ resume }) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const thumbnailResume = {
    ...resume,
    personal_info: resume.personal_info || {},
    education: resume.education || [],
    experience: resume.experience || [],
    skills: resume.skills || [],
    projects: resume.projects || [],
  };

  if (!thumbnailResume.personal_info.full_name) {
    thumbnailResume.personal_info = {
      ...thumbnailResume.personal_info,
      full_name: resume.name || "Your Name",
    };
  }

  return (
    <div ref={hostRef} className="resume-card-preview" aria-hidden="true">
      <div className="resume-card-preview-viewport">
        <div className="resume-card-preview-scale">
          {visible ? (
            <ResumeDocument
              resume={thumbnailResume}
              templateId={resume.template || "classic"}
            />
          ) : (
            <div className="resume-thumbnail-placeholder">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      </div>
      <div className="resume-card-preview-overlay" />
      <span className="resume-card-preview-label">Live resume preview</span>
    </div>
  );
}

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { confirm, prompt } = useDialog();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // ONE request. The old version did listResumes() and then GET /resumes/:id
      // for every item (N+1 HTTP requests).
      const list = await listResumes();
      setResumes(list);
    } catch (error) {
      setError(
        error?.code === "ECONNABORTED"
          ? "The server took too long to respond. Please refresh once."
          : "Could not load your resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const name = await prompt(
      "Create a new resume",
      "Give your resume a name so you can find it easily later.",
      "",
      { placeholder: 'e.g. "Python Developer 2026"', confirmLabel: "Create resume" }
    );
    if (!name?.trim()) return;

    setCreating(true);
    setError("");

    try {
      const resume = await createResume({ name: name.trim() });
      navigate(`/resumes/${resume.id}/template`);
    } catch {
      setError("Could not create a new resume. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!await confirm(
      "Delete resume?",
      `Delete “${name}”? This action cannot be undone.`,
      { tone: "danger", confirmLabel: "Delete resume" }
    )) return;

    try {
      await deleteResume(id);
      setResumes((previous) => previous.filter((resume) => resume.id !== id));
    } catch {
      setError("Could not delete that resume.");
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-content dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h1>Your resumes</h1>
            <p>Create polished resumes, keep different versions, and tailor your applications with ease.</p>
          </div>

          <button
            className="btn-primary create-button"
            onClick={handleCreate}
            disabled={creating}
          >
            <span className="button-plus">+</span>
            {creating ? "Creating..." : "Create new resume"}
          </button>
        </section>

        {error && (
          <div className="form-error dashboard-error">
            <span>!</span>{error}
          </div>
        )}

        {!loading && (
          <section className="dashboard-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">▤</div>
              <div className="admin-stat-content"><span>Total resumes</span><strong>{resumes.length}</strong><small>Saved in your workspace</small></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">✦</div>
              <div className="admin-stat-content"><span>Workspace</span><strong>Personal</strong><small>Your private resume space</small></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">✓</div>
              <div className="admin-stat-content"><span>Resume builder</span><strong>Ready</strong><small>Everything is ready to use</small></div>
            </div>
          </section>
        )}

        <section className="dashboard-section">
          <div className="section-heading-row">
            <div>
              <h2>Your resume collection</h2>
              <p>Manage your saved resumes and continue where you left off.</p>
            </div>

            {!loading && resumes.length > 0 && (
              <span className="resume-count">
                {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <p>Loading your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h2>Create your first resume</h2>
              <p>Start building a professional resume in just a few minutes. You can create multiple versions for different applications.</p>
              <button className="btn-primary" onClick={handleCreate}>
                + Create my first resume
              </button>
            </div>
          ) : (
            <div className="resume-grid">
              {resumes.map((resume) => (
                <article className="resume-card" key={resume.id}>
                  <Link
                    className="resume-card-preview-link"
                    to={`/resumes/${resume.id}/preview`}
                    aria-label={`Preview ${resume.name}`}
                  >
                    <LazyResumeThumbnail resume={resume} />
                  </Link>

                  <div className="resume-card-top">
                    <button
                      type="button"
                      className="card-menu"
                      onClick={() => handleDelete(resume.id, resume.name)}
                      title="Delete resume"
                      aria-label={`Delete ${resume.name}`}
                    >
                      ⋮
                    </button>
                  </div>

                  <div className="resume-card-content">
                    <h3 title={resume.name}>{resume.name}</h3>

                    <div className="resume-card-meta-row">
                      <p className="resume-card-date">Updated {formatDate(resume.updated_at)}</p>

                      <Link
                        className="template-pill-link"
                        to={`/resumes/${resume.id}/template`}
                        title="Change template"
                      >
                        {getTemplate(resume.template || "classic").name} template
                      </Link>
                    </div>
                  </div>

                  <div className="resume-card-actions">
                    <Link className="btn-secondary" to={`/resumes/${resume.id}/edit`}>Edit</Link>
                    <Link className="btn-primary" to={`/resumes/${resume.id}/preview`}>Preview</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
