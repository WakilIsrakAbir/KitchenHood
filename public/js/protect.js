async function protectRoute(allowedRoles = []) {
  if (!isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }
  
  const user = await fetchProfile();
  if (!user) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }
  
  // If no specific roles required, any logged in user can access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Unauthorized access attempt, redirect to appropriate dashboard
    if (user.role === 'admin') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/user/dashboard.html';
    }
  }
}
