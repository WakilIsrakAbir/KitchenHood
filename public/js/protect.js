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
  
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    
    if (user.role === 'admin') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/user/dashboard.html';
    }
  }
}
