// Dashboard-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Validate token and get user data
    try {
        await validateUserToken(token);
        await loadDashboardData();
        setupDashboardEventListeners();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        window.location.href = 'index.html';
    }
}

async function validateUserToken(token) {
    try {
        const response = await fetch('/api/progress', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const tokenData = parseJWT(token);
            currentUser = {
                id: tokenData.id,
                email: tokenData.email,
                role: tokenData.role,
                username: tokenData.username || tokenData.email.split('@')[0]
            };
            updateDashboardUI();
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        localStorage.removeItem('token');
        throw error;
    }
}

function updateDashboardUI() {
    const userName = document.getElementById('user-name');
    const welcomeName = document.getElementById('welcome-name');
    
    if (currentUser) {
        const displayName = currentUser.username || currentUser.email.split('@')[0];
        userName.textContent = displayName;
        welcomeName.textContent = displayName;
    }
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadUserCourses(),
            loadUserProgress(),
            loadUserStatistics(),
            loadRecommendedCourses()
        ]);
        
        updateStatistics();
        displayCurrentCourses();
        displaySubjectProgress();
        generateWeeklyChart();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadUserCourses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/progress', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            userProgress = await response.json();
        }
    } catch (error) {
        console.error('Error loading user courses:', error);
    }
}

async function loadUserStatistics() {
    // Calculate statistics from user progress
    const stats = {
        enrolledCourses: userProgress.length,
        completedLessons: 0,
        certificatesEarned: 0,
        totalHours: 0
    };

    // Get detailed course information
    try {
        const coursesResponse = await fetch('/api/courses');
        if (coursesResponse.ok) {
            const allCourses = await coursesResponse.json();
            
            userProgress.forEach(progress => {
                const course = allCourses.find(c => c.id === progress.courseId);
                if (course) {
                    stats.completedLessons += progress.completedLessons ? progress.completedLessons.length : 0;
                    
                    // Calculate total hours (estimate 1 hour per lesson)
                    stats.totalHours += progress.completedLessons ? progress.completedLessons.length : 0;
                    
                    // Check if course is completed (all lessons done)
                    if (course.lessons && progress.completedLessons && 
                        progress.completedLessons.length === course.lessons.length) {
                        stats.certificatesEarned++;
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error calculating statistics:', error);
    }

    return stats;
}

function updateStatistics() {
    loadUserStatistics().then(stats => {
        document.getElementById('enrolled-courses').textContent = stats.enrolledCourses;
        document.getElementById('completed-lessons').textContent = stats.completedLessons;
        document.getElementById('certificates-earned').textContent = stats.certificatesEarned;
        document.getElementById('total-hours').textContent = stats.totalHours + 'h';
    });
}

async function displayCurrentCourses() {
    const container = document.getElementById('current-courses');
    container.innerHTML = '';

    if (userProgress.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>No courses yet</h3>
                <p>Start your learning journey by enrolling in a course</p>
                <button class="btn btn-primary" onclick="window.location.href='index.html#courses'">
                    Browse Courses
                </button>
            </div>
        `;
        return;
    }

    try {
        const coursesResponse = await fetch('/api/courses');
        if (coursesResponse.ok) {
            const allCourses = await coursesResponse.json();
            
            userProgress.forEach(progress => {
                const course = allCourses.find(c => c.id === progress.courseId);
                if (course) {
                    const courseCard = createDashboardCourseCard(course, progress);
                    container.appendChild(courseCard);
                }
            });
        }
    } catch (error) {
        console.error('Error displaying current courses:', error);
    }
}

function createDashboardCourseCard(course, progress) {
    const completedLessons = progress.completedLessons ? progress.completedLessons.length : 0;
    const totalLessons = course.lessons ? course.lessons.length : 0;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'course-progress-card';
    card.innerHTML = `
        <div class="course-thumbnail" style="background-image: url('${course.thumbnail}')"></div>
        <div class="course-progress-info">
            <h3>${course.title}</h3>
            <p>${course.description}</p>
            <div class="progress-info">
                <div class="progress-bar">
                    <div class="progress" style="width: ${progressPercentage}%"></div>
                </div>
                <span class="progress-text">${completedLessons}/${totalLessons} lessons completed</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-primary" onclick="continueCourse('${course.id}')">
                    Continue Learning
                </button>
                <button class="btn btn-outline" onclick="takeQuiz('${course.id}')">
                    Take Quiz
                </button>
            </div>
        </div>
    `;
    return card;
}

function displaySubjectProgress() {
    const container = document.getElementById('subject-progress');
    container.innerHTML = '';

    // Group courses by category
    const categoryProgress = {};
    
    userProgress.forEach(progress => {
        // This would need actual course data, for now using sample data
        const sampleCategories = ['Programming', 'Data Science', 'Marketing'];
        const category = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
        
        if (!categoryProgress[category]) {
            categoryProgress[category] = { completed: 0, total: 0 };
        }
        
        categoryProgress[category].completed += progress.completedLessons ? progress.completedLessons.length : 0;
        categoryProgress[category].total += 10; // Assuming 10 lessons per course
    });

    // Add sample data if no progress
    if (Object.keys(categoryProgress).length === 0) {
        categoryProgress['Programming'] = { completed: 8, total: 10 };
        categoryProgress['Data Science'] = { completed: 5, total: 12 };
        categoryProgress['Marketing'] = { completed: 6, total: 8 };
    }

    Object.entries(categoryProgress).forEach(([category, data]) => {
        const percentage = Math.round((data.completed / data.total) * 100);
        const progressItem = document.createElement('div');
        progressItem.className = 'subject-progress-item';
        progressItem.innerHTML = `
            <div class="subject-info">
                <span class="subject-name">${category}</span>
                <span class="subject-percentage">${percentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${percentage}%"></div>
            </div>
        `;
        container.appendChild(progressItem);
    });
}

function generateWeeklyChart() {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Sample weekly data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = [2, 1.5, 3, 2.5, 1, 0.5, 2];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart dimensions
    const chartWidth = canvas.width - 60;
    const chartHeight = canvas.height - 60;
    const barWidth = chartWidth / days.length;
    const maxHours = Math.max(...hours);
    
    // Draw bars
    hours.forEach((hour, index) => {
        const barHeight = (hour / maxHours) * chartHeight;
        const x = 30 + index * barWidth + barWidth * 0.2;
        const y = 30 + chartHeight - barHeight;
        const width = barWidth * 0.6;
        
        // Draw bar
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x, y, width, barHeight);
        
        // Draw day label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(days[index], x + width/2, chartHeight + 50);
        
        // Draw hour label
        ctx.fillStyle = '#1e293b';
        ctx.font = '10px Inter';
        ctx.fillText(hour + 'h', x + width/2, y - 5);
    });
    
    // Draw y-axis
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(30, chartHeight + 30);
    ctx.stroke();
}

async function loadRecommendedCourses() {
    const container = document.getElementById('recommended-courses');
    
    try {
        const response = await fetch('/api/courses');
        if (response.ok) {
            const allCourses = await response.json();
            
            // Filter out enrolled courses
            const enrolledIds = userProgress.map(p => p.courseId);
            const recommendedCourses = allCourses.filter(course => !enrolledIds.includes(course.id));
            
            // Show top 3 recommended courses
            const topRecommended = recommendedCourses.slice(0, 3);
            
            container.innerHTML = '';
            topRecommended.forEach(course => {
                const courseCard = createRecommendedCourseCard(course);
                container.appendChild(courseCard);
            });
        }
    } catch (error) {
        console.error('Error loading recommended courses:', error);
    }
}

function createRecommendedCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'recommended-course-card';
    card.innerHTML = `
        <div class="course-image" style="background-image: url('${course.thumbnail}')"></div>
        <div class="course-info">
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <div class="course-meta">
                <span class="course-level">${course.level}</span>
                <span class="course-rating">
                    <i class="fas fa-star"></i>
                    ${course.rating}
                </span>
            </div>
            <button class="btn btn-primary btn-small" onclick="enrollInCourse('${course.id}')">
                Enroll Now
            </button>
        </div>
    `;
    return card;
}

function setupDashboardEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Quick action buttons
    document.getElementById('browse-courses').addEventListener('click', function() {
        window.location.href = 'index.html#courses';
    });

    document.getElementById('take-quiz').addEventListener('click', function() {
        if (userProgress.length > 0) {
            window.location.href = `quiz.html?courseId=${userProgress[0].courseId}`;
        } else {
            showNotification('Enroll in a course first to take quizzes', 'info');
        }
    });

    document.getElementById('view-certificates').addEventListener('click', function() {
        showNotification('Certificates feature coming soon!', 'info');
    });
}

// Global functions for dashboard interactions
function continueCourse(courseId) {
    window.location.href = `course-detail.html?id=${courseId}`;
}

function takeQuiz(courseId) {
    window.location.href = `quiz.html?courseId=${courseId}`;
}

// Add dashboard-specific styles
const dashboardStyles = `
    .course-progress-card {
        display: flex;
        background: white;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
    }

    .course-progress-card:hover {
        transform: translateY(-2px);
    }

    .course-thumbnail {
        width: 120px;
        height: 80px;
        border-radius: 10px;
        background-size: cover;
        background-position: center;
        margin-right: 20px;
    }

    .course-progress-info {
        flex: 1;
    }

    .course-progress-info h3 {
        margin: 0 0 8px 0;
        color: #1e293b;
        font-size: 1.1rem;
    }

    .course-progress-info p {
        margin: 0 0 15px 0;
        color: #64748b;
        font-size: 0.9rem;
    }

    .progress-info {
        margin-bottom: 15px;
    }

    .progress-text {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 5px;
        display: block;
    }

    .course-actions {
        display: flex;
        gap: 10px;
    }

    .btn-small {
        padding: 6px 16px;
        font-size: 0.8rem;
    }

    .dashboard-section {
        margin-bottom: 40px;
    }

    .dashboard-section h2 {
        margin-bottom: 20px;
        color: #1e293b;
        font-size: 1.5rem;
    }

    .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
    }

    .stat-icon i {
        font-size: 1.5rem;
        color: white;
    }

    .stat-info h3 {
        font-size: 2rem;
        margin: 0 0 5px 0;
        color: #1e293b;
    }

    .stat-info p {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
    }

    .progress-charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
    }

    .chart-container {
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .chart-container h3 {
        margin: 0 0 15px 0;
        color: #1e293b;
        font-size: 1.1rem;
    }

    .subject-progress-item {
        margin-bottom: 15px;
    }

    .subject-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }

    .subject-name {
        font-weight: 500;
        color: #1e293b;
    }

    .subject-percentage {
        font-weight: 600;
        color: #2563eb;
    }

    .recommended-course-card {
        background: white;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        transition: transform 0.3s ease;
    }

    .recommended-course-card:hover {
        transform: translateY(-2px);
    }

    .recommended-course-card .course-image {
        height: 120px;
        background-size: cover;
        background-position: center;
    }

    .recommended-course-card .course-info {
        padding: 15px;
    }

    .recommended-course-card h4 {
        margin: 0 0 8px 0;
        color: #1e293b;
        font-size: 1rem;
    }

    .recommended-course-card p {
        margin: 0 0 10px 0;
        color: #64748b;
        font-size: 0.8rem;
        line-height: 1.4;
    }

    .course-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .course-level {
        background: #f1f5f9;
        color: #475569;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
    }

    .course-rating {
        color: #fbbf24;
        font-size: 0.8rem;
    }

    .activity-feed {
        background: white;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .activity-item {
        display: flex;
        align-items: center;
        padding: 15px 0;
        border-bottom: 1px solid #f1f5f9;
    }

    .activity-item:last-child {
        border-bottom: none;
    }

    .activity-icon {
        width: 40px;
        height: 40px;
        background: #f8fafc;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
    }

    .activity-icon i {
        color: #2563eb;
    }

    .activity-content p {
        margin: 0 0 5px 0;
        color: #1e293b;
        font-size: 0.9rem;
    }

    .activity-time {
        color: #64748b;
        font-size: 0.8rem;
    }

    .quick-actions {
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .quick-action-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
        white-space: nowrap;
    }

    .quick-action-btn:hover {
        background: #1d4ed8;
        transform: translateY(-2px);
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
    }

    .empty-state i {
        font-size: 3rem;
        margin-bottom: 20px;
        color: #cbd5e1;
    }

    .empty-state h3 {
        margin: 0 0 10px 0;
        color: #475569;
    }

    .empty-state p {
        margin: 0 0 20px 0;
    }

    @media (max-width: 768px) {
        .progress-charts {
            grid-template-columns: 1fr;
        }
        
        .course-progress-card {
            flex-direction: column;
        }
        
        .course-thumbnail {
            width: 100%;
            height: 150px;
            margin-right: 0;
            margin-bottom: 15px;
        }
        
        .quick-actions {
            bottom: 20px;
            right: 20px;
        }
        
        .quick-action-btn {
            padding: 10px 14px;
            font-size: 0.8rem;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = dashboardStyles;
document.head.appendChild(styleSheet);