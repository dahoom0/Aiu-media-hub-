// frontend/src/services/adminProfileManagement.js
import apiClient from './apiClient';

/**
 * Admin Profile Management Service
 *
 * Uses backend endpoints registered in urls.py:
 * - /student-profiles/
 * - /admin-profiles/
 *
 * NOTE:
 * This file only wraps API calls. UI mapping stays in the component.
 */

const adminProfileManagementService = {
  // ---------------- STUDENTS (StudentProfile) ----------------

  /**
   * List all student profiles (admin only) or own profile (student)
   * GET /student-profiles/
   */
  getStudentProfiles() {
    return apiClient.get('/student-profiles/');
  },

  /**
   * Get a single student profile by profile PK
   * GET /student-profiles/:id/
   */
  getStudentProfileById(id) {
    return apiClient.get(`/student-profiles/${id}/`);
  },

  /**
   * Update a student profile by profile PK (admin only if allowed)
   * PATCH /student-profiles/:id/
   */
  updateStudentProfile(id, payload) {
    return apiClient.patch(`/student-profiles/${id}/`, payload);
  },

  /**
   * Create a student profile (usually created at registration, but kept for completeness)
   * POST /student-profiles/
   */
  createStudentProfile(payload) {
    return apiClient.post('/student-profiles/', payload);
  },

  /**
   * Delete a student profile (admin only)
   * DELETE /student-profiles/:id/
   */
  deleteStudentProfile(id) {
    return apiClient.delete(`/student-profiles/${id}/`);
  },

  // ---------------- ADMINS (AdminProfile) ----------------

  /**
   * List all admin profiles (admin only)
   * GET /admin-profiles/
   */
  getAdminProfiles() {
    return apiClient.get('/admin-profiles/');
  },

  /**
   * Get a single admin profile by profile PK
   * GET /admin-profiles/:id/
   */
  getAdminProfileById(id) {
    return apiClient.get(`/admin-profiles/${id}/`);
  },

  /**
   * Update an admin profile by profile PK
   * PATCH /admin-profiles/:id/
   */
  updateAdminProfile(id, payload) {
    return apiClient.patch(`/admin-profiles/${id}/`, payload);
  },

  /**
   * Create an admin profile (usually created elsewhere, kept for completeness)
   * POST /admin-profiles/
   */
  createAdminProfile(payload) {
    return apiClient.post('/admin-profiles/', payload);
  },

  /**
   * Delete an admin profile (admin only)
   * DELETE /admin-profiles/:id/
   */
  deleteAdminProfile(id) {
    return apiClient.delete(`/admin-profiles/${id}/`);
  },
};

export default adminProfileManagementService;
