import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { getResume, updateResume } from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import { TEMPLATES, TEMPLATE_COLORS, getColor } from "../templates";

export default function TemplateGallery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resume, setResume] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [selectedColor, setSelectedColor] = useState("violet");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const next = searchParams.get("next") === "preview" ? "preview" : "edit";

  useEffect(() => {
    let mounted = true;
    getResume(id)
      .then((r) => {
        if (!mounted) return;
        setResume(r);
        setSelectedTemplate(r.template || "classic");
        setSelectedColor(r.color || "violet");
      })
      .catch(() => {
        if (mounted) setError("Could not load this resume.");
      });
    return () => { mounted = false; };
  }, [id]);

  const apply = async () => {
    setSaving(true);
    setError("");
    try {
      await updateResume(id, { template: selectedTemplate, color: selectedColor });
      navigate(`/resumes/${id}/${next}`);
    } catch (e) {
      setError(e.response?.data?.detail || "Could not save your template selection.");
    } finally {
      setSaving(false);
    }
  };

  if (!resume) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="page-content">
          <div className="loading-card"><div className="loading-spinner" /><p>Loading templates…</p></div>
        </main>
      </div>
    );
  }

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
  const currentColor = getColor(selectedColor);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
          <h1 className="preview-title">Choose a template</h1>
          <p className="text-muted small">
            Pick a layout and accent color for <strong>{resume.name}</strong>. The same design is used in editing, preview and PDF export.
          </p>
        </div>

        {error && <div className="form-error dashboard-error"><span>!</span>{error}</div>}

        <div className="template-grid">
          {TEMPLATES.map((tpl) => {
            const selected = tpl.id === selectedTemplate;
            const previewColor = selected ? selectedColor : (resume.color || "violet");

            return (
              <article key={tpl.id} className={`template-card ${selected ? "selected" : ""}`}>
                <button
                  type="button"
                  className="template-preview-button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  aria-pressed={selected}
                  aria-label={`Select ${tpl.name} template`}
                >
                  <div className="template-real-preview">
                    <ResumeDocument
                      resume={{ ...resume, color: previewColor }}
                      templateId={tpl.id}
                    />
                  </div>
                </button>

                <div className="template-card-body">
                  <div className="template-card-title-row">
                    <h3>{tpl.name}</h3>
                    {selected && <span className="template-current-pill">Selected</span>}
                  </div>

                  <p>{tpl.description}</p>

                  <div className="template-color-row">
                    <strong>Accent color</strong>
                    <div className="color-options">
                      {TEMPLATE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`color-option ${selected && selectedColor === c.id ? "selected" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedTemplate(tpl.id);
                            setSelectedColor(c.id);
                          }}
                          title={c.name}
                          aria-label={`${tpl.name}: ${c.name}`}
                          aria-pressed={selected && selectedColor === c.id}
                        >
                          <span style={{ background: c.value }} />
                          {selected && selectedColor === c.id && <b>✓</b>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selected && (
                    <div className="selected-color-name" style={{ color: currentColor.value }}>
                      ● {currentColor.name}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="template-apply-bar">
          <div>
            <strong>{currentTemplate.name}</strong>
            <span> · {currentColor.name}</span>
          </div>
          <button className="btn-primary" onClick={apply} disabled={saving}>
            {saving ? "Saving…" : "Use selected template"}
          </button>
        </div>
      </main>
    </div>
  );
}
 
