import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getResume, updateResume, shareResume } from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

const DUMMY_RESUME_DATA = {
  personal_info: {
    full_name: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    phone: "+92 300 1234567",
    address: "Lahore, Pakistan",
    summary:
      "Product-focused software developer with 4+ years of experience building responsive web applications, improving user experiences, and collaborating with cross-functional teams.",
    profile_image: "",
  },

  education: [
    {
      degree: "BS Computer Science",
      field: "",
      school: "University of the Punjab",
      start_date: "2017-09-01",
      end_date: "2021-06-01",
      current: false,
      grade: "CGPA 3.7 / 4.0",
    },
  ],

  experience: [
    {
      role: "Frontend Developer",
      company: "TechNova Solutions",
      start_date: "2022-01-01",
      end_date: "2026-05-01",
      current: false,
      description:
        "Built responsive React applications, improved page performance by 35%, and worked with designers and backend engineers to deliver customer-facing features.",
    },
    {
      role: "Junior Web Developer",
      company: "Digital Works",
      start_date: "2021-07-01",
      end_date: "2021-12-01",
      current: false,
      description:
        "Developed reusable UI components and maintained accessible, mobile-first interfaces for multiple client projects.",
    },
  ],

  skills: [
    "React",
    "JavaScript",
    "TypeScript",
    "HTML & CSS",
    "REST APIs",
    "Git",
  ],

  projects: [
    {
      title: "Resume Builder",
      tech_stack: "React · FastAPI · PostgreSQL",
      description:
        "Created a responsive resume builder with live preview, reusable templates, and PDF export.",
      link: "https://example.com",
    },
  ],

  section_order: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
  ],
};

function withDummyData(data) {
  const hasContent =
    data?.personal_info?.summary ||
    data?.personal_info?.full_name ||
    data?.experience?.length ||
    data?.education?.length ||
    data?.skills?.length ||
    data?.projects?.length;

  if (hasContent) {
    return data;
  }

  return {
    ...data,
    ...DUMMY_RESUME_DATA,
    personal_info: {
      ...DUMMY_RESUME_DATA.personal_info,
    },
    education: [...DUMMY_RESUME_DATA.education],
    experience: [...DUMMY_RESUME_DATA.experience],
    skills: [...DUMMY_RESUME_DATA.skills],
    projects: [...DUMMY_RESUME_DATA.projects],
    section_order: [...DUMMY_RESUME_DATA.section_order],
    _dummyPreview: true,
  };
}

function ShareModal({ resumeName, onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();

    if (!trimmed) {
      setError("Please enter an email address.");
      return;
    }

    if (!EMAIL_RE.test(trimmed)) {
      setError(
        "Please enter a complete email address, e.g. name@example.com"
      );
      return;
    }

    setSending(true);

    try {
      await onSend(trimmed, message.trim());
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not send the email. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Share resume via email"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {sent ? (
          <div className="modal-success">
            <div className="modal-success-icon">✓</div>

            <h3>Sent!</h3>

            <p>
              <strong>{resumeName}</strong> has been emailed to {email}.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3>Share via email</h3>

            <p
              className="text-muted small"
              style={{ marginTop: 4 }}
            >
              We'll email a PDF copy of{" "}
              <strong>{resumeName}</strong> to the address below.
            </p>

            {error && (
              <div className="form-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <label className="field-label">
              Recipient email{" "}
              <span className="required-mark">*</span>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoFocus
                required
              />
            </label>

            <label className="field-label">
              Add a note (optional)

              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi — here's my resume for..."
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={sending}
              >
                {sending ? "Sending…" : "Send email"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/*
 * Wait until fonts and images are ready.
 *
 * This is important because html2canvas can otherwise capture the
 * document before the fonts/profile image/template assets have loaded.
 */
async function waitForResumeAssets(element) {
  if (!element) return;

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if the browser does not support document.fonts.
    }
  }

  const images = Array.from(element.querySelectorAll("img"));

  if (!images.length) {
    return;
  }

  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };

          img.addEventListener("load", done);
          img.addEventListener("error", done);

          setTimeout(done, 5000);
        })
    )
  );
}

/*
 * Render an A4 document into a PDF.
 *
 * IMPORTANT:
 * This function renders ONLY the dedicated PDF renderer.
 * It does not render the mobile preview.
 */
async function makePdfBlob(element) {
  if (!element) {
    throw new Error("Resume PDF renderer is not ready.");
  }

  /*
   * Make sure the browser has completed layout before html2canvas
   * starts taking the screenshot.
   */
  await new Promise((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )
  );

  await waitForResumeAssets(element);

  const rect = element.getBoundingClientRect();

  const width = Math.max(
    794,
    Math.ceil(element.scrollWidth || rect.width || 794)
  );

  const height = Math.max(
    1123,
    Math.ceil(element.scrollHeight || rect.height || 1123)
  );

  /*
   * html2canvas must receive a real, visible layout box.
   * The CSS for .pdf-export-host therefore keeps this element
   * rendered but moves it far outside the visible viewport.
   */
  const canvas = await html2canvas(element, {
    scale: 2,

    useCORS: true,

    allowTaint: false,

    backgroundColor: "#ffffff",

    logging: false,

    width,

    height,

    windowWidth: 794,

    windowHeight: Math.max(1123, height),

    scrollX: 0,

    scrollY: 0,

    imageTimeout: 15000,
  });

  if (!canvas || canvas.width < 10 || canvas.height < 10) {
    throw new Error("The resume could not be rendered.");
  }

  /*
   * Create A4 PDF.
   */
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;

  /*
   * Convert A4 height into pixels based on the captured canvas width.
   */
  const pagePixelHeight = Math.floor(
    (canvas.width * pageHeight) / pageWidth
  );

  const pageCount = Math.max(
    1,
    Math.ceil(canvas.height / pagePixelHeight)
  );

  for (let page = 0; page < pageCount; page += 1) {
    const sourceY = page * pagePixelHeight;

    const sourceHeight = Math.min(
      pagePixelHeight,
      canvas.height - sourceY
    );

    if (sourceHeight <= 2) {
      continue;
    }

    const pageCanvas = document.createElement("canvas");

    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;

    const context = pageCanvas.getContext("2d");

    if (!context) {
      throw new Error("Could not prepare the PDF page.");
    }

    context.fillStyle = "#ffffff";

    context.fillRect(
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    context.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sourceHeight,
      0,
      0,
      canvas.width,
      sourceHeight
    );

    if (page > 0) {
      pdf.addPage();
    }

    const imageHeight =
      (sourceHeight * pageWidth) / canvas.width;

    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.96),
      "JPEG",
      0,
      0,
      pageWidth,
      imageHeight,
      undefined,
      "FAST"
    );
  }

  return pdf.output("blob");
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

export default function ResumePreview() {
  const { id } = useParams();

  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");

  const [showShare, setShowShare] = useState(false);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [resumeScale, setResumeScale] = useState(1);
  const [resumeStageHeight, setResumeStageHeight] =
    useState(1123);

  /*
   * Visible mobile/desktop preview.
   */
  const screenResumeRef = useRef(null);

  /*
   * Separate renderer used ONLY for PDF/email.
   */
  const pdfExportRef = useRef(null);

  /*
   * Calculate responsive scale.
   *
   * The actual resume remains 794px wide.
   * On smaller screens only the visual transform changes.
   */
  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        document.documentElement.clientWidth ||
        window.innerWidth;

      const available = Math.max(
        280,
        viewportWidth - 24
      );

      setResumeScale(
        Math.min(1, available / 794)
      );
    };

    updateScale();

    window.addEventListener("resize", updateScale);

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );
    };
  }, []);

  /*
   * Measure the real A4 document height.
   *
   * This keeps the mobile stage from cutting off long resumes.
   */
  useEffect(() => {
    const element = screenResumeRef.current;

    if (!element) {
      return undefined;
    }

    const measure = () => {
      const height = Math.max(
        1123,
        element.scrollHeight || 1123
      );

      setResumeStageHeight(
        Math.ceil(height * resumeScale)
      );
    };

    const frame =
      requestAnimationFrame(measure);

    let observer = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element);
    }

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);

      if (observer) {
        observer.disconnect();
      }

      window.removeEventListener(
        "resize",
        measure
      );
    };
  }, [resume, resumeScale]);

  /*
   * Load resume.
   */
  useEffect(() => {
    let mounted = true;

    getResume(id)
      .then((data) => {
        if (!mounted) return;

        setResume(withDummyData(data));
        setError("");
      })
      .catch(() => {
        if (!mounted) return;

        setError("Could not load this resume.");
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="app-shell">
        <Navbar />

        <main className="page-content">
          <div className="error-card">
            <div className="error-icon">!</div>

            <h2>Something went wrong</h2>

            <p>{error}</p>

            <Link
              to="/dashboard"
              className="btn-primary"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="app-shell">
        <Navbar />

        <main className="page-content">
          <div className="loading-card">
            <div className="loading-spinner" />

            <p>Loading your resume...</p>
          </div>
        </main>
      </div>
    );
  }

  const templateId =
    resume.template || "classic";

  /*
   * Handle inline changes made directly on the resume.
   */
  const handleResumeChange = (next) => {
    setResume(next);
    setDirty(true);
    setSaveMessage("");
  };

  /*
   * Save inline changes.
   */
  const saveInlineChanges = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      const payload = {
        name: resume.name,

        template:
          resume.template || "classic",

        color:
          resume.color || "violet",

        personal_info:
          resume.personal_info || {},

        education:
          resume.education || [],

        experience:
          resume.experience || [],

        skills: (resume.skills || []).filter(
          Boolean
        ),

        projects:
          resume.projects || [],

        section_order:
          resume.section_order || [
            "summary",
            "experience",
            "education",
            "skills",
            "projects",
          ],
      };

      const saved = await updateResume(
        id,
        payload
      );

      setResume(saved);
      setDirty(false);
      setSaveMessage("Saved");
    } catch (e) {
      setSaveMessage(
        e.response?.data?.detail ||
          "Could not save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Create the PDF from the dedicated PDF renderer.
   */
  const createPdf = async () => {
    const element =
      pdfExportRef.current;

    if (!element) {
      throw new Error(
        "Resume PDF renderer is not ready."
      );
    }

    /*
     * Explicitly force a browser layout calculation.
     *
     * This is important because the PDF renderer is outside
     * the visible mobile preview.
     */
    element.getBoundingClientRect();

    await new Promise((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(resolve)
      )
    );

    return makePdfBlob(element);
  };

  /*
   * Download PDF.
   */
  const downloadPdf = async () => {
    setPdfBusy(true);
    setPdfError("");

    try {
      const blob = await createPdf();

      const url =
        URL.createObjectURL(blob);

      const filename =
        (
          resume.name ||
          "resume"
        )
          .replace(
            /[^a-z0-9 _-]/gi,
            ""
          )
          .trim() || "resume";

      const a =
        document.createElement("a");

      a.href = url;
      a.download = `${filename}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      /*
       * Give the browser a moment before
       * destroying the object URL.
       */
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      console.error(
        "PDF generation error:",
        e
      );

      setPdfError(
        "Could not generate the PDF. Please try again."
      );
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="app-shell preview-page">
      {/*
       * Navbar is not printed.
       */}
      <div className="no-print">
        <Navbar />
      </div>

      <main className="page-content preview-page-content">
        {/*
         * Screen-only toolbar.
         */}
        <div className="preview-toolbar no-print">
          <div>
            <Link
              to="/dashboard"
              className="back-link"
            >
              ← Back to dashboard
            </Link>

            <h1 className="preview-title">
              {resume.name}
            </h1>

            <p className="preview-subtitle">
              Click any highlighted text on the
              resume to edit it directly. Changes
              are saved with{" "}
              <strong>
                Save changes
              </strong>
              .
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className={`btn-secondary ${
                dirty ? "save-needed" : ""
              }`}
              onClick={saveInlineChanges}
              disabled={
                !dirty || saving
              }
            >
              {saving
                ? "Saving…"
                : dirty
                ? "✓ Save changes"
                : "✓ Saved"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setShowShare(true)
              }
            >
              ✉ Share
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={downloadPdf}
              disabled={pdfBusy}
            >
              {pdfBusy
                ? "Generating PDF…"
                : "⤓ Download PDF"}
            </button>
          </div>
        </div>

        {pdfError && (
          <div
            className="form-error no-print"
            role="alert"
          >
            <span>!</span>
            {pdfError}
          </div>
        )}

        {saveMessage && (
          <div
            className={`inline-save-message no-print ${
              saveMessage === "Saved"
                ? "success"
                : ""
            }`}
            role="status"
          >
            {saveMessage}
          </div>
        )}

        {resume._dummyPreview && (
          <div className="dummy-hint no-print">
            <strong>
              Edit directly on the resume:
            </strong>{" "}
            tap/click any highlighted field,
            type your changes, then press{" "}
            <strong>
              Save changes
            </strong>
            .
          </div>
        )}

        {/*
         * ============================================================
         * VISIBLE RESPONSIVE RESUME
         * ============================================================
         *
         * This is ONLY for the user interface.
         * It is scaled on mobile.
         */}
        <div
          className="resume-mobile-stage"
          style={{
            "--resume-scale":
              resumeScale,

            "--resume-stage-width":
              `${Math.ceil(
                794 * resumeScale
              )}px`,

            "--resume-stage-height":
              `${Math.ceil(
                resumeStageHeight
              )}px`,
          }}
        >
          <div
            ref={screenResumeRef}
            className="resume-mobile-document"
          >
            <ResumeDocument
              resume={resume}
              templateId={templateId}
              editable
              onChange={
                handleResumeChange
              }
            />
          </div>
        </div>

        {/*
         * ============================================================
         * DEDICATED PDF RENDERER
         * ============================================================
         *
         * IMPORTANT:
         *
         * This is NOT display:none.
         * It is NOT opacity:0.
         * It is NOT z-index:-1.
         *
         * It remains a real rendered DOM element but is positioned
         * far outside the viewport.
         *
         * html2canvas can therefore render it correctly.
         *
         * This fixes the blank PDF/email problem.
         */}
        <div
          className="pdf-export-host"
          aria-hidden="true"
        >
          <div
            ref={pdfExportRef}
            className="pdf-export-document"
          >
            <ResumeDocument
              resume={resume}
              templateId={templateId}
            />
          </div>
        </div>
      </main>

      {showShare && (
        <ShareModal
          resumeName={resume.name}
          onClose={() =>
            setShowShare(false)
          }
          onSend={async (
            email,
            message
          ) => {
            /*
             * Generate the exact same PDF used
             * by the Download PDF button.
             */
            const blob =
              await createPdf();

            if (
              !blob ||
              blob.size === 0
            ) {
              throw new Error(
                "Generated PDF is empty."
              );
            }

            const pdfBase64 =
              await blobToBase64(
                blob
              );

            /*
             * Send the generated PDF to the backend.
             */
            return shareResume(
              id,
              email,
              message,
              pdfBase64
            );
          }}
        />
      )}
    </div>
  );
}
