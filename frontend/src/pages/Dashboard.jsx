import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listResumes,
  deleteResume,
  createResume,
} from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import { getTemplate } from "../templates";

function formatDate(iso) {
  if (!iso) return "Unknown";

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getResumeInitials(name) {
  if (!name) return "R";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ResumeThumbnail({ resume }) {
  const templateId = resume.template || "classic";

  const thumbnailResume = {
    ...resume,
    personal_info: resume.personal_info || {
      full_name: resume.name || "Your Name",
    },
    education: resume.education || [],
    experience: resume.experience || [],
    skills: resume.skills || [],
    projects: resume.projects || [],
  };

  if (
    !thumbnailResume.personal_info.full_name &&
    resume.name
  ) {
    thumbnailResume.personal_info.full_name = resume.name;
  }

  return (
    <div className="resume-card-preview" aria-hidden="true">
      <div className="resume-card-preview-scale">
        <ResumeDocument
          resume={thumbnailResume}
          templateId={templateId}
        />
      </div>
      <div className="resume-card-preview-overlay" />
    </div>
  );
}

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError("");

    listResumes()
      .then(setResumes)
      .catch(() => {
        setError("Could not load your resumes.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const name = window.prompt(
      'Name this resume (e.g. "Python Developer 2026")'
    );

    if (!name?.trim()) return;

    setCreating(true);
    setError("");

    try {
      const resume = await createResume({
        name: name.trim(),
      });

      navigate(`/resumes/${resume.id}/template`);
    } catch {
      setError("Could not create a new resume. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete "${name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteResume(id);

      setResumes((previous) =>
        previous.filter((resume) => resume.id !== id)
      );
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

            <p>
              Create polished resumes, keep different versions,
              and tailor your applications with ease.
            </p>
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
            <span>!</span>
            {error}
          </div>
        )}

        {!loading && (
          <section className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">▤</div>
              <div>
                <span className="stat-label">Total resumes</span>
                <strong>{resumes.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✦</div>
              <div>
                <span className="stat-label">Workspace</span>
                <strong>Personal</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✓</div>
              <div>
                <span className="stat-label">Resume builder</span>
                <strong>Ready</strong>
              </div>
            </div>
          </section>
        )}

        <section className="dashboard-section">
          <div className="section-heading-row">
            <div>
              <h2>Your resume collection</h2>
              <p>
                Manage your saved resumes and continue where you left off.
              </p>
            </div>

            {!loading && resumes.length > 0 && (
              <span className="resume-count">
                {resumes.length}{" "}
                {resumes.length === 1 ? "resume" : "resumes"}
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
              <p>
                Start building a professional resume in just a few minutes.
                You can create multiple versions for different applications.
              </p>
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
                    <ResumeThumbnail resume={resume} />
                  </Link>

                  <div className="resume-card-top">
                    <div className="resume-card-icon">
                      {getResumeInitials(resume.name)}
                    </div>

                    <button
                      type="button"
                      className="card-menu"
                      onClick={() =>
                        handleDelete(resume.id, resume.name)
                      }
                      title="Delete resume"
                    >
                      ⋮
                    </button>
                  </div>

                  <div className="resume-card-content">
                    <h3 title={resume.name}>{resume.name}</h3>

                    <div className="resume-card-meta-row">
                      <p className="resume-card-date">
                        Updated {formatDate(resume.updated_at)}
                      </p>

                      <Link
                        className="template-pill-link"
                        to={`/resumes/${resume.id}/template`}
                        title="Change template"
                      >
                        {getTemplate(resume.template).name} template
                      </Link>
                    </div>
                  </div>

                  <div className="resume-card-actions">
                    <Link
                      className="btn-secondary"
                      to={`/resumes/${resume.id}/edit`}
                    >
                      Edit
                    </Link>

                    <Link
                      className="btn-primary"
                      to={`/resumes/${resume.id}/preview`}
                    >
                      Preview
                    </Link>
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
