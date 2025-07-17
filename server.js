const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'education_platform_secret_key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Data storage paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');

// Initialize data directory and files
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data files with default data
const initializeDataFiles = () => {
    // Users data
    if (!fs.existsSync(USERS_FILE)) {
        const defaultUsers = [
            {
                id: '1',
                username: 'student1',
                email: 'student@example.com',
                password: bcrypt.hashSync('password123', 10),
                role: 'student',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                username: 'teacher1',
                email: 'teacher@example.com',
                password: bcrypt.hashSync('teacher123', 10),
                role: 'teacher',
                createdAt: new Date().toISOString()
            }
        ];
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    }

    // Courses data
    if (!fs.existsSync(COURSES_FILE)) {
        const defaultCourses = [
            {
                id: '1',
                title: 'Introduction to Web Development',
                description: 'Learn the basics of HTML, CSS, and JavaScript',
                instructor: 'teacher1',
                duration: '8 weeks',
                level: 'Beginner',
                category: 'Programming',
                thumbnail: 'https://via.placeholder.com/300x200?text=Web+Development',
                lessons: [
                    { id: '1', title: 'HTML Basics', duration: '45 min', videoUrl: 'https://www.youtube.com/embed/UB1O30fR-EE', completed: false },
                    { id: '2', title: 'CSS Fundamentals', duration: '60 min', videoUrl: 'https://www.youtube.com/embed/yfoY53QXEnI', completed: false },
                    { id: '3', title: 'JavaScript Introduction', duration: '75 min', videoUrl: 'https://www.youtube.com/embed/hdI2bqOjy3c', completed: false }
                ],
                enrolled: 0,
                rating: 4.5,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Data Science Fundamentals',
                description: 'Introduction to Python, statistics, and data analysis',
                instructor: 'teacher1',
                duration: '12 weeks',
                level: 'Intermediate',
                category: 'Data Science',
                thumbnail: 'https://via.placeholder.com/300x200?text=Data+Science',
                lessons: [
                    { id: '1', title: 'Python Basics', duration: '50 min', videoUrl: 'https://www.youtube.com/embed/_uQrJ0TkZlc', completed: false },
                    { id: '2', title: 'NumPy and Pandas', duration: '65 min', videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg', completed: false },
                    { id: '3', title: 'Data Visualization', duration: '55 min', videoUrl: 'https://www.youtube.com/embed/UO98lJQ3QGI', completed: false }
                ],
                enrolled: 0,
                rating: 4.8,
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                title: 'Digital Marketing Mastery',
                description: 'Complete guide to digital marketing strategies and tools',
                instructor: 'teacher1',
                duration: '6 weeks',
                level: 'Beginner',
                category: 'Marketing',
                thumbnail: 'https://via.placeholder.com/300x200?text=Digital+Marketing',
                lessons: [
                    { id: '1', title: 'Marketing Fundamentals', duration: '40 min', videoUrl: 'https://www.youtube.com/embed/nU-IIXBWlS4', completed: false },
                    { id: '2', title: 'Social Media Marketing', duration: '50 min', videoUrl: 'https://www.youtube.com/embed/LiNlBjSHV5o', completed: false },
                    { id: '3', title: 'SEO Basics', duration: '45 min', videoUrl: 'https://www.youtube.com/embed/xsVTqzratPs', completed: false }
                ],
                enrolled: 0,
                rating: 4.3,
                createdAt: new Date().toISOString()
            }
        ];
        fs.writeFileSync(COURSES_FILE, JSON.stringify(defaultCourses, null, 2));
    }

    // Progress data
    if (!fs.existsSync(PROGRESS_FILE)) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify([], null, 2));
    }

    // Quizzes data
    if (!fs.existsSync(QUIZZES_FILE)) {
        const defaultQuizzes = [
            {
                id: '1',
                courseId: '1',
                title: 'HTML & CSS Quiz',
                questions: [
                    {
                        id: '1',
                        question: 'What does HTML stand for?',
                        options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
                        correct: 0
                    },
                    {
                        id: '2',
                        question: 'Which CSS property is used to change the text color?',
                        options: ['color', 'text-color', 'font-color', 'text-style'],
                        correct: 0
                    },
                    {
                        id: '3',
                        question: 'What is the correct HTML element for the largest heading?',
                        options: ['<heading>', '<h6>', '<h1>', '<head>'],
                        correct: 2
                    }
                ]
            },
            {
                id: '2',
                courseId: '2',
                title: 'Python Basics Quiz',
                questions: [
                    {
                        id: '1',
                        question: 'Which of the following is the correct way to create a list in Python?',
                        options: ['list = []', 'list = ()', 'list = {}', 'list = ||'],
                        correct: 0
                    },
                    {
                        id: '2',
                        question: 'What is the output of print(2 ** 3)?',
                        options: ['6', '8', '9', '5'],
                        correct: 1
                    }
                ]
            }
        ];
        fs.writeFileSync(QUIZZES_FILE, JSON.stringify(defaultQuizzes, null, 2));
    }
};

// Helper functions
const readJSONFile = (filepath) => {
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (error) {
        return [];
    }
};

const writeJSONFile = (filepath, data) => {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// API Routes

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const users = readJSONFile(USERS_FILE);
    
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ 
        token, 
        user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
        } 
    });
});

app.post('/api/auth/register', (req, res) => {
    const { username, email, password, role = 'student' } = req.body;
    const users = readJSONFile(USERS_FILE);
    
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
        id: uuidv4(),
        username,
        email,
        password: bcrypt.hashSync(password, 10),
        role,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSONFile(USERS_FILE, users);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET);
    res.json({ 
        token, 
        user: { 
            id: newUser.id, 
            username: newUser.username, 
            email: newUser.email, 
            role: newUser.role 
        } 
    });
});

// Course routes
app.get('/api/courses', (req, res) => {
    const courses = readJSONFile(COURSES_FILE);
    res.json(courses);
});

app.get('/api/courses/:id', (req, res) => {
    const courses = readJSONFile(COURSES_FILE);
    const course = courses.find(c => c.id === req.params.id);
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
});

app.post('/api/courses/:id/enroll', authenticateToken, (req, res) => {
    const courses = readJSONFile(COURSES_FILE);
    const progress = readJSONFile(PROGRESS_FILE);
    
    const course = courses.find(c => c.id === req.params.id);
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existingProgress = progress.find(p => p.userId === req.user.id && p.courseId === req.params.id);
    if (existingProgress) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Add progress entry
    const newProgress = {
        id: uuidv4(),
        userId: req.user.id,
        courseId: req.params.id,
        completedLessons: [],
        enrolledAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
    };

    progress.push(newProgress);
    writeJSONFile(PROGRESS_FILE, progress);

    // Update course enrollment count
    course.enrolled += 1;
    writeJSONFile(COURSES_FILE, courses);

    res.json({ message: 'Successfully enrolled in course' });
});

// Progress routes
app.get('/api/progress', authenticateToken, (req, res) => {
    const progress = readJSONFile(PROGRESS_FILE);
    const userProgress = progress.filter(p => p.userId === req.user.id);
    res.json(userProgress);
});

app.post('/api/progress/lesson', authenticateToken, (req, res) => {
    const { courseId, lessonId } = req.body;
    const progress = readJSONFile(PROGRESS_FILE);
    
    const userProgress = progress.find(p => p.userId === req.user.id && p.courseId === courseId);
    if (!userProgress) {
        return res.status(404).json({ error: 'Not enrolled in this course' });
    }

    if (!userProgress.completedLessons.includes(lessonId)) {
        userProgress.completedLessons.push(lessonId);
        userProgress.lastAccessed = new Date().toISOString();
        writeJSONFile(PROGRESS_FILE, progress);
    }

    res.json({ message: 'Lesson progress updated' });
});

// Quiz routes
app.get('/api/quizzes/:courseId', (req, res) => {
    const quizzes = readJSONFile(QUIZZES_FILE);
    const courseQuizzes = quizzes.filter(q => q.courseId === req.params.courseId);
    res.json(courseQuizzes);
});

app.post('/api/quizzes/:id/submit', authenticateToken, (req, res) => {
    const { answers } = req.body;
    const quizzes = readJSONFile(QUIZZES_FILE);
    
    const quiz = quizzes.find(q => q.id === req.params.id);
    if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
    }

    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
        const isCorrect = answers[index] === question.correct;
        if (isCorrect) correctAnswers++;
        
        return {
            questionId: question.id,
            correct: isCorrect,
            correctAnswer: question.correct,
            userAnswer: answers[index]
        };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    res.json({
        score,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        results
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize data and start server
initializeDataFiles();

app.listen(PORT, () => {
    console.log(`Education Platform server running on http://localhost:${PORT}`);
    console.log('Default credentials:');
    console.log('Student: student@example.com / password123');
    console.log('Teacher: teacher@example.com / teacher123');
});