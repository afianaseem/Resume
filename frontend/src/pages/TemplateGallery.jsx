import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { getResume, updateResume } from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import { TEMPLATES, TEMPLATE_COLORS, getColor } from "../templates";

const TEMPLATE_DUMMY_DATA = {
  personal_info: {
    full_name: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    phone: "+92 300 1234567",
    address: "Lahore, Pakistan",
    summary: "Product-focused software developer with 4+ years of experience building responsive web applications, improving user experiences, and collaborating with cross-functional teams.",
    profile_image: "",
  },
  education: [
    { degree: "BS Computer Science", field: "", school: "University of the Punjab", start_date: "2017-09-01", end_date: "2021-06-01", current: false, grade: "CGPA 3.7 / 4.0" },
  ],
  experience: [
    { role: "Frontend Developer", company: "TechNova Solutions", start_date: "2022-01-01", end_date: "2026-05-01", current: false, description: "Built responsive React applications, improved page performance by 35%, and collaborated with designers and backend engineers to deliver customer-facing features." },
    { role: "Junior Web Developer", company: "Digital Works", start_date: "2021-07-01", end_date: "2021-12-01", current: false, description: "Developed reusable UI components and maintained accessible, mobile-first interfaces for multiple client projects." },
  ],
  skills: ["React", "JavaScript", "TypeScript", "HTML & CSS", "REST APIs", "Git"],
  projects: [
    { title: "Resume Builder", tech_stack: "React · FastAPI · PostgreSQL", description: "Created a responsive resume builder with live preview, reusable templates, and PDF export.", link: "https://example.com" },
  ],
  section_order: ["summary", "experience", "education", "skills", "projects"],
};

function templatePreviewResume(resume) {
  const data = resume || {};
  const pi = data.personal_info || {};
  const hasContent = Boolean(
    pi.full_name || pi.email || pi.phone || pi.address || pi.summary ||
    data.education?.length || data.experience?.length || data.skills?.length || data.projects?.length
  );

  if (hasContent) return data;

  return {
    ...data,
    ...TEMPLATE_DUMMY_DATA,
    personal_info: { ...TEMPLATE_DUMMY_DATA.personal_info },
    education: [...TEMPLATE_DUMMY_DATA.education],
    experience: [...TEMPLATE_DUMMY_DATA.experience],
    skills: [...TEMPLATE_DUMMY_DATA.skills],
    projects: [...TEMPLATE_DUMMY_DATA.projects],
    section_order: [...TEMPLATE_DUMMY_DATA.section_order],
  };
}

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
    getResume(id)
      .then((data) => {
        setResume(data);
        setSelectedTemplate(data.template || "classic");
        setSelectedColor(data.color || "violet");
      })
      .catch(() => setError("Could not load this resume."));
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
        <main className="page-content"><div className="loading-card"><div className="loading-spinner" /><p>Loading templates…</p></div></main>
      </div>
    );
  }

  const previewResume = templatePreviewResume(resume);

  return (
    <div className="app-shell template-gallery-page">
      <Navbar />
      <main className="page-content">
        <div className="template-gallery-header">
          <div>
            <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
            <span className="eyebrow">RESUME DESIGN</span>
            <h1 className="preview-title">Choose a template</h1>
            <p className="text-muted small">Pick a layout and accent color for <strong>{resume.name}</strong>. Your choice is used consistently in editing, preview, PDF and email.</p>
          </div>
          <div className="template-gallery-tip"><span>✦</span><div><strong>Preview before you choose</strong><small>Every card shows a real A4 resume layout.</small></div></div>
        </div>

        {error && <div className="form-error dashboard-error"><span>!</span>{error}</div>}

        <div className="template-grid">
          {TEMPLATES.map((tpl) => {
            const selected = tpl.id === selectedTemplate;
            const previewColor = selected ? selectedColor : (resume.color || "violet");
            return (
              <article key={tpl.id} className={`template-card ${selected ? "selected" : ""}`}>
                <button type="button" className="template-preview-button" onClick={() => setSelectedTemplate(tpl.id)} aria-label={`Select ${tpl.name}`}>
                  <div className="template-real-preview">
                    <div className="template-preview-canvas">
                      <ResumeDocument
                        resume={{ ...previewResume, color: previewColor }}
                        templateId={tpl.id}
                      />
                    </div>
                    <span className="template-preview-label">Click to select</span>
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
                          onClick={() => { setSelectedTemplate(tpl.id); setSelectedColor(c.id); }}
                          title={c.name}
                          aria-label={`${tpl.name}: ${c.name}`}
                        >
                          <span style={{ background: c.value }} />
                          {selected && selectedColor === c.id && <b>✓</b>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selected && <div className="selected-color-name" style={{ color: getColor(selectedColor).value }}>● {getColor(selectedColor).name}</div>}
                </div>
              </article>
            );
          })}
        </div>

        <div className="template-apply-bar">
          <div><span>Selected</span><strong>{TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</strong><em>·</em>{getColor(selectedColor).name}</div>
          <button className="btn-primary" onClick={apply} disabled={saving}>{saving ? "Saving…" : "Use selected template"}</button>
        </div>
      </main>
    </div>
  );
}
