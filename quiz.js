// Quiz application state
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let timeRemaining = 300; // 5 minutes in seconds
let timerInterval = null;
let quizStartTime = null;

// Initialize quiz
document.addEventListener('DOMContentLoaded', function() {
    initializeQuiz();
});

async function initializeQuiz() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Get course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    
    if (!courseId) {
        showNotification('No course specified for quiz', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        await validateUserToken(token);
        await loadQuiz(courseId);
        setupQuizEventListeners();
        hideLoadingScreen();
    } catch (error) {
        console.error('Quiz initialization error:', error);
        showNotification('Error loading quiz', 'error');
        window.location.href = 'dashboard.html';
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
            updateQuizUI();
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        localStorage.removeItem('token');
        throw error;
    }
}

function updateQuizUI() {
    const userName = document.getElementById('user-name');
    if (currentUser) {
        const displayName = currentUser.username || currentUser.email.split('@')[0];
        userName.textContent = displayName;
    }
}

async function loadQuiz(courseId) {
    try {
        const response = await fetch(`/api/quizzes/${courseId}`);
        if (response.ok) {
            const quizzes = await response.json();
            if (quizzes.length > 0) {
                currentQuiz = quizzes[0]; // Take the first quiz for the course
                initializeQuizData();
            } else {
                // Create a sample quiz if none exists
                currentQuiz = createSampleQuiz(courseId);
                initializeQuizData();
            }
        } else {
            currentQuiz = createSampleQuiz(courseId);
            initializeQuizData();
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
        currentQuiz = createSampleQuiz(courseId);
        initializeQuizData();
    }
}

function createSampleQuiz(courseId) {
    const sampleQuizzes = {
        '1': {
            id: '1',
            courseId: '1',
            title: 'HTML & CSS Quiz',
            questions: [
                {
                    id: '1',
                    question: 'What does HTML stand for?',
                    options: [
                        'HyperText Markup Language',
                        'High Tech Modern Language',
                        'Home Tool Markup Language',
                        'Hyperlink and Text Markup Language'
                    ],
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
                },
                {
                    id: '4',
                    question: 'How do you create a comment in CSS?',
                    options: ['// comment', '/* comment */', '<!-- comment -->', '# comment'],
                    correct: 1
                },
                {
                    id: '5',
                    question: 'Which HTML attribute specifies an alternate text for an image?',
                    options: ['title', 'src', 'alt', 'longdesc'],
                    correct: 2
                }
            ]
        },
        '2': {
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
                },
                {
                    id: '3',
                    question: 'Which keyword is used to define a function in Python?',
                    options: ['function', 'def', 'func', 'define'],
                    correct: 1
                },
                {
                    id: '4',
                    question: 'What is the correct way to import a module in Python?',
                    options: ['include module', 'import module', 'using module', 'require module'],
                    correct: 1
                },
                {
                    id: '5',
                    question: 'Which of the following is a mutable data type in Python?',
                    options: ['tuple', 'string', 'list', 'integer'],
                    correct: 2
                }
            ]
        }
    };

    return sampleQuizzes[courseId] || sampleQuizzes['1'];
}

function initializeQuizData() {
    // Initialize user answers array
    userAnswers = new Array(currentQuiz.questions.length).fill(null);
    
    // Set quiz title
    document.getElementById('quiz-title').textContent = currentQuiz.title;
    document.getElementById('total-questions').textContent = currentQuiz.questions.length;
    
    // Generate question dots
    generateQuestionDots();
    
    // Display first question
    displayQuestion(0);
    
    // Start timer
    startTimer();
    
    // Record start time
    quizStartTime = new Date();
}

function generateQuestionDots() {
    const dotsContainer = document.getElementById('question-dots');
    dotsContainer.innerHTML = '';
    
    currentQuiz.questions.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'question-dot';
        dot.textContent = index + 1;
        dot.addEventListener('click', () => navigateToQuestion(index));
        dotsContainer.appendChild(dot);
    });
    
    updateQuestionDots();
}

function updateQuestionDots() {
    const dots = document.querySelectorAll('.question-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('current', 'answered');
        
        if (index === currentQuestionIndex) {
            dot.classList.add('current');
        }
        
        if (userAnswers[index] !== null) {
            dot.classList.add('answered');
        }
    });
}

function displayQuestion(questionIndex) {
    const question = currentQuiz.questions[questionIndex];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-number">Question ${questionIndex + 1}</div>
            <div class="question-text">${question.question}</div>
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option ${userAnswers[questionIndex] === index ? 'selected' : ''}" 
                         data-option="${index}">
                        <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                        <div class="option-text">${option}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add click listeners to options
    container.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => selectOption(parseInt(option.dataset.option)));
    });
    
    // Update progress
    updateProgress();
    
    // Update navigation buttons
    updateNavigationButtons();
}

function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Update option visual state
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`[data-option="${optionIndex}"]`).classList.add('selected');
    
    // Update question dots
    updateQuestionDots();
    
    // Auto-advance to next question if not last
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        setTimeout(() => {
            navigateNext();
        }, 1000);
    } else {
        // Show submit button if last question
        showSubmitButton();
    }
}

function navigateToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < currentQuiz.questions.length) {
        currentQuestionIndex = questionIndex;
        displayQuestion(currentQuestionIndex);
        updateQuestionDots();
    }
}

function navigateNext() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
        updateQuestionDots();
    }
}

function navigatePrevious() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
        updateQuestionDots();
    }
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === currentQuiz.questions.length - 1) {
        nextBtn.style.display = 'none';
        showSubmitButton();
    } else {
        nextBtn.style.display = 'inline-flex';
        document.getElementById('submit-quiz-btn').style.display = 'none';
    }
}

function showSubmitButton() {
    document.getElementById('submit-quiz-btn').style.display = 'inline-flex';
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer-display').textContent = display;
    
    // Change color when time is running low
    const timerElement = document.getElementById('quiz-timer');
    if (timeRemaining <= 60) {
        timerElement.classList.add('warning');
    } else if (timeRemaining <= 30) {
        timerElement.classList.add('danger');
    }
}

async function submitQuiz() {
    clearInterval(timerInterval);
    
    // Calculate time taken
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - quizStartTime) / 1000);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/quizzes/${currentQuiz.id}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers: userAnswers }),
        });
        
        if (response.ok) {
            const results = await response.json();
            showResults(results, timeTaken);
        } else {
            // Calculate results locally if API fails
            const results = calculateLocalResults();
            showResults(results, timeTaken);
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        const results = calculateLocalResults();
        showResults(results, timeTaken);
    }
}

function calculateLocalResults() {
    let correctAnswers = 0;
    const results = currentQuiz.questions.map((question, index) => {
        const isCorrect = userAnswers[index] === question.correct;
        if (isCorrect) correctAnswers++;
        
        return {
            questionId: question.id,
            correct: isCorrect,
            correctAnswer: question.correct,
            userAnswer: userAnswers[index]
        };
    });
    
    const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
    
    return {
        score,
        correctAnswers,
        totalQuestions: currentQuiz.questions.length,
        results
    };
}

function showResults(results, timeTaken) {
    // Update results display
    document.getElementById('final-score').textContent = `${results.score}%`;
    document.getElementById('correct-answers').textContent = results.correctAnswers;
    document.getElementById('incorrect-answers').textContent = results.totalQuestions - results.correctAnswers;
    
    // Format time taken
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    document.getElementById('time-taken').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Show detailed results
    displayDetailedResults(results);
    
    // Show results modal
    document.getElementById('results-modal').style.display = 'block';
    
    // Update score circle color based on performance
    const scoreCircle = document.querySelector('.score-circle');
    if (results.score >= 80) {
        scoreCircle.classList.add('excellent');
    } else if (results.score >= 60) {
        scoreCircle.classList.add('good');
    } else {
        scoreCircle.classList.add('needs-improvement');
    }
}

function displayDetailedResults(results) {
    const container = document.getElementById('results-details');
    container.innerHTML = '<h3>Question Review</h3>';
    
    results.results.forEach((result, index) => {
        const question = currentQuiz.questions[index];
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${result.correct ? 'correct' : 'incorrect'}`;
        
        resultItem.innerHTML = `
            <div class="result-question">
                <span class="question-number">Q${index + 1}</span>
                <span class="result-icon">
                    <i class="fas ${result.correct ? 'fa-check' : 'fa-times'}"></i>
                </span>
            </div>
            <div class="result-content">
                <div class="question-text">${question.question}</div>
                <div class="answer-comparison">
                    ${result.userAnswer !== null ? `
                        <div class="user-answer">
                            Your answer: ${question.options[result.userAnswer]}
                        </div>
                    ` : '<div class="user-answer">No answer selected</div>'}
                    ${!result.correct ? `
                        <div class="correct-answer">
                            Correct answer: ${question.options[result.correctAnswer]}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(resultItem);
    });
}

function setupQuizEventListeners() {
    // Navigation buttons
    document.getElementById('prev-btn').addEventListener('click', navigatePrevious);
    document.getElementById('next-btn').addEventListener('click', navigateNext);
    
    // Quiz actions
    document.getElementById('save-exit-btn').addEventListener('click', saveAndExit);
    document.getElementById('submit-quiz-btn').addEventListener('click', submitQuiz);
    
    // Results modal actions
    document.getElementById('review-answers').addEventListener('click', () => {
        document.getElementById('results-modal').style.display = 'none';
    });
    
    document.getElementById('continue-learning').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
    
    // Prevent accidental page refresh
    window.addEventListener('beforeunload', function(e) {
        if (timerInterval) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function saveAndExit() {
    clearInterval(timerInterval);
    localStorage.setItem('quizProgress', JSON.stringify({
        quizId: currentQuiz.id,
        answers: userAnswers,
        currentQuestion: currentQuestionIndex,
        timeRemaining: timeRemaining
    }));
    
    showNotification('Quiz progress saved!', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

function hideLoadingScreen() {
    document.getElementById('loading-screen').style.display = 'none';
}

// Add quiz-specific styles
const quizStyles = `
    .loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .loading-spinner {
        font-size: 3rem;
        color: #2563eb;
        margin-bottom: 20px;
    }

    .quiz-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .quiz-header h1 {
        margin-bottom: 20px;
        color: #1e293b;
    }

    .quiz-info {
        display: flex;
        justify-content: center;
        gap: 40px;
        align-items: center;
    }

    .quiz-progress {
        font-size: 1.1rem;
        font-weight: 600;
        color: #64748b;
    }

    .quiz-timer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #2563eb;
        padding: 8px 16px;
        background: #f1f5f9;
        border-radius: 25px;
    }

    .quiz-timer.warning {
        color: #f59e0b;
        background: #fef3c7;
    }

    .quiz-timer.danger {
        color: #ef4444;
        background: #fee2e2;
    }

    .quiz-progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        margin-bottom: 40px;
        overflow: hidden;
    }

    .quiz-progress-bar .progress {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #1d4ed8);
        transition: width 0.3s ease;
    }

    .question-card {
        background: white;
        padding: 40px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        margin-bottom: 30px;
    }

    .question-number {
        color: #2563eb;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 15px;
    }

    .question-text {
        font-size: 1.3rem;
        margin-bottom: 30px;
        color: #1e293b;
        line-height: 1.5;
    }

    .options {
        display: grid;
        gap: 15px;
    }

    .option {
        display: flex;
        align-items: center;
        padding: 15px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
    }

    .option:hover {
        border-color: #2563eb;
        background: #f8fafc;
    }

    .option.selected {
        border-color: #2563eb;
        background: #2563eb;
        color: white;
    }

    .option-letter {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        margin-right: 15px;
        font-size: 0.9rem;
    }

    .option.selected .option-letter {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .option-text {
        flex: 1;
        font-size: 1rem;
    }

    .quiz-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .question-dots {
        display: flex;
        gap: 10px;
    }

    .question-dot {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #64748b;
    }

    .question-dot.current {
        background: #2563eb;
        color: white;
    }

    .question-dot.answered {
        background: #10b981;
        color: white;
    }

    .question-dot.answered.current {
        background: #2563eb;
    }

    .quiz-actions {
        display: flex;
        justify-content: center;
        gap: 20px;
    }

    .btn-success {
        background: #10b981;
        color: white;
    }

    .btn-success:hover {
        background: #059669;
    }

    .quiz-results {
        max-width: 600px;
        margin: 2% auto;
    }

    .results-header {
        text-align: center;
        margin-bottom: 30px;
    }

    .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 20px auto;
        color: white;
    }

    .score-circle.good {
        background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .score-circle.needs-improvement {
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .score-value {
        font-size: 2rem;
        font-weight: 700;
    }

    .score-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }

    .results-summary {
        display: flex;
        justify-content: space-around;
        margin-bottom: 30px;
        background: #f8fafc;
        padding: 20px;
        border-radius: 10px;
    }

    .result-stat {
        text-align: center;
    }

    .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
    }

    .stat-label {
        font-size: 0.9rem;
        color: #64748b;
    }

    .results-details {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 30px;
    }

    .results-details h3 {
        margin-bottom: 20px;
        color: #1e293b;
    }

    .result-item {
        display: flex;
        margin-bottom: 15px;
        padding: 15px;
        border-radius: 10px;
        border-left: 4px solid #e5e7eb;
    }

    .result-item.correct {
        background: #f0fdf4;
        border-left-color: #10b981;
    }

    .result-item.incorrect {
        background: #fef2f2;
        border-left-color: #ef4444;
    }

    .result-question {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 15px;
        min-width: 60px;
    }

    .question-number {
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 5px;
    }

    .result-icon {
        font-size: 1.2rem;
    }

    .result-item.correct .result-icon {
        color: #10b981;
    }

    .result-item.incorrect .result-icon {
        color: #ef4444;
    }

    .result-content {
        flex: 1;
    }

    .result-content .question-text {
        font-size: 1rem;
        margin-bottom: 10px;
        color: #1e293b;
    }

    .answer-comparison {
        font-size: 0.9rem;
    }

    .user-answer {
        color: #64748b;
        margin-bottom: 5px;
    }

    .correct-answer {
        color: #10b981;
        font-weight: 500;
    }

    .results-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
    }

    @media (max-width: 768px) {
        .quiz-info {
            flex-direction: column;
            gap: 15px;
        }
        
        .quiz-navigation {
            flex-direction: column;
            gap: 20px;
        }
        
        .question-dots {
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .quiz-actions {
            flex-direction: column;
            align-items: center;
        }
        
        .results-summary {
            flex-direction: column;
            gap: 15px;
        }
        
        .results-actions {
            flex-direction: column;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = quizStyles;
document.head.appendChild(styleSheet);