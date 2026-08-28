import { useEffect, useState } from "react";
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
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Browser layout can leave a few white pixels below the A4 resume.
  // Trim only the trailing all-white rows so they never become a blank PDF page.
  const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
  let contentHeight = canvas.height;
  if (pixels) {
    for (let y = canvas.height - 1; y >= 0; y -= 1) {
      let hasInk = false;
      const row = y * canvas.width * 4;
      for (let x = 0; x < canvas.width; x += 4) {
        const i = row + x * 4;
        if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) {
          hasInk = true;
          break;
        }
      }
      if (hasInk) {
        contentHeight = y + 1;
        break;
      }
    }
  }
  const pageWidth = 210;
  const pageHeight = 297;
  const pagePixelHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
  const pageCount = Math.max(1, Math.ceil(contentHeight / pagePixelHeight));

  for (let page = 0; page < pageCount; page += 1) {
    const sourceY = page * pagePixelHeight;
    const sourceHeight = Math.min(pagePixelHeight, contentHeight - sourceY);
    if (sourceHeight <= 2) continue;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;

    const context = pageCanvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the PDF page.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
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

    if (page > 0) pdf.addPage();

    const imageHeight = (sourceHeight * pageWidth) / canvas.width;
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.94),
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

/**
 * Read-only resume viewer for administrators. Reuses the same
 * ResumeDocument renderer as the normal preview page, but the toolbar
 * only offers "view / download" actions — there is no editing, sharing,
 * or template switching here, since this isn't the admin's resume.
 */
export default function AdminResumePreview() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    let mounted = true;

    adminGetResume(id)
      .then((data) => {
        if (mounted) {
          setResume(data);
          setError("");
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err.response?.data?.detail || "Could not load this resume."
          );
        }
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
            <Link to="/admin" className="btn-primary">
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

  const templateId = resume.template || "classic";
  const templateInfo = getTemplate(templateId);

  const downloadPdf = async () => {
    setPdfBusy(true);
    setPdfError("");
    try {
      const element = document.querySelector(".preview-page .resume-print-area");
      if (!element) throw new Error("Resume preview is not ready.");
      const blob = await makePdfBlob(element);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(resume.name || "resume").replace(/[^a-z0-9 _-]/gi, "").trim() || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError("Could not generate the PDF. Please try again.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="app-shell preview-page">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="page-content preview-page-content">
        <div className="preview-toolbar no-print admin-preview-toolbar">
          <div>
            <Link to="/admin" className="back-link">
              ← Back to admin dashboard
            </Link>

            <h1 className="preview-title">{resume.name}</h1>

            <p className="preview-subtitle">
              Viewing as administrator — owned by{" "}
              <strong>{resume.owner_name}</strong> ({resume.owner_email}).
              This is a read-only view.
            </p>
          </div>

          <div className="header-actions">
            <span className="admin-viewing-badge">▦ {templateInfo.name} template</span>

            <button
              type="button"
              className="btn-primary"
              onClick={downloadPdf}
              disabled={pdfBusy}
            >
              {pdfBusy ? "Generating PDF…" : "⤓ Download PDF"}
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="form-error no-print" role="alert">
            <span>!</span>
            {pdfError}
          </div>
        )}

        <ResumeDocument resume={resume} templateId={templateId} />
      </main>
    </div>
  );
}
