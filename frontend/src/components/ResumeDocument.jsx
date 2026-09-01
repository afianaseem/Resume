import { getTemplate, isSidebarTemplate, getColor } from "../templates";

/* =========================================================
   DATE HELPERS
   ========================================================= */

export function formatResumeDate(value) {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [, year, month] = match;

  return months[parseInt(month, 10) - 1]
    ? `${months[parseInt(month, 10) - 1]} ${year}`
    : value;
}

function dateRange(item) {
  if (item?.date_display) {
    return item.date_display;
  }

  const start = formatResumeDate(item?.start_date);

  const end = item?.current
    ? "Present"
    : formatResumeDate(item?.end_date);

  return [start, end].filter(Boolean).join(" – ");
}

/* =========================================================
   EDITABLE TEXT
   ========================================================= */

function Editable({
  value,
  onChange,
  className = "",
  placeholder = "Click to edit",
  multiline = false,
}) {
  return (
    <span
      className={`resume-inline-edit ${className}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      data-placeholder={placeholder}
      spellCheck={multiline}
      onBlur={(e) => {
        onChange?.(e.currentTarget.innerText.trim());
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {value || ""}
    </span>
  );
}

/* =========================================================
   EDITABLE DATE
   ========================================================= */

function EditableDate({ item, onChange }) {
  const value = dateRange(item);

  return (
    <Editable
      value={value}
      onChange={onChange}
      className="resume-date resume-edit-date"
      placeholder="Dates e.g. Jan 2022 – May 2026"
    />
  );
}

/* =========================================================
   SUMMARY
   ========================================================= */

function SummarySection({
  summary,
  number,
  editable,
  update,
}) {
  if (!summary && !editable) return null;

  return (
    <section className="resume-section">
      <div className="resume-section-heading">
        <span className="section-number">{number}</span>
        <h2>Professional Summary</h2>
      </div>

      {editable ? (
        <Editable
          value={summary}
          onChange={update}
          className="resume-summary resume-edit-block"
          placeholder="Click to add your professional summary"
          multiline
        />
      ) : (
        <p className="resume-summary">{summary}</p>
      )}
    </section>
  );
}

/* =========================================================
   EXPERIENCE
   ========================================================= */

function ExperienceSection({
  experience,
  number,
  editable,
  update,
}) {
  if (!experience.length && !editable) return null;

  const items = experience.length
    ? experience
    : [
        {
          role: "",
          company: "",
          description: "",
          start_date: "",
          end_date: "",
          current: false,
        },
      ];

  return (
    <section className="resume-section">
      <div className="resume-section-heading">
        <span className="section-number">{number}</span>
        <h2>Experience</h2>
      </div>

      <div className="resume-items">
        {items.map((exp, index) => (
          <div className="resume-item" key={index}>
            <div className="resume-item-top">
              <div className="resume-item-main">
                {editable ? (
                  <Editable
                    value={exp.role}
                    onChange={(value) =>
                      update(index, "role", value)
                    }
                    className="resume-edit-heading"
                    placeholder="Job title"
                  />
                ) : (
                  <h3>{exp.role || "Role"}</h3>
                )}

                {editable ? (
                  <Editable
                    value={exp.company}
                    onChange={(value) =>
                      update(index, "company", value)
                    }
                    className="resume-company resume-edit-block"
                    placeholder="Company"
                  />
                ) : (
                  exp.company && (
                    <p className="resume-company">
                      {exp.company}
                    </p>
                  )
                )}
              </div>

              {(exp.start_date ||
                exp.end_date ||
                exp.current ||
                exp.date_display ||
                editable) && (
                <div className="resume-item-date">
                  {editable ? (
                    <EditableDate
                      item={exp}
                      onChange={(value) =>
                        update(index, "date_display", value)
                      }
                    />
                  ) : (
                    <span
                      className="resume-date"
                      aria-label="Employment dates"
                    >
                      {dateRange(exp)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {editable ? (
              <Editable
                value={exp.description}
                onChange={(value) =>
                  update(index, "description", value)
                }
                className="resume-description resume-edit-block"
                placeholder="Describe your responsibilities and achievements"
                multiline
              />
            ) : (
              exp.description && (
                <p className="resume-description">
                  {exp.description}
                </p>
              )
            )}
          </div>
        ))}
      </div>

      {editable && (
        <button
          type="button"
          className="resume-inline-add"
          onClick={() => update("add")}
        >
          + Add experience
        </button>
      )}
    </section>
  );
}

/* =========================================================
   EDUCATION
   ========================================================= */

function EducationSection({
  education,
  number,
  editable,
  update,
}) {
  if (!education.length && !editable) return null;

  const items = education.length
    ? education
    : [
        {
          degree: "",
          field: "",
          school: "",
          grade: "",
          start_date: "",
          end_date: "",
          current: false,
        },
      ];

  return (
    <section className="resume-section">
      <div className="resume-section-heading">
        <span className="section-number">{number}</span>
        <h2>Education</h2>
      </div>

      <div className="resume-items">
        {items.map((edu, index) => (
          <div className="resume-item" key={index}>
            <div className="resume-item-top">
              <div className="resume-item-main">
                {editable ? (
                  <div className="resume-edit-heading-group">
                    <Editable
                      value={edu.degree}
                      onChange={(value) =>
                        update(index, "degree", value)
                      }
                      className="resume-edit-heading"
                      placeholder="Degree"
                    />

                    <Editable
                      value={edu.field}
                      onChange={(value) =>
                        update(index, "field", value)
                      }
                      className="resume-edit-field"
                      placeholder="Field of study (optional)"
                    />
                  </div>
                ) : (
                  <h3>
                    {edu.degree || "Degree"}
                    {edu.field ? `, ${edu.field}` : ""}
                  </h3>
                )}

                {editable ? (
                  <Editable
                    value={edu.school}
                    onChange={(value) =>
                      update(index, "school", value)
                    }
                    className="resume-company resume-edit-block"
                    placeholder="School / University"
                  />
                ) : (
                  edu.school && (
                    <p className="resume-company">
                      {edu.school}
                    </p>
                  )
                )}
              </div>

              {(edu.start_date ||
                edu.end_date ||
                edu.current ||
                edu.date_display ||
                editable) && (
                <div className="resume-item-date">
                  {editable ? (
                    <EditableDate
                      item={edu}
                      onChange={(value) =>
                        update(index, "date_display", value)
                      }
                    />
                  ) : (
                    <span
                      className="resume-date"
                      aria-label="Education dates"
                    >
                      {dateRange(edu)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {editable ? (
              <Editable
                value={edu.grade}
                onChange={(value) =>
                  update(index, "grade", value)
                }
                className="resume-description resume-edit-block"
                placeholder="Grade, GPA, honors (optional)"
              />
            ) : (
              edu.grade && (
                <p className="resume-description">
                  {edu.grade}
                </p>
              )
            )}
          </div>
        ))}
      </div>

      {editable && (
        <button
          type="button"
          className="resume-inline-add"
          onClick={() => update("add")}
        >
          + Add education
        </button>
      )}
    </section>
  );
}

/* =========================================================
   SKILLS
   ========================================================= */

function SkillsSection({
  skills,
  number,
  plain = false,
  editable,
  update,
}) {
  if (!skills.length && !editable) return null;

  const items = skills.length ? skills : [""];

  return (
    <section className="resume-section">
      <div className="resume-section-heading">
        <span className="section-number">{number}</span>
        <h2>Skills</h2>
      </div>

      {editable ? (
        <div
          className={`skills-list ${
            plain ? "resume-edit-skills-plain" : ""
          }`}
        >
          {items.map((skill, index) => (
            <Editable
              key={index}
              value={skill}
              onChange={(value) => update(index, value)}
              className="skill-tag resume-edit-skill"
              placeholder="Skill"
            />
          ))}

          <button
            type="button"
            className="resume-inline-add"
            onClick={() => update("add")}
          >
            + Add skill
          </button>
        </div>
      ) : plain ? (
        <p className="resume-description">
          {skills.join(", ")}
        </p>
      ) : (
        <div className="skills-list">
          {skills.map((skill, index) => (
            <span className="skill-tag" key={index}>
              {skill}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   PROJECTS
   ========================================================= */

function ProjectsSection({
  projects,
  number,
  editable,
  update,
}) {
  if (!projects.length && !editable) return null;

  const items = projects.length
    ? projects
    : [
        {
          title: "",
          tech_stack: "",
          description: "",
          link: "",
        },
      ];

  return (
    <section className="resume-section">
      <div className="resume-section-heading">
        <span className="section-number">{number}</span>
        <h2>Projects</h2>
      </div>

      <div className="resume-items">
        {items.map((project, index) => (
          <div className="resume-item" key={index}>
            {/* 
              PROJECT HEADER

              The project information gets its own flexible column.
              The project link gets a smaller fixed column.

              This gives the project title and tech stack much more
              horizontal space while keeping the link aligned.
            */}
            <div className="resume-project-top">
              <div className="resume-project-main">
                {editable ? (
                  <Editable
                    value={project.title}
                    onChange={(value) =>
                      update(index, "title", value)
                    }
                    className="resume-edit-heading resume-project-title"
                    placeholder="Project name"
                  />
                ) : (
                  <h3 className="resume-project-title">
                    {project.title || "Project"}
                  </h3>
                )}

                {editable ? (
                  <Editable
                    value={project.tech_stack}
                    onChange={(value) =>
                      update(index, "tech_stack", value)
                    }
                    className="resume-company resume-edit-block resume-project-tech"
                    placeholder="Technologies / tools"
                  />
                ) : (
                  project.tech_stack && (
                    <p className="resume-company resume-project-tech">
                      {project.tech_stack}
                    </p>
                  )
                )}
              </div>

              <div className="resume-project-link-wrap">
                {editable ? (
                  <Editable
                    value={project.link}
                    onChange={(value) =>
                      update(index, "link", value)
                    }
                    className="resume-project-link resume-edit-block"
                    placeholder="Project URL"
                  />
                ) : (
                  project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="resume-project-link"
                    >
                      View project ↗
                    </a>
                  )
                )}
              </div>
            </div>

            {editable ? (
              <Editable
                value={project.description}
                onChange={(value) =>
                  update(index, "description", value)
                }
                className="resume-description resume-edit-block resume-project-description"
                placeholder="Describe the project and your contribution"
                multiline
              />
            ) : (
              project.description && (
                <p className="resume-description resume-project-description">
                  {project.description}
                </p>
              )
            )}
          </div>
        ))}
      </div>

      {editable && (
        <button
          type="button"
          className="resume-inline-add"
          onClick={() => update("add")}
        >
          + Add project
        </button>
      )}
    </section>
  );
}

/* =========================================================
   MAIN RESUME DOCUMENT
   ========================================================= */

export default function ResumeDocument({
  resume,
  templateId = "classic",
  editable = false,
  onChange,
}) {
  const {
    personal_info: pi = {},
    education = [],
    experience = [],
    skills = [],
    projects = [],
  } = resume || {};

  const sectionOrder =
    Array.isArray(resume?.section_order) &&
    resume.section_order.length
      ? resume.section_order
      : [
          "summary",
          "experience",
          "education",
          "skills",
          "projects",
        ];

  const fullName = pi.full_name || "Your Name";

  const templateInfo = getTemplate(templateId);

  const color = getColor(resume?.color);

  const profileImage = pi.profile_image || "";

  const isEmpty =
    !pi.summary &&
    !experience.length &&
    !education.length &&
    !skills.length &&
    !projects.length;

  /* =======================================================
     UPDATE NESTED VALUE
     ======================================================= */

  const patch = (path, value) => {
    if (!onChange) return;

    const next = JSON.parse(
      JSON.stringify(resume || {})
    );

    let target = next;

    path.slice(0, -1).forEach((key) => {
      if (
        !target[key] ||
        typeof target[key] !== "object"
      ) {
        target[key] = {};
      }

      target = target[key];
    });

    target[path[path.length - 1]] = value;

    onChange(next);
  };

  /* =======================================================
     UPDATE ARRAY
     ======================================================= */

  const updateArray = (key, ...args) => {
    if (!onChange) return;

    const next = JSON.parse(
      JSON.stringify(resume || {})
    );

    if (args[0] === "add") {
      const defaults = {
        experience: {
          role: "",
          company: "",
          description: "",
          start_date: "",
          end_date: "",
          current: false,
          date_display: "",
        },

        education: {
          degree: "",
          field: "",
          school: "",
          grade: "",
          start_date: "",
          end_date: "",
          current: false,
          date_display: "",
        },

        skills: "",

        projects: {
          title: "",
          tech_stack: "",
          description: "",
          link: "",
        },
      };

      next[key] = [
        ...(next[key] || []),
        defaults[key],
      ];

      onChange(next);
      return;
    }

    const index = args[0];
    const field = args[1];
    const value = args[2];

    if (key === "skills") {
      if (!Array.isArray(next.skills)) {
        next.skills = [];
      }

      next.skills[index] = field;
    } else if (field === "date_display") {
      if (!next[key]) {
        next[key] = [];
      }

      if (!next[key][index]) {
        next[key][index] = {};
      }

      next[key][index].date_display = value;
    } else if (field === "degree_display") {
      const parts = value
        .split(",")
        .map((s) => s.trim());

      next.education[index].degree =
        parts.shift() || "";

      next.education[index].field =
        parts.join(", ");
    } else {
      if (!next[key]) {
        next[key] = [];
      }

      if (!next[key][index]) {
        next[key][index] = {};
      }

      next[key][index][field] = value;
    }

    onChange(next);
  };

  /* =======================================================
     HEADER
     ======================================================= */

  const header = (
    <header className="resume-header">
      {templateInfo.profileImage && profileImage && (
        <img
          src={profileImage}
          alt=""
          className="resume-profile-image header-profile-image"
        />
      )}

      {editable ? (
        <Editable
          value={fullName}
          onChange={(value) =>
            patch(
              ["personal_info", "full_name"],
              value
            )
          }
          className="resume-edit-name"
          placeholder="Full name"
        />
      ) : (
        <h1>{fullName}</h1>
      )}

      <div className="resume-contact">
        {editable ? (
          <Editable
            value={pi.email}
            onChange={(value) =>
              patch(
                ["personal_info", "email"],
                value
              )
            }
            placeholder="Email"
          />
        ) : (
          pi.email && (
            <span>
              <strong>Email</strong>
              {pi.email}
            </span>
          )
        )}

        {editable ? (
          <Editable
            value={pi.phone}
            onChange={(value) =>
              patch(
                ["personal_info", "phone"],
                value
              )
            }
            placeholder="Phone"
          />
        ) : (
          pi.phone && (
            <span>
              <strong>Phone</strong>
              {pi.phone}
            </span>
          )
        )}

        {editable ? (
          <Editable
            value={pi.address}
            onChange={(value) =>
              patch(
                ["personal_info", "address"],
                value
              )
            }
            placeholder="Location"
          />
        ) : (
          pi.address && (
            <span>
              <strong>Location</strong>
              {pi.address}
            </span>
          )
        )}
      </div>
    </header>
  );

  /* =======================================================
     TEMPLATE COLORS
     ======================================================= */

  const style = {
    "--primary": color.value,
    "--primary-dark": color.dark,
    "--primary-light": color.light,
  };

  /* =======================================================
     SIDEBAR TEMPLATE
     ======================================================= */

  if (isSidebarTemplate(templateId)) {
    return (
      <article
        style={style}
        className={`resume-print-area tpl-${templateId} resume-two-col ${
          editable ? "resume-is-editable" : ""
        }`}
      >
        <aside className="resume-sidebar">
          {templateInfo.profileImage &&
            profileImage && (
              <img
                src={profileImage}
                alt=""
                className="resume-profile-image sidebar-profile-image"
              />
            )}

          {editable ? (
            <Editable
              value={fullName}
              onChange={(value) =>
                patch(
                  ["personal_info", "full_name"],
                  value
                )
              }
              className="resume-sidebar-name"
              placeholder="Full name"
            />
          ) : (
            <div className="resume-sidebar-name">
              {fullName}
            </div>
          )}

          {/* CONTACT */}
          <div className="resume-sidebar-block">
            <h4>Contact</h4>

            {editable ? (
              <>
                <Editable
                  value={pi.email}
                  onChange={(value) =>
                    patch(
                      ["personal_info", "email"],
                      value
                    )
                  }
                  placeholder="Email"
                />

                <Editable
                  value={pi.phone}
                  onChange={(value) =>
                    patch(
                      ["personal_info", "phone"],
                      value
                    )
                  }
                  placeholder="Phone"
                />

                <Editable
                  value={pi.address}
                  onChange={(value) =>
                    patch(
                      ["personal_info", "address"],
                      value
                    )
                  }
                  placeholder="Location"
                />
              </>
            ) : (
              <>
                {pi.email && <p>{pi.email}</p>}
                {pi.phone && <p>{pi.phone}</p>}
                {pi.address && <p>{pi.address}</p>}
              </>
            )}
          </div>

          {/* SKILLS */}
          {(skills.length || editable) > 0 && (
            <div className="resume-sidebar-block">
              <h4>Skills</h4>

              <div className="skills-list sidebar-skills">
                {(skills.length ? skills : [""]).map(
                  (skill, index) =>
                    editable ? (
                      <Editable
                        key={index}
                        value={skill}
                        onChange={(value) =>
                          updateArray(
                            "skills",
                            index,
                            value
                          )
                        }
                        className="skill-tag resume-edit-skill"
                        placeholder="Skill"
                      />
                    ) : (
                      <span
                        className="skill-tag"
                        key={index}
                      >
                        {skill}
                      </span>
                    )
                )}
              </div>

              {editable && (
                <button
                  type="button"
                  className="resume-inline-add"
                  onClick={() =>
                    updateArray("skills", "add")
                  }
                >
                  + Add skill
                </button>
              )}
            </div>
          )}

          {/* EDUCATION */}
          {(education.length || editable) > 0 && (
            <div className="resume-sidebar-block">
              <h4>Education</h4>

              {(
                education.length
                  ? education
                  : [
                      {
                        degree: "",
                        field: "",
                        school: "",
                        grade: "",
                        start_date: "",
                        end_date: "",
                        current: false,
                        date_display: "",
                      },
                    ]
              ).map((edu, index) => (
                <div
                  className="resume-sidebar-item"
                  key={index}
                >
                  {editable ? (
                    <div className="resume-sidebar-item-head">
                      <Editable
                        value={edu.degree}
                        onChange={(value) =>
                          updateArray(
                            "education",
                            index,
                            "degree",
                            value
                          )
                        }
                        className="resume-sidebar-item-title"
                        placeholder="Degree"
                      />

                      <Editable
                        value={edu.field}
                        onChange={(value) =>
                          updateArray(
                            "education",
                            index,
                            "field",
                            value
                          )
                        }
                        className="resume-sidebar-item-field"
                        placeholder="Field of study"
                      />
                    </div>
                  ) : (
                    <p className="resume-sidebar-item-title">
                      {edu.degree || "Degree"}
                      {edu.field ? `, ${edu.field}` : ""}
                    </p>
                  )}

                  {editable ? (
                    <Editable
                      value={edu.school}
                      onChange={(value) =>
                        updateArray(
                          "education",
                          index,
                          "school",
                          value
                        )
                      }
                      placeholder="School"
                    />
                  ) : (
                    edu.school && (
                      <p>{edu.school}</p>
                    )
                  )}

                  {editable ? (
                    <Editable
                      value={edu.grade}
                      onChange={(value) =>
                        updateArray(
                          "education",
                          index,
                          "grade",
                          value
                        )
                      }
                      className="resume-sidebar-item-grade"
                      placeholder="Grade / GPA"
                    />
                  ) : (
                    edu.grade && (
                      <p className="resume-sidebar-item-grade">
                        {edu.grade}
                      </p>
                    )
                  )}

                  {(edu.start_date ||
                    edu.end_date ||
                    edu.current ||
                    edu.date_display ||
                    editable) &&
                    (editable ? (
                      <EditableDate
                        item={edu}
                        onChange={(value) =>
                          updateArray(
                            "education",
                            index,
                            "date_display",
                            value
                          )
                        }
                      />
                    ) : (
                      <p className="resume-sidebar-item-date">
                        {dateRange(edu)}
                      </p>
                    ))}
                </div>
              ))}

              {editable && (
                <button
                  type="button"
                  className="resume-inline-add"
                  onClick={() =>
                    updateArray("education", "add")
                  }
                >
                  + Add education
                </button>
              )}
            </div>
          )}
        </aside>

        <div className="resume-main">
          <SummarySection
            summary={pi.summary}
            number="01"
            editable={editable}
            update={(value) =>
              patch(
                ["personal_info", "summary"],
                value
              )
            }
          />

          <ExperienceSection
            experience={experience}
            number="02"
            editable={editable}
            update={(...args) =>
              args[0] === "add"
                ? updateArray(
                    "experience",
                    "add"
                  )
                : updateArray(
                    "experience",
                    ...args
                  )
            }
          />

          <ProjectsSection
            projects={projects}
            number="03"
            editable={editable}
            update={(...args) =>
              args[0] === "add"
                ? updateArray(
                    "projects",
                    "add"
                  )
                : updateArray(
                    "projects",
                    ...args
                  )
            }
          />
        </div>
      </article>
    );
  }

  /* =======================================================
     NORMAL TEMPLATES
     ======================================================= */

  return (
    <article
      style={style}
      className={`resume-print-area tpl-${templateId} ${
        editable ? "resume-is-editable" : ""
      }`}
    >
      {header}

      {sectionOrder.map((key, index) => {
        const number = String(index + 1).padStart(
          2,
          "0"
        );

        if (key === "summary") {
          return (
            <SummarySection
              key={key}
              summary={pi.summary}
              number={number}
              editable={editable}
              update={(value) =>
                patch(
                  ["personal_info", "summary"],
                  value
                )
              }
            />
          );
        }

        if (key === "experience") {
          return (
            <ExperienceSection
              key={key}
              experience={experience}
              number={number}
              editable={editable}
              update={(...args) =>
                args[0] === "add"
                  ? updateArray(
                      "experience",
                      "add"
                    )
                  : updateArray(
                      "experience",
                      ...args
                    )
              }
            />
          );
        }

        if (key === "education") {
          return (
            <EducationSection
              key={key}
              education={education}
              number={number}
              editable={editable}
              update={(...args) =>
                args[0] === "add"
                  ? updateArray(
                      "education",
                      "add"
                    )
                  : updateArray(
                      "education",
                      ...args
                    )
              }
            />
          );
        }

        if (key === "skills") {
          return (
            <SkillsSection
              key={key}
              skills={skills}
              number={number}
              plain={templateId === "ats"}
              editable={editable}
              update={(...args) =>
                args[0] === "add"
                  ? updateArray(
                      "skills",
                      "add"
                    )
                  : updateArray(
                      "skills",
                      ...args
                    )
              }
            />
          );
        }

        if (key === "projects") {
          return (
            <ProjectsSection
              key={key}
              projects={projects}
              number={number}
              editable={editable}
              update={(...args) =>
                args[0] === "add"
                  ? updateArray(
                      "projects",
                      "add"
                    )
                  : updateArray(
                      "projects",
                      ...args
                    )
              }
            />
          );
        }

        return null;
      })}

      {isEmpty && !editable && (
        <div className="resume-empty-print">
          <p>
            Your resume is currently empty. Go back
            to the editor and add some information.
          </p>
        </div>
      )}
    </article>
  );
}
