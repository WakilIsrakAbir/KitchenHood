var API_URL = window.location.origin + '/api';

const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    root.classList.toggle('dark');
    const isDark = root.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

document.addEventListener('DOMContentLoaded', initTheme);
