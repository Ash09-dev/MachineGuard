// Auth Engine & Session Management
const Auth = {
  // Pre-configured default credentials
  DEFAULT_USER: {
    username: 'admin',
    password: 'password123',
    name: 'Admin',
    role: 'Plant Manager'
  },

  // Initialize Auth state
  init() {
    if (!localStorage.getItem('mg_auth_user')) {
      // Store default user for first-time login validation
      localStorage.setItem('mg_credentials', JSON.stringify(this.DEFAULT_USER));
    }
  },

  // Authenticate user
  login(username, password) {
    const creds = JSON.parse(localStorage.getItem('mg_credentials')) || this.DEFAULT_USER;
    if (username === creds.username && password === creds.password) {
      const session = {
        name: creds.name,
        role: creds.role,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('mg_session', JSON.stringify(session));
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password' };
  },

  // Get current logged in user
  getUser() {
    const session = localStorage.getItem('mg_session');
    return session ? JSON.parse(session) : null;
  },

  // Logout user
  logout() {
    localStorage.removeItem('mg_session');
    window.location.href = 'login.html';
  },

  // Guard protected pages
  checkAuth() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
    } else {
      this.updateUIProfile(user);
    }
  },

  // Update profile in sidebar/header if present
  updateUIProfile(user) {
    document.addEventListener('DOMContentLoaded', () => {
      const nameEl = document.querySelector('.user-name');
      const roleEl = document.querySelector('.user-role');
      const avatarEl = document.querySelector('.user-avatar');

      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.role;
      if (avatarEl) avatarEl.textContent = user.name.charAt(0);
    });
  }
};

Auth.init();