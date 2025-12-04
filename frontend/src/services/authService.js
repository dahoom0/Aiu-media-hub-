import api from './apiClient';

const authService = {
  // 1. Login
  login: async (username, password) => {
    // Call your custom backend endpoint
    const response = await api.post('/auth/login/', { username, password });
    
    // FIX: Extract tokens from the nested 'tokens' object used in your backend
    const { tokens, user, profile } = response.data;

    if (tokens && tokens.access) {
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      
      // Combine user and profile data into one object for easy access
      // This ensures we have both 'is_staff' (from user) and student details (from profile)
      const userData = { ...user, ...profile };
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data;
  },

  // 2. Register
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    
    // FIX: Your register view ALSO returns tokens, so we can log the user in immediately
    const { tokens, user } = response.data;

    if (tokens && tokens.access) {
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  // 3. Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // 4. Get Profile
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    
    // Backend returns { user: {...}, profile: {...} }
    const { user, profile } = response.data;
    
    // Merge them so the UI can easily say "user.first_name" or "user.student_id"
    const fullData = { ...user, ...profile };
    
    // Update local storage to keep it fresh
    localStorage.setItem('user', JSON.stringify(fullData));
    
    return fullData;
  },

  // 5. Helper to get user from local storage (safe parsing)
  getUser: () => {
    const user = localStorage.getItem('user');
    try {
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  // 6. Check if logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  }
};

export default authService;