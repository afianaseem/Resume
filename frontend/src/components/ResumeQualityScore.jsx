import { useMemo } from "react";

function check(label, passed, detail) {
  return { label, passed, detail };
}

function getScoreLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Needs improvement";
  return "Getting started";
}

export default function ResumeQualityScore({ personalInfo, education, experience, skills, projects, template }) {
  const result = useMemo(() => {
    const summary = String(personalInfo?.summary || "").trim();
    const hasContact = Boolean(
      String(personalInfo?.full_name || "").trim() &&
      String(personalInfo?.email || "").trim() &&
      String(personalInfo?.phone || "").trim()
    );
    const hasUsefulSummary = summary.length >= 50;
    const hasExperience = experience.length > 0;
    const hasStrongExperience = hasExperience && experience.every((item) => String(item.description || "").trim().length >= 60);
    const hasCompleteDates = [...education, ...experience].every((item) => item.current || (item.start_date && item.end_date));
    const hasSkills = skills.filter(Boolean).length >= 3;
    const hasProjects = projects.length === 0 || projects.some((item) => String(item.description || "").trim().length >= 40);
    const atsReady = template === "ats";

    const checks = [
      check("Contact details complete", hasContact, "Add your name, email, and phone number."),
      check("Professional summary", hasUsefulSummary, summary ? "Aim for at least 50 characters with your focus and strengths." : "Add a concise 2–3 sentence summary."),
      check("Experience descriptions", hasStrongExperience, hasExperience ? "Add measurable responsibilities or achievements to each role." : "Add at least one experience entry when relevant."),
      check("Dates are complete", hasCompleteDates, "Complete the start and end date for every education and experience entry."),
      check("Skills included", hasSkills, "Add at least three relevant skills."),
      check("Project detail", hasProjects, "Add a useful description to at least one project."),
      check("ATS-friendly format", atsReady, "The ATS Friendly template is easiest for applicant tracking systems to parse."),
    ];

    const score = Math.round((checks.filter((item) => item.passed).length / checks.length) * 100);
    return { score, checks };
  }, [personalInfo, education, experience, skills, projects, template]);

  return (
    <section className="resume-quality-panel" aria-label="Resume quality score">
      <div className="resume-quality-heading">
        <div>
          <span className="eyebrow">RESUME CHECK</span>
          <h2>Quality score</h2>
        </div>
        <div className="resume-quality-score">
          <strong>{result.score}</strong><span>/100</span>
          <small>{getScoreLabel(result.score)}</small>
        </div>
      </div>

      <div className="resume-quality-progress" aria-hidden="true">
        <span style={{ width: `${result.score}%` }} />
      </div>

      <ul className="resume-quality-list">
        {result.checks.map((item) => (
          <li className={item.passed ? "passed" : "needs-work"} key={item.label}>
            <span aria-hidden="true">{item.passed ? "✓" : "!"}</span>
            <div><strong>{item.label}</strong><small>{item.passed ? "Looks good" : item.detail}</small></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
