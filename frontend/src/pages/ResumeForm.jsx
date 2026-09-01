import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getResume, updateResume, listResumeVersions, createResumeVersion,
  restoreResumeVersion, duplicateResume,
} from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import DateRangeFields from "../components/DateRangeFields";
import PhoneField from "../components/PhoneField";
import { getTemplate, TEMPLATE_COLORS } from "../templates";
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL, findCountryByDial } from "../countryCodes";
import { useDialog } from "../context/DialogContext";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

const STEPS = [
  {
    key: "summary",
    label: "Personal Info",
    short: "Personal",
    description: "Your contact details and professional summary.",
  },
  {
    key: "education",
    label: "Education",
    short: "Education",
    description: "Add your academic background.",
  },
  {
    key: "experience",
    label: "Experience",
    short: "Experience",
    description: "Show your work and internship experience.",
  },
  {
    key: "skills",
    label: "Skills",
    short: "Skills",
    description: "Add the technologies and skills you know.",
  },
  {
    key: "projects",
    label: "Projects",
    short: "Projects",
    description: "Highlight your strongest projects.",
  },
];

const emptyEducation = {
  school: "",
  degree: "",
  field: "",
  start_date: "",
  end_date: "",
  current: false,
  grade: "",
};

const emptyExperience = {
  company: "",
  role: "",
  start_date: "",
  end_date: "",
  current: false,
  description: "",
};

const emptyProject = {
  title: "",
  description: "",
  link: "",
  tech_stack: "",
};

// Splits a stored "+92 3001234567" style phone string back into its
// country-dial and local-number parts for editing. Falls back to the
// default country if nothing matches.
function splitPhone(phone) {
  if (!phone) return { dial: DEFAULT_COUNTRY_DIAL, number: "" };

  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((c) => phone.trim().startsWith(c.dial));

  if (match) {
    return { dial: match.dial, number: phone.slice(match.dial.length).trim() };
  }
  return { dial: DEFAULT_COUNTRY_DIAL, number: phone.trim() };
}

function combinePhone(dial, number) {
  const trimmed = (number || "").trim();
  return trimmed ? `${dial} ${trimmed}` : "";
}

export default function ResumeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, prompt } = useDialog();

  const [step, setStep] = useState(0);
  const [resumeName, setResumeName] = useState("");
  const [template, setTemplate] = useState("classic");
  const [color, setColor] = useState("violet");

  const [personalInfo, setPersonalInfo] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    profile_image: "",
  });
  const [countryDial, setCountryDial] = useState(DEFAULT_COUNTRY_DIAL);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [projects, setProjects] = useState([]);
  const [sectionOrder, setSectionOrder] = useState(["summary", "experience", "education", "skills", "projects"]);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [draggedSection, setDraggedSection] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const loadedRef = useRef(false);
  const dirtyRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const livePreviewScrollRef = useRef(null);
  const livePreviewDocumentRef = useRef(null);
  const [livePreviewScale, setLivePreviewScale] = useState(0.62);
  const [livePreviewStageHeight, setLivePreviewStageHeight] = useState(697);

  useEffect(() => {
    if (!savedMessage) return undefined;

    const timer = window.setTimeout(() => {
      setSavedMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  useEffect(() => {
    const updateLivePreviewScale = () => {
      const scroll = livePreviewScrollRef.current;
      if (!scroll) return;

      // The resume document is always authored at 794 CSS px (A4 width).
      // On phones, scale it to the actual available preview width instead
      // of using the old fixed 0.62 scale.
      const available = Math.max(260, scroll.clientWidth - 24);
      const nextScale = Math.min(1, available / 794);
      setLivePreviewScale(nextScale);
    };

    updateLivePreviewScale();
    window.addEventListener("resize", updateLivePreviewScale);
    window.visualViewport?.addEventListener("resize", updateLivePreviewScale);

    return () => {
      window.removeEventListener("resize", updateLivePreviewScale);
      window.visualViewport?.removeEventListener("resize", updateLivePreviewScale);
    };
  }, [showPreview]);

  useEffect(() => {
    const element = livePreviewDocumentRef.current;
    if (!element) return undefined;

    const measure = () => {
      const naturalHeight = Math.max(1123, element.scrollHeight || 1123);
      setLivePreviewStageHeight(Math.ceil(naturalHeight * livePreviewScale));
    };

    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [livePreviewScale, personalInfo, education, experience, skills, projects, sectionOrder, template, color]);

  useEffect(() => {
    let mounted = true;

    getResume(id)
      .then((r) => {
        if (!mounted) return;

        setResumeName(r.name || "");
        setTemplate(r.template || "classic");
        setColor(r.color || "violet");
        setPersonalInfo({
          full_name: r.personal_info?.full_name || "",
          email: r.personal_info?.email || "",
          phone: r.personal_info?.phone || "",
          address: r.personal_info?.address || "",
          summary: r.personal_info?.summary || "",
          profile_image: r.personal_info?.profile_image || "",
        });

        const { dial, number } = splitPhone(r.personal_info?.phone || "");
        setCountryDial(dial);
        setPhoneNumber(number);

        setEducation(
          (r.education?.length ? r.education : []).map((e) => ({
            ...emptyEducation,
            ...e,
            current: false,
          }))
        );
        setExperience(
          (r.experience?.length ? r.experience : []).map((e) => ({
            ...emptyExperience,
            ...e,
          }))
        );
        setSkills(r.skills || []);
        setProjects(r.projects?.length ? r.projects : []);
        setSectionOrder(r.section_order?.length ? r.section_order : ["summary", "experience", "education", "skills", "projects"]);
        setLastSavedAt(r.updated_at ? new Date(r.updated_at) : null);
        loadedRef.current = true;
        dirtyRef.current = false;
        listResumeVersions(id).then(setVersions).catch(() => {});
      })
      .catch(() => {
        if (mounted) setError("Could not load this resume.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Live combined personal_info (used for both saving and the live preview).
  const livePersonalInfo = useMemo(
    () => ({
      ...personalInfo,
      phone: combinePhone(countryDial, phoneNumber),
    }),
    [personalInfo, countryDial, phoneNumber]
  );

  const liveResume = useMemo(
    () => ({
      personal_info: livePersonalInfo,
      education,
      experience,
      skills,
      projects,
    }),
    [livePersonalInfo, education, experience, skills, projects]
  );

  const persist = async (silent = false) => {
    setSaving(true);
    setError("");

    try {
      await updateResume(id, {
        name: resumeName.trim() || "Untitled Resume",
        template,
        color,
        personal_info: {
          ...livePersonalInfo,
          country_dial: countryDial,
        },
        education,
        experience,
        skills,
        projects,
        section_order: sectionOrder,
      });

      dirtyRef.current = false;
      setLastSavedAt(new Date());
      if (!silent) {
        setSavedMessage("Saved");
        window.setTimeout(() => setSavedMessage(""), 2000);
      }

      return true;
    } catch {
      setError("Could not save your changes. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };


  // Autosave after the user pauses typing. This intentionally saves the same
  // complete payload used by the Save button, so nothing is lost between steps.
  useEffect(() => {
    if (!loadedRef.current) return;
    dirtyRef.current = true;
    const timer = window.setTimeout(() => {
      if (!dirtyRef.current) return;
      persist(true);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [resumeName, template, color, personalInfo, countryDial, phoneNumber, education, experience, skills, projects, sectionOrder]);

  const handleSectionDrop = (targetKey) => {
    if (!draggedSection || draggedSection === targetKey) return;
    setSectionOrder((current) => {
      const next = current.filter((key) => key !== draggedSection);
      const targetIndex = next.indexOf(targetKey);
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, draggedSection);
      return next;
    });
    setDraggedSection(null);
  };

  const saveVersion = async () => {
    await persist(true);
    const label = await prompt(
      "Save a resume version",
      "Name this snapshot so you can restore it later.",
      `${resumeName || "Resume"} · ${new Date().toLocaleDateString()}`,
      { placeholder: "Version name", confirmLabel: "Save version" }
    );
    if (!label) return;
    try {
      const version = await createResumeVersion(id, label);
      setVersions((current) => [version, ...current]);
      setSavedMessage("Version created");
      window.setTimeout(() => setSavedMessage(""), 2200);
    } catch {
      setError("Could not create this resume version.");
    }
  };

  const restoreVersion = async (version) => {
    if (!await confirm(
      "Restore this version?",
      `Restore “${version.label}”? Your current resume will be replaced.`,
      { tone: "danger", confirmLabel: "Restore version" }
    )) return;
    try {
      const r = await restoreResumeVersion(id, version.id);
      setResumeName(r.name); setTemplate(r.template); setColor(r.color);
      setPersonalInfo({ full_name:r.personal_info?.full_name||"", email:r.personal_info?.email||"", phone:r.personal_info?.phone||"", address:r.personal_info?.address||"", summary:r.personal_info?.summary||"", profile_image:r.personal_info?.profile_image||"" });
      const split = splitPhone(r.personal_info?.phone || "");
      setCountryDial(split.dial); setPhoneNumber(split.number);
      setEducation(r.education || []); setExperience(r.experience || []); setSkills(r.skills || []); setProjects(r.projects || []);
      setSectionOrder(r.section_order?.length ? r.section_order : ["summary","experience","education","skills","projects"]);
      setLastSavedAt(new Date(r.updated_at)); dirtyRef.current = false;
      setSavedMessage("Version restored");
    } catch {
      setError("Could not restore that version.");
    }
  };

  const makeDuplicate = async () => {
    try {
      await persist(true);
      const copy = await duplicateResume(id);
      navigate(`/resumes/${copy.id}/edit`);
    } catch {
      setError("Could not duplicate this resume.");
    }
  };

  const activeSection = sectionOrder[step] || "summary";
  const activeStepInfo = STEPS.find((item) => item.key === activeSection) || STEPS[0];
  const nextStepInfo = STEPS.find((item) => item.key === sectionOrder[step + 1]);
  const templateInfo = getTemplate(template);

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPersonalInfo((current) => ({
        ...current,
        profile_image: reader.result,
      }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setPersonalInfo((current) => ({ ...current, profile_image: "" }));
  };

  // ---------- Validation ----------

  function validateStep(index) {
    const stepErrors = {};
    const sectionKey = sectionOrder[index];

    if (sectionKey === "summary") {
      if (!personalInfo.full_name.trim()) {
        stepErrors.full_name = "Full name is required.";
      }
      if (!personalInfo.email.trim()) {
        stepErrors.email = "Email is required.";
      } else if (!EMAIL_RE.test(personalInfo.email.trim())) {
        stepErrors.email =
          "Enter a complete email address, e.g. name@example.com";
      }
      const digits = phoneNumber.replace(/\D/g, "");
      const country = findCountryByDial(countryDial);
      const allowedLengths = country?.nationalLengths || [];
      if (!digits) {
        stepErrors.phone = "Phone number is required.";
      } else if (
        allowedLengths.length > 0 &&
        !allowedLengths.includes(digits.length)
      ) {
        stepErrors.phone =
          allowedLengths.length === 1
            ? `${country?.name || "This country"} requires exactly ${allowedLengths[0]} digits.`
            : `${country?.name || "This country"} requires ${allowedLengths.join(" or ")} digits.`;
      }
    }

    if (sectionKey === "education") {
      education.forEach((edu, i) => {
        if (!edu.school.trim()) {
          stepErrors[`edu.${i}.school`] = "School is required.";
        }
        if (!edu.degree.trim()) {
          stepErrors[`edu.${i}.degree`] = "Degree is required.";
        }
        if (!edu.start_date) {
          stepErrors[`edu.${i}.start`] = "Start date is required.";
        }
        if (!edu.end_date) {
          stepErrors[`edu.${i}.end`] = "End date is required.";
        }
        if (edu.start_date && edu.end_date) {
          if (edu.end_date < edu.start_date) {
            stepErrors[`edu.${i}.end`] =
              "End date must be after the start date.";
          }
        }
      });
    }

    if (sectionKey === "experience") {
      experience.forEach((exp, i) => {
        if (!exp.company.trim()) {
          stepErrors[`exp.${i}.company`] = "Company is required.";
        }
        if (!exp.role.trim()) {
          stepErrors[`exp.${i}.role`] = "Role is required.";
        }
        if (!exp.start_date) {
          stepErrors[`exp.${i}.start`] = "Start date is required.";
        }
        if (!exp.current && !exp.end_date) {
          stepErrors[`exp.${i}.end`] = "End date is required.";
        }
        if (exp.start_date && exp.end_date && !exp.current) {
          if (exp.end_date < exp.start_date) {
            stepErrors[`exp.${i}.end`] =
              "End date must be after the start date.";
          }
        }
      });
    }

    if (sectionKey === "projects") {
      projects.forEach((proj, i) => {
        if (!proj.title.trim()) {
          stepErrors[`proj.${i}.title`] = "Project title is required.";
        }
      });
    }

    return stepErrors;
  }

  const attemptStepChange = (targetStep) => {
    // Always allow going backward without validating forward steps.
    if (targetStep <= step) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const stepErrors = validateStep(step);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      return;
    }

    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep = () => {
    attemptStepChange(Math.min(STEPS.length - 1, step + 1));
  };

  const previousStep = () => {
    attemptStepChange(Math.max(0, step - 1));
  };

  const handleFinish = async () => {
    // Validate every step before finishing, not just the current one —
    // the person may have jumped around with the step pills.
    let allErrors = {};
    for (let i = 0; i < STEPS.length; i++) {
      allErrors = { ...allErrors, ...validateStep(i) };
    }
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      // Jump to the first step that has a problem so the person can see it.
      for (let i = 0; i < STEPS.length; i++) {
        if (Object.keys(validateStep(i)).length > 0) {
          setStep(i);
          break;
        }
      }
      setError("Please fill in all required fields before continuing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const success = await persist(true);

    if (success) {
      navigate(`/resumes/${id}/preview`);
    }
  };

  const updateListItem = (list, setList, index, field, value) => {
    const next = [...list];
    next[index] = {
      ...next[index],
      [field]: value,
    };
    setList(next);
  };

  const removeListItem = (list, setList, index) => {
    setList(list.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    const value = skillInput.trim();

    if (!value) return;

    if (!skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkills([...skills, value]);
    }

    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((item) => item !== skill));
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <main className="page-content">
          <div className="loading-card">
            <div className="loading-spinner" />
            <p>Loading your resume…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-content">
        <div className="page-header">
          <div>
            <Link to="/dashboard" className="back-link">
              ← Back to dashboard
            </Link>

            <input
              className="resume-name-input"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              aria-label="Resume name"
              placeholder="Untitled Resume"
            />

            <p className="text-muted small" style={{ margin: "6px 0 0" }}>
              Build your resume section by section.
            </p>

            <Link
              to={`/resumes/${id}/template`}
              className="template-pill-link"
              style={{ marginTop: 10, display: "inline-flex" }}
            >
              {getTemplate(template).name} template · Change
            </Link>
          </div>

          <div className="header-actions">
            {savedMessage && (
              <span className="saved-pill">✓ {savedMessage}</span>
            )}

            <div className="autosave-status" aria-live="polite">
              <span className={`autosave-dot ${saving ? "saving" : ""}`}>●</span>
              {saving ? "Saving changes…" : lastSavedAt ? `Saved automatically · ${lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Autosave on"}
            </div>

            <button type="button" className="btn-secondary" onClick={() => setShowVersions(v => !v)}>
              ◷ Versions {versions.length ? `(${versions.length})` : ""}
            </button>

            <button type="button" className="btn-secondary preview-toggle-btn no-print" onClick={() => setShowPreview((v) => !v)}>

              {showPreview ? "Hide preview" : "Show preview"}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => persist(false)}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save progress"}
            </button>

            <Link className="btn-primary" to={`/resumes/${id}/preview`}>
              Preview
            </Link>
          </div>
        </div>

        {showVersions && (
          <div className="versions-panel">
            <div className="versions-panel-head">
              <div><strong>Resume versions</strong><p>Save snapshots before making major changes or keep separate variants.</p></div>
              <div className="versions-actions">
                <button className="btn-secondary" type="button" onClick={saveVersion}>+ Save version</button>
                <button className="btn-secondary" type="button" onClick={makeDuplicate}>Duplicate resume</button>
              </div>
            </div>
            {versions.length === 0 ? (
              <div className="versions-empty">No versions yet. Save a snapshot to create your first version.</div>
            ) : (
              <div className="version-list">
                {versions.map(v => (
                  <div className="version-row" key={v.id}>
                    <div><strong>{v.label}</strong><span>{new Date(v.created_at).toLocaleString()}</span></div>
                    <button className="btn-ghost" type="button" onClick={() => restoreVersion(v)}>Restore</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="form-error dashboard-error" role="alert">
            <span>!</span>
            {error}
          </div>
        )}

        <div className={`resume-editor-layout ${showPreview ? "" : "preview-hidden"}`}>
          <div className="resume-editor-column">
            <div className="stepper" aria-label="Resume sections">
              {sectionOrder.map((key, index) => {
                const item = STEPS.find((s) => s.key === key) || STEPS[index];
                return (
                  <button
                    key={key}
                    draggable
                    onDragStart={() => setDraggedSection(key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleSectionDrop(key)}
                    className={`step-pill ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}
                    onClick={() => attemptStepChange(index)}
                    type="button"
                    title="Drag to reorder this section"
                  >
                    <span className="drag-handle" aria-hidden="true">☰</span>
                    <span>{index < step ? "✓" : index + 1}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="form-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 18,
                  marginBottom: 18,
                }}
              >
                <div>
                  <span className="eyebrow">
                    STEP {step + 1} OF {STEPS.length}
                  </span>

                  <h2 style={{ marginTop: 0 }}>{activeStepInfo.label}</h2>

                  <p
                    className="text-muted"
                    style={{ margin: "0", fontSize: 12, lineHeight: 1.6 }}
                  >
                    {activeStepInfo.description}
                  </p>
                </div>

                <span
                  className="text-muted small"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {Math.round(((step + 1) / STEPS.length) * 100)}%
                </span>
              </div>

              {activeSection === "summary" && (
                <section>
                  <div className="form-grid">
                    <label className="field-label">
                      Full name <span className="required-mark">*</span>
                      <input
                        className={errors.full_name ? "field-invalid" : ""}
                        value={personalInfo.full_name}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="e.g. Afia Naseem"
                        required
                      />
                      {errors.full_name && (
                        <span className="field-error-text">
                          {errors.full_name}
                        </span>
                      )}
                    </label>

                    <label className="field-label">
                      Email <span className="required-mark">*</span>
                      <input
                        type="email"
                        className={errors.email ? "field-invalid" : ""}
                        value={personalInfo.email}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            email: e.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        pattern="[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}"
                        title="Enter a complete email address, e.g. name@example.com"
                        required
                      />
                      {errors.email && (
                        <span className="field-error-text">
                          {errors.email}
                        </span>
                      )}
                    </label>

                    <PhoneField
                      countryDial={countryDial}
                      number={phoneNumber}
                      onCountryChange={setCountryDial}
                      onNumberChange={setPhoneNumber}
                      required
                      error={errors.phone}
                    />

                    <label className="field-label">
                      Location
                      <input
                        value={personalInfo.address}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            address: e.target.value,
                          })
                        }
                        placeholder="City, Country"
                      />
                    </label>
                  </div>

                  {templateInfo.profileImage && (
                    <div className="profile-image-field">
                      <div>
                        <span className="field-label-title">Profile photo <span className="text-muted">(optional)</span></span>
                        <p className="text-muted small" style={{ margin: "4px 0 10px" }}>
                          This template supports a profile photo. JPG, PNG, or WebP up to 2 MB.
                        </p>
                      </div>

                      <div className="profile-image-picker">
                        {personalInfo.profile_image ? (
                          <img
                            src={personalInfo.profile_image}
                            alt="Profile preview"
                            className="profile-image-preview"
                          />
                        ) : (
                          <div className="profile-image-placeholder">Photo</div>
                        )}

                        <div className="profile-image-actions">
                          <label className="btn-secondary profile-image-upload">
                            {personalInfo.profile_image ? "Change photo" : "Upload photo"}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleProfileImage}
                              hidden
                            />
                          </label>

                          {personalInfo.profile_image && (
                            <button
                              type="button"
                              className="btn-ghost danger"
                              onClick={removeProfileImage}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="field-label">
                    Professional summary
                    <textarea
                      rows={5}
                      value={personalInfo.summary}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          summary: e.target.value,
                        })
                      }
                      placeholder="Write a concise 2–3 sentence summary highlighting your background, strengths, and career direction."
                    />
                  </label>
                </section>
              )}

              {activeSection === "summary" && (
                <div className="resume-color-picker form-card-inline">
                  <div>
                    <strong>Template color</strong>
                    <p className="text-muted small">Choose an accent color. It is saved with this resume.</p>
                  </div>
                  <div className="color-options">
                    {TEMPLATE_COLORS.map((c) => (
                      <button key={c.id} type="button" className={`color-option ${color === c.id ? "selected" : ""}`} onClick={() => setColor(c.id)} title={c.name} aria-label={`Use ${c.name} color`}>
                        <span style={{ background: c.value }} />
                        {color === c.id && <b>✓</b>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "education" && (
                <section>
                  {education.length === 0 && (
                    <div
                      className="empty-state"
                      style={{ padding: "38px 20px", marginBottom: 18 }}
                    >
                      <div className="empty-icon">⌂</div>
                      <h2>No education added yet</h2>
                      <p>
                        Add your university, degree, field of study, and
                        dates.
                      </p>
                    </div>
                  )}

                  {education.map((edu, i) => (
                    <div className="repeatable-block" key={i}>
                      <div className="form-grid">
                        <label className="field-label">
                          School / University{" "}
                          <span className="required-mark">*</span>
                          <input
                            className={
                              errors[`edu.${i}.school`] ? "field-invalid" : ""
                            }
                            value={edu.school}
                            onChange={(e) =>
                              updateListItem(
                                education,
                                setEducation,
                                i,
                                "school",
                                e.target.value
                              )
                            }
                            placeholder="University or institution"
                          />
                          {errors[`edu.${i}.school`] && (
                            <span className="field-error-text">
                              {errors[`edu.${i}.school`]}
                            </span>
                          )}
                        </label>

                        <label className="field-label">
                          Degree <span className="required-mark">*</span>
                          <input
                            className={
                              errors[`edu.${i}.degree`] ? "field-invalid" : ""
                            }
                            value={edu.degree}
                            onChange={(e) =>
                              updateListItem(
                                education,
                                setEducation,
                                i,
                                "degree",
                                e.target.value
                              )
                            }
                            placeholder="BS Computer Science"
                          />
                          {errors[`edu.${i}.degree`] && (
                            <span className="field-error-text">
                              {errors[`edu.${i}.degree`]}
                            </span>
                          )}
                        </label>

                        <label className="field-label">
                          Field of study
                          <input
                            value={edu.field}
                            onChange={(e) =>
                              updateListItem(
                                education,
                                setEducation,
                                i,
                                "field",
                                e.target.value
                              )
                            }
                            placeholder="Computer Science"
                          />
                        </label>

                        <label className="field-label">
                          Grade / GPA
                          <input
                            value={edu.grade}
                            onChange={(e) =>
                              updateListItem(
                                education,
                                setEducation,
                                i,
                                "grade",
                                e.target.value
                              )
                            }
                            placeholder="3.7 / 4.0"
                          />
                        </label>
                      </div>

                      <DateRangeFields
                        startDate={edu.start_date}
                        endDate={edu.end_date}
                        current={false}
                        required
                        showCurrent={false}
                        errors={{
                          start: errors[`edu.${i}.start`],
                          end: errors[`edu.${i}.end`],
                        }}
                        onStartChange={(v) =>
                          updateListItem(
                            education,
                            setEducation,
                            i,
                            "start_date",
                            v
                          )
                        }
                        onEndChange={(v) =>
                          updateListItem(
                            education,
                            setEducation,
                            i,
                            "end_date",
                            v
                          )
                        }
                        onCurrentChange={(v) => {
                          setEducation((current) => current.map((item, index) =>
                            index === i ? { ...item, current: v, end_date: v ? "" : item.end_date } : item
                          ));
                        }}
                      />

                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={() =>
                          removeListItem(education, setEducation, i)
                        }
                      >
                        Remove education
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setEducation([...education, { ...emptyEducation }])
                    }
                  >
                    + Add education
                  </button>
                </section>
              )}

              {activeSection === "experience" && (
                <section>
                  {experience.length === 0 && (
                    <div
                      className="empty-state"
                      style={{ padding: "38px 20px", marginBottom: 18 }}
                    >
                      <div className="empty-icon">✦</div>
                      <h2>No experience added yet</h2>
                      <p>
                        Add internships, jobs, freelance work, or relevant
                        experience.
                      </p>
                    </div>
                  )}

                  {experience.map((exp, i) => (
                    <div className="repeatable-block" key={i}>
                      <div className="form-grid">
                        <label className="field-label">
                          Company <span className="required-mark">*</span>
                          <input
                            className={
                              errors[`exp.${i}.company`]
                                ? "field-invalid"
                                : ""
                            }
                            value={exp.company}
                            onChange={(e) =>
                              updateListItem(
                                experience,
                                setExperience,
                                i,
                                "company",
                                e.target.value
                              )
                            }
                            placeholder="Company name"
                          />
                          {errors[`exp.${i}.company`] && (
                            <span className="field-error-text">
                              {errors[`exp.${i}.company`]}
                            </span>
                          )}
                        </label>

                        <label className="field-label">
                          Role / Title <span className="required-mark">*</span>
                          <input
                            className={
                              errors[`exp.${i}.role`] ? "field-invalid" : ""
                            }
                            value={exp.role}
                            onChange={(e) =>
                              updateListItem(
                                experience,
                                setExperience,
                                i,
                                "role",
                                e.target.value
                              )
                            }
                            placeholder="Python Intern"
                          />
                          {errors[`exp.${i}.role`] && (
                            <span className="field-error-text">
                              {errors[`exp.${i}.role`]}
                            </span>
                          )}
                        </label>
                      </div>

                      <DateRangeFields
                        startDate={exp.start_date}
                        endDate={exp.end_date}
                        current={exp.current}
                        required
                        currentLabel="I currently work here"
                        errors={{
                          start: errors[`exp.${i}.start`],
                          end: errors[`exp.${i}.end`],
                        }}
                        onStartChange={(v) =>
                          updateListItem(
                            experience,
                            setExperience,
                            i,
                            "start_date",
                            v
                          )
                        }
                        onEndChange={(v) =>
                          updateListItem(
                            experience,
                            setExperience,
                            i,
                            "end_date",
                            v
                          )
                        }
                        onCurrentChange={(v) => {
                          setExperience((current) => current.map((item, index) =>
                            index === i ? { ...item, current: v, end_date: v ? "" : item.end_date } : item
                          ));
                        }}
                      />

                      <label className="field-label">
                        Description
                        <textarea
                          rows={4}
                          value={exp.description}
                          onChange={(e) =>
                            updateListItem(
                              experience,
                              setExperience,
                              i,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Describe your responsibilities, technologies, and measurable impact."
                        />
                      </label>

                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={() =>
                          removeListItem(experience, setExperience, i)
                        }
                      >
                        Remove experience
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setExperience([...experience, { ...emptyExperience }])
                    }
                  >
                    + Add experience
                  </button>
                </section>
              )}

              {activeSection === "skills" && (
                <section>
                  <div className="skill-input-row">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="e.g. Python, FastAPI, React, PostgreSQL"
                      aria-label="Add a skill"
                    />

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={addSkill}
                    >
                      Add skill
                    </button>
                  </div>

                  <div className="skill-chips">
                    {skills.map((skill) => (
                      <span className="chip" key={skill}>
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {skills.length === 0 && (
                      <p className="text-muted">
                        Add skills one at a time. Press Enter to add
                        quickly.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {activeSection === "projects" && (
                <section>
                  {projects.length === 0 && (
                    <div
                      className="empty-state"
                      style={{ padding: "38px 20px", marginBottom: 18 }}
                    >
                      <div className="empty-icon">◆</div>
                      <h2>No projects added yet</h2>
                      <p>
                        Highlight projects that demonstrate your strongest
                        technical work.
                      </p>
                    </div>
                  )}

                  {projects.map((proj, i) => (
                    <div className="repeatable-block" key={i}>
                      <div className="form-grid">
                        <label className="field-label">
                          Project title{" "}
                          <span className="required-mark">*</span>
                          <input
                            className={
                              errors[`proj.${i}.title`]
                                ? "field-invalid"
                                : ""
                            }
                            value={proj.title}
                            onChange={(e) =>
                              updateListItem(
                                projects,
                                setProjects,
                                i,
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="Resume Builder"
                          />
                          {errors[`proj.${i}.title`] && (
                            <span className="field-error-text">
                              {errors[`proj.${i}.title`]}
                            </span>
                          )}
                        </label>

                        <label className="field-label">
                          Project link
                          <input
                            value={proj.link}
                            onChange={(e) =>
                              updateListItem(
                                projects,
                                setProjects,
                                i,
                                "link",
                                e.target.value
                              )
                            }
                            placeholder="https://github.com/..."
                          />
                        </label>

                        <label
                          className="field-label"
                          style={{ gridColumn: "1 / -1" }}
                        >
                          Tech stack
                          <input
                            value={proj.tech_stack}
                            onChange={(e) =>
                              updateListItem(
                                projects,
                                setProjects,
                                i,
                                "tech_stack",
                                e.target.value
                              )
                            }
                            placeholder="React, FastAPI, SQLite"
                          />
                        </label>
                      </div>

                      <label className="field-label">
                        Description
                        <textarea
                          rows={4}
                          value={proj.description}
                          onChange={(e) =>
                            updateListItem(
                              projects,
                              setProjects,
                              i,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Explain what you built, the technologies you used, and the result."
                        />
                      </label>

                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={() =>
                          removeListItem(projects, setProjects, i)
                        }
                      >
                        Remove project
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setProjects([...projects, { ...emptyProject }])
                    }
                  >
                    + Add project
                  </button>
                </section>
              )}
            </div>

            <div className="form-nav">
              <button
                className="btn-secondary"
                type="button"
                disabled={step === 0}
                onClick={previousStep}
              >
                ← Previous
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={nextStep}
                >
                  Next: {nextStepInfo?.short || "Next"} →
                </button>
              ) : (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save & preview"}
                </button>
              )}
            </div>
          </div>

          {showPreview && (
            <aside className="resume-live-preview no-print">
              <div className="resume-live-preview-scroll" ref={livePreviewScrollRef}>
                <div
                  className="resume-live-preview-stage"
                  style={{
                    "--live-preview-scale": livePreviewScale,
                    "--live-preview-width": `${Math.ceil(794 * livePreviewScale)}px`,
                    "--live-preview-height": `${Math.ceil(livePreviewStageHeight)}px`,
                  }}
                >
                  <div ref={livePreviewDocumentRef} className="resume-live-preview-scale">
                    <ResumeDocument resume={{ ...liveResume, color }} templateId={template} />
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
