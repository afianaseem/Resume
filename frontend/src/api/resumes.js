import client from "./client";

/* =========================================================
   USER RESUMES
   ========================================================= */

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


/* =========================================================
   SHARE RESUME
   ========================================================= */

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


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

/*
 * IMPORTANT:
 *
 * This is the optimized admin endpoint.
 *
 * Instead of:
 *
 *   GET /admin/overview
 *   GET /admin/users
 *   GET /admin/resumes
 *
 * the admin dashboard now makes ONE request:
 *
 *   GET /admin/data
 *
 * It returns:
 *
 *   {
 *     overview,
 *     users,
 *     resumes
 *   }
 */

export const adminData = (params = {}) =>
  client
    .get("/admin/data", {
      params,
    })
    .then((response) => response.data);


/* =========================================================
   OLD ADMIN ENDPOINTS
   =========================================================
   
   Keep these because other parts of the application may
   still use them.
*/

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


/* =========================================================
   ADMIN RESUME
   ========================================================= */

export const adminGetResume = (id) =>
  client
    .get(`/admin/resumes/${id}`)
    .then((response) => response.data);


export const adminDeleteResume = (id) =>
  client.delete(`/admin/resumes/${id}`);


/* =========================================================
   ADMIN USERS
   ========================================================= */

export const adminDeleteUser = (id) =>
  client
    .delete(`/admin/users/${id}`)
    .then((response) => response.data);


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


/* =========================================================
   RESUME VERSIONS
   ========================================================= */

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


/* =========================================================
   DUPLICATE RESUME
   ========================================================= */

export const duplicateResume = (id) =>
  client
    .post(`/resumes/${id}/duplicate`)
    .then((response) => response.data);
