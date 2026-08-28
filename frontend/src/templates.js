export const TEMPLATE_COLORS = [
  { id: "violet", name: "Violet", value: "#6d3df5", dark: "#5730d0", light: "#f0ebff" },
  { id: "blue", name: "Blue", value: "#2563eb", dark: "#1d4ed8", light: "#dbeafe" },
  { id: "green", name: "Emerald", value: "#059669", dark: "#047857", light: "#d1fae5" },
  { id: "rose", name: "Rose", value: "#e11d48", dark: "#be123c", light: "#ffe4e6" },
];

export const TEMPLATES = [
  { id: "classic", name: "Classic", description: "Clean single-column layout with a bold underline header. Neutral and ATS-friendly.", profileImage: false },
  { id: "modern", name: "Modern", description: "A colorful header band with clear section markers and an optional profile photo.", profileImage: true },
  { id: "minimal", name: "Minimal", description: "Elegant serif typography with generous whitespace and thin rules.", profileImage: false },
  { id: "bold", name: "Bold", description: "Strong full-width header treatment with an optional profile photo.", profileImage: true },
  { id: "ats", name: "ATS Friendly", description: "Plain, highly parseable single-column format for applicant tracking systems.", ats: true, profileImage: false },
  { id: "sidebar", name: "Sidebar", description: "Two-column design with contact, skills and education in a sidebar plus an optional profile photo.", layout: "sidebar", profileImage: true },
];
export const SIDEBAR_TEMPLATE_IDS = TEMPLATES.filter(t => t.layout === "sidebar").map(t => t.id);
export function isSidebarTemplate(id) { return SIDEBAR_TEMPLATE_IDS.includes(id); }
export function getTemplate(id) { return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]; }
export function getColor(id) { return TEMPLATE_COLORS.find(c => c.id === id) || TEMPLATE_COLORS[0]; }
