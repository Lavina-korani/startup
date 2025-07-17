// Global variables
let currentUser = null;
let courses = [];
let userProgress = [];

// API Base URL
const API_BASE = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadCourses();
    setupEventListeners();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        validateToken(token);
    }
});

// Initialize app components
function initializeApp() {
    setupSmoothScrolling();
    setupMobileMenu();
    setupModals();
    setupContactForm();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => openModal('register-modal'));
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('dashboard-btn')?.addEventListener('click', () => window.location.href = 'dashboard.html');

    // Hero buttons
    document.getElementById('get-started-btn').addEventListener('click', () => openModal('register-modal'));
    document.getElementById('explore-courses-btn').addEventListener('click', () => {
        document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    });

    // Modal forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Course filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', filterCourses);
    });

    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Switch between login/register
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('register-modal');
    });

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('register-modal');
        openModal('login-modal');
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Setup smooth scrolling for navigation links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Setup mobile menu
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger?.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        this.classList.toggle('active');
    });
}

// Setup modals
function setupModals() {
    // Modal functionality is handled in event listeners
}

// Setup contact form
function setupContactForm() {
    const contactForm = document.querySelector('.contact-form');
    contactForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        this.reset();
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            closeModal('login-modal');
            showNotification('Welcome back!', 'success');
            loadUserProgress();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUI();
            closeModal('register-modal');
            showNotification('Account created successfully!', 'success');
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

async function validateToken(token) {
    try {
        const response = await fetch(`${API_BASE}/api/progress`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            // Token is valid, get user info from token
            const tokenData = parseJWT(token);
            currentUser = {
                id: tokenData.id,
                email: tokenData.email,
                role: tokenData.role
            };
            updateUI();
            loadUserProgress();
        } else {
            // Token is invalid
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    userProgress = [];
    updateUI();
    showNotification('Logged out successfully', 'success');
}

// JWT parsing helper
function parseJWT(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Update UI based on authentication state
function updateUI() {
    const authButtons = document.querySelector('.nav-auth');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');

    if (currentUser) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('register-btn').style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.username || currentUser.email;
    } else {
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('register-btn').style.display = 'inline-block';
        userMenu.style.display = 'none';
    }
}

// Course management functions
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE}/api/courses`);
        if (response.ok) {
            courses = await response.json();
            displayCourses(courses);
        } else {
            // Fallback to sample data if API fails
            courses = getSampleCourses();
            displayCourses(courses);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        courses = getSampleCourses();
        displayCourses(courses);
    }
}

function getSampleCourses() {
    return [
        {
            id: '1',
            title: 'Introduction to Web Development',
            description: 'Learn the basics of HTML, CSS, and JavaScript',
            category: 'Programming',
            level: 'Beginner',
            duration: '8 weeks',
            thumbnail: 'https://via.placeholder.com/300x200?text=Web+Development',
            rating: 4.5,
            enrolled: 1250,
            lessons: [
                { id: '1', title: 'HTML Basics', duration: '45 min' },
                { id: '2', title: 'CSS Fundamentals', duration: '60 min' },
                { id: '3', title: 'JavaScript Introduction', duration: '75 min' }
            ]
        },
        {
            id: '2',
            title: 'Data Science Fundamentals',
            description: 'Introduction to Python, statistics, and data analysis',
            category: 'Data Science',
            level: 'Intermediate',
            duration: '12 weeks',
            thumbnail: 'https://via.placeholder.com/300x200?text=Data+Science',
            rating: 4.8,
            enrolled: 890,
            lessons: [
                { id: '1', title: 'Python Basics', duration: '50 min' },
                { id: '2', title: 'NumPy and Pandas', duration: '65 min' },
                { id: '3', title: 'Data Visualization', duration: '55 min' }
            ]
        },
        {
            id: '3',
            title: 'Digital Marketing Mastery',
            description: 'Complete guide to digital marketing strategies and tools',
            category: 'Marketing',
            level: 'Beginner',
            duration: '6 weeks',
            thumbnail: 'https://via.placeholder.com/300x200?text=Digital+Marketing',
            rating: 4.3,
            enrolled: 675,
            lessons: [
                { id: '1', title: 'Marketing Fundamentals', duration: '40 min' },
                { id: '2', title: 'Social Media Marketing', duration: '50 min' },
                { id: '3', title: 'SEO Basics', duration: '45 min' }
            ]
        }
    ];
}

function displayCourses(coursesToShow) {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;

    coursesGrid.innerHTML = '';

    coursesToShow.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
        <div class="course-image" style="background-image: url('${course.thumbnail}')">
            <div class="course-level">${course.level}</div>
        </div>
        <div class="course-content">
            <div class="course-category">${course.category}</div>
            <h3 class="course-title">${course.title}</h3>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <div class="course-duration">
                    <i class="fas fa-clock"></i>
                    ${course.duration}
                </div>
                <div class="course-rating">
                    <i class="fas fa-star"></i>
                    ${course.rating}
                </div>
            </div>
            <div class="course-footer">
                <span class="course-enrolled">${course.enrolled} students</span>
                <button class="btn btn-primary enroll-btn" onclick="enrollInCourse('${course.id}')">
                    ${isEnrolled(course.id) ? 'Continue' : 'Enroll'}
                </button>
            </div>
        </div>
    `;
    return card;
}

function filterCourses(e) {
    const category = e.target.dataset.category;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Filter courses
    let filteredCourses;
    if (category === 'all') {
        filteredCourses = courses;
    } else {
        filteredCourses = courses.filter(course => course.category === category);
    }

    displayCourses(filteredCourses);
}

async function enrollInCourse(courseId) {
    if (!currentUser) {
        openModal('login-modal');
        showNotification('Please login to enroll in courses', 'info');
        return;
    }

    if (isEnrolled(courseId)) {
        // Navigate to course
        window.location.href = `course-detail.html?id=${courseId}`;
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            showNotification('Successfully enrolled in course!', 'success');
            loadUserProgress();
            loadCourses(); // Refresh courses to update enrollment count
        } else {
            const data = await response.json();
            showNotification(data.error || 'Enrollment failed', 'error');
        }
    } catch (error) {
        console.error('Enrollment error:', error);
        showNotification('Enrollment failed. Please try again.', 'error');
    }
}

function isEnrolled(courseId) {
    return userProgress.some(progress => progress.courseId === courseId);
}

async function loadUserProgress() {
    if (!currentUser) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/progress`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            userProgress = await response.json();
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add styles for notifications
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 3000;
                max-width: 400px;
                padding: 16px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                animation: slideInRight 0.3s ease;
            }
            .notification-success { background: #10b981; }
            .notification-error { background: #ef4444; }
            .notification-warning { background: #f59e0b; }
            .notification-info { background: #3b82f6; }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 10px;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Utility functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function calculateProgress(completedLessons, totalLessons) {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons / totalLessons) * 100);
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredCourses = courses.filter(course => 
            course.title.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm) ||
            course.category.toLowerCase().includes(searchTerm)
        );
        displayCourses(filteredCourses);
    });
}

// Scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .course-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize scroll animations after content loads
window.addEventListener('load', setupScrollAnimations);

// Progress tracking
async function markLessonComplete(courseId, lessonId) {
    if (!currentUser) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/progress/lesson`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courseId, lessonId }),
        });

        if (response.ok) {
            loadUserProgress();
            showNotification('Lesson completed!', 'success');
        }
    } catch (error) {
        console.error('Error marking lesson complete:', error);
    }
}

// Export functions for global access
window.enrollInCourse = enrollInCourse;
window.markLessonComplete = markLessonComplete;