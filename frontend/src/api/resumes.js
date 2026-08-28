import client from "./client";

export const listResumes = () => client.get("/resumes").then((r) => r.data);

export const getResume = (id) => client.get(`/resumes/${id}`).then((r) => r.data);

export const createResume = (payload) =>
  client.post("/resumes", payload).then((r) => r.data);

export const updateResume = (id, payload) =>
  client.put(`/resumes/${id}`, payload).then((r) => r.data);

export const deleteResume = (id) => client.delete(`/resumes/${id}`);

export const shareResume = (id, email, message, pdfBase64) =>
  client.post(`/resumes/${id}/share`, { email, message, pdf_base64: pdfBase64 }).then((r) => r.data);

export const adminOverview = () => client.get("/admin/overview").then(r => r.data);
export const adminUsers = () => client.get("/admin/users").then(r => r.data);
export const adminResumes = (params = {}) => client.get("/admin/resumes", { params }).then(r => r.data);
export const adminGetResume = (id) => client.get(`/admin/resumes/${id}`).then(r => r.data);
export const adminDeleteResume = (id) => client.delete(`/admin/resumes/${id}`);
export const adminDeleteUser = (id) => client.delete(`/admin/users/${id}`);

export const listResumeVersions = (id) => client.get(`/resumes/${id}/versions`).then(r => r.data);
export const createResumeVersion = (id, label) => client.post(`/resumes/${id}/versions`, null, { params: { label } }).then(r => r.data);
export const restoreResumeVersion = (id, versionId) => client.post(`/resumes/${id}/versions/${versionId}/restore`).then(r => r.data);
export const duplicateResume = (id) => client.post(`/resumes/${id}/duplicate`).then(r => r.data);

export const adminSetUserStatus = (id, active) =>
  client.patch(`/admin/users/${id}/status`, null, { params: { active } }).then(r => r.data);
