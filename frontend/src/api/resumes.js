import client from "./client";

// ============================================================
// USER RESUMES
// ============================================================

export const listResumes = () =>
  client
    .get("/resumes")
    .then((response) => response.data);


export const getResume = (id) =>
  client
    .get(`/resumes/${id}`)
    .then((response) => response.data);


export const createResume = (payload) =>
  client
    .post("/resumes", payload)
    .then((response) => response.data);


export const updateResume = (id, payload) =>
  client
    .put(`/resumes/${id}`, payload)
    .then((response) => response.data);


export const deleteResume = (id) =>
  client.delete(`/resumes/${id}`);


export const shareResume = (
  id,
  email,
  message,
  pdfBase64
) =>
  client
    .post(`/resumes/${id}/share`, {
      email,
      message,
      pdf_base64: pdfBase64,
    })
    .then((response) => response.data);


// ============================================================
// ADMIN
// ============================================================

/*
 * IMPORTANT:
 *
 * AdminDashboard uses this function to load:
 *
 * - overview
 * - users
 * - resumes
 *
 * in ONE API request instead of making three requests.
 */
export const adminData = (params = {}) =>
  client
    .get("/admin/data", {
      params,
    })
    .then((response) => response.data);


// Keep these functions because other parts of the
// application may still use them.
export const adminOverview = () =>
  client
    .get("/admin/overview")
    .then((response) => response.data);


export const adminUsers = () =>
  client
    .get("/admin/users")
    .then((response) => response.data);


export const adminResumes = (params = {}) =>
  client
    .get("/admin/resumes", {
      params,
    })
    .then((response) => response.data);


export const adminGetResume = (id) =>
  client
    .get(`/admin/resumes/${id}`)
    .then((response) => response.data);


export const adminDeleteResume = (id) =>
  client.delete(`/admin/resumes/${id}`);


export const adminDeleteUser = (id) =>
  client.delete(`/admin/users/${id}`);


export const adminSetUserStatus = (
  id,
  active
) =>
  client
    .patch(
      `/admin/users/${id}/status`,
      null,
      {
        params: {
          active,
        },
      }
    )
    .then((response) => response.data);


// ============================================================
// RESUME VERSIONS
// ============================================================

export const listResumeVersions = (id) =>
  client
    .get(`/resumes/${id}/versions`)
    .then((response) => response.data);


export const createResumeVersion = (
  id,
  label
) =>
  client
    .post(
      `/resumes/${id}/versions`,
      null,
      {
        params: {
          label,
        },
      }
    )
    .then((response) => response.data);


export const restoreResumeVersion = (
  id,
  versionId
) =>
  client
    .post(
      `/resumes/${id}/versions/${versionId}/restore`
    )
    .then((response) => response.data);


export const duplicateResume = (id) =>
  client
    .post(`/resumes/${id}/duplicate`)
    .then((response) => response.data);
