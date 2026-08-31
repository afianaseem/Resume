import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminGetResume } from "../api/resumes";
import Navbar from "../components/Navbar";
import ResumeDocument from "../components/ResumeDocument";
import { getTemplate } from "../templates";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

async function makePdfBlob(element) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: 794,
    windowHeight: Math.max(
      1123,
      element.scrollHeight
    ),
    scrollX: 0,
    scrollY: 0,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;

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

    if (sourceHeight <= 2) continue;

    const pageCanvas =
      document.createElement("canvas");

    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;

    const context = pageCanvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Could not prepare the PDF page."
      );
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
      pageCanvas.width,
      pageCanvas.height
    );

    if (page > 0) {
      pdf.addPage();
    }

    const imageHeight =
      (sourceHeight * pageWidth) /
      canvas.width;

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

export default function AdminResumePreview() {
  const { id } = useParams();

  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [resumeScale, setResumeScale] =
    useState(1);

  const [resumeStageHeight, setResumeStageHeight] =
    useState(1123);

  const screenResumeRef = useRef(null);

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth =
        document.documentElement.clientWidth ||
        window.innerWidth;

      const availableWidth = Math.max(
        280,
        viewportWidth - 24
      );

      setResumeScale(
        Math.min(
          1,
          availableWidth / 794
        )
      );
    };

    updateScale();

    window.addEventListener(
      "resize",
      updateScale
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );
    };
  }, []);

  useEffect(() => {
    const element = screenResumeRef.current;

    if (!element) return undefined;

    const measure = () => {
      const height = Math.max(
        1123,
        element.scrollHeight || 1123
      );

      setResumeStageHeight(
        Math.ceil(
          height * resumeScale
        )
      );
    };

    const frame =
      requestAnimationFrame(measure);

    const observer =
      new ResizeObserver(measure);

    observer.observe(element);

    window.addEventListener(
      "resize",
      measure
    );

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();

      window.removeEventListener(
        "resize",
        measure
      );
    };
  }, [resume, resumeScale]);

  useEffect(() => {
    let mounted = true;

    adminGetResume(id)
      .then((data) => {
        if (!mounted) return;

        setResume(data);
        setError("");
      })
      .catch((err) => {
        if (!mounted) return;

        setError(
          err.response?.data?.detail ||
            "Could not load this resume."
        );
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
              to="/admin"
              className="btn-primary"
            >
              Back to admin dashboard
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

            <p>Loading resume...</p>
          </div>
        </main>
      </div>
    );
  }

  const templateId =
    resume.template || "classic";

  const templateInfo =
    getTemplate(templateId);

  const downloadPdf = async () => {
    setPdfBusy(true);
    setPdfError("");

    try {
      const element =
        screenResumeRef.current;

      if (!element) {
        throw new Error(
          "Resume preview is not ready."
        );
      }

      await new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(resolve)
        )
      );

      const blob =
        await makePdfBlob(element);

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        `${
          (
            resume.name ||
            "resume"
          )
            .replace(
              /[^a-z0-9 _-]/gi,
              ""
            )
            .trim() || "resume"
        }.pdf`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(
        "Could not generate the PDF. Please try again."
      );
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="app-shell preview-page admin-resume-preview-page">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="page-content preview-page-content admin-preview-content">
        <div className="admin-preview-toolbar no-print">
          <div className="admin-preview-heading">
            <Link
              to="/admin"
              className="back-link"
            >
              ← Back to admin dashboard
            </Link>

            <div className="admin-preview-title-row">
              <div>
                <span className="admin-preview-kicker">
                  READ-ONLY RESUME VIEW
                </span>

                <h1 className="preview-title">
                  {resume.name ||
                    "Untitled resume"}
                </h1>

                <p className="preview-subtitle">
                  Owned by{" "}
                  <strong>
                    {resume.owner_name ||
                      "Unknown user"}
                  </strong>{" "}
                  (
                  {resume.owner_email ||
                    "No email"}
                  )
                </p>
              </div>

              <div className="admin-preview-template-badge">
                <span
                  className="admin-preview-template-dot"
                  style={{
                    backgroundColor:
                      resume.color
                        ? (
                            getTemplateColorForPreview(
                              resume.color
                            )
                          )
                        : "#6d3df5",
                  }}
                />

                {templateInfo.name}
              </div>
            </div>
          </div>

          <div className="admin-preview-actions">
            <Link
              to="/admin"
              className="admin-preview-back-button"
            >
              ← Dashboard
            </Link>

            <button
              type="button"
              className="btn-primary"
              onClick={downloadPdf}
              disabled={pdfBusy}
            >
              {pdfBusy
                ? "Generating PDF..."
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

        <div className="admin-preview-document-shell">
          <div
            className="resume-mobile-stage admin-preview-stage"
            style={{
              "--resume-stage-width": `${Math.ceil(
                794 * resumeScale
              )}px`,
              "--resume-stage-height": `${Math.ceil(
                resumeStageHeight
              )}px`,
            }}
          >
            <div
              ref={screenResumeRef}
              className="resume-mobile-document"
              style={{
                "--resume-scale": resumeScale,
              }}
            >
              <ResumeDocument
                resume={resume}
                templateId={templateId}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getTemplateColorForPreview(id) {
  const colors = {
    violet: "#6d3df5",
    blue: "#2563eb",
    green: "#059669",
    rose: "#e11d48",
  };

  return colors[id] || "#6d3df5";
}
