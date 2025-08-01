// Filename: js/script.js - Fully Updated with Firebase Integration

document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Authentication Check ---
    // Wait for Firebase auth state to be ready before initializing the app
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in, initialize the main application logic
            initApp(user);
        } else {
            // User is not signed in, redirect to login page
            // Make sure the login page URL is correct
            window.location.href = 'https://keshab1997.github.io/Study-With-Keshab/login.html'; 
        }
    });
});

/**
 * Main function to initialize all functionalities after user is authenticated.
 * @param {firebase.User} user - The authenticated user object.
 */
function initApp(user) {
    // Hide the preloader once the app is ready
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';

    // Initialize Firebase services
    const db = firebase.firestore();

    // --- Setup all UI components and load data ---
    setupUserProfile(user);
    setupDarkMode();
    setupSearchBar();
    setupModalsAndButtons();
    initPomodoroTimer();
    
    // --- Load dynamic data from Firebase ---
    loadLeaderboardData(db);
    loadUserQuizPerformance(db, user.uid); // For Pie Chart
    loadUserAchievements(db, user.uid);
    loadDailyChallenge();

    // The 'clear-leaderboard-btn' is now informational
    const clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn');
    if (clearLeaderboardBtn) {
        clearLeaderboardBtn.addEventListener('click', () => {
            alert("এই লিডারবোর্ডটি সরাসরি ডেটাবেস থেকে আসছে এবং এটি ব্যবহারকারীর ব্রাউজার থেকে মোছা যাবে না।");
        });
    }
}

// ===============================================
// --- Firebase Data Loading Functions ---
// ===============================================

/**
 * Sets up the user profile card with data from the user object.
 * @param {firebase.User} user - The authenticated user object.
 */
function setupUserProfile(user) {
    document.getElementById('user-display-name').textContent = user.displayName || 'ব্যবহারকারী';
    document.getElementById('user-email').textContent = user.email;
    if (user.photoURL) {
        document.getElementById('user-profile-pic').src = user.photoURL;
    }
}

/**
 * Loads and displays the leaderboard data from Firestore.
 * This function is now more robust.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 */
function loadLeaderboardData(db) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">লিডারবোর্ড লোড হচ্ছে...</td></tr>';

    // Assuming you have a 'users' collection where total scores are stored
    // This is more efficient than calculating on the fly every time.
    // You should update this 'totalScore' field in Firestore when a user completes a quiz.
    db.collection('users').orderBy('totalScore', 'desc').limit(10).get()
        .then(snapshot => {
            if (snapshot.empty) {
                leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">কোনো স্কোর পাওয়া যায়নি।</td></tr>';
                return;
            }

            leaderboardBody.innerHTML = '';
            let rank = 1;
            snapshot.forEach(doc => {
                const userData = doc.data();
                const row = document.createElement('tr');
                let icon = '';
                if (rank === 1) icon = '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i> ';
                else if (rank === 2) icon = '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i> ';
                else if (rank === 3) icon = '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i> ';
                
                // You might want to display user's name instead of email
                const displayName = userData.displayName || doc.id; // Show displayName, fallback to email (doc.id)

                row.innerHTML = `
                    <td>${icon}${rank}</td>
                    <td>${displayName}</td>
                    <td>সকল অধ্যায়</td>
                    <td>${userData.totalScore || 0}</td>
                `;
                leaderboardBody.appendChild(row);
                rank++;
            });
        })
        .catch(error => {
            console.error("Error loading leaderboard data:", error);
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ত্রুটি: লিডারবোর্ড লোড করা যায়নি।</td></tr>';
        });
}

/**
 * Loads the user's overall quiz performance and updates the pie chart.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @param {string} userId - The current user's ID.
 */
function loadUserQuizPerformance(db, userId) {
    // Assuming you have a document for each user that stores their aggregate scores.
    // e.g., 'users/{userId}' has fields 'totalCorrect' and 'totalWrong'.
    db.collection('users').doc(userId).get()
        .then(doc => {
            let totalCorrect = 0;
            let totalWrong = 0;
            if (doc.exists) {
                const data = doc.data();
                totalCorrect = data.totalCorrect || 0;
                totalWrong = data.totalWrong || 0;
            }
            updatePieChart(totalCorrect, totalWrong);
            // Update the chapter progress bar as well
            const totalQuizzes = 9; // Define this globally or pass it
            const completedQuizzes = data.completedQuizzesCount || 0;
            updateChapterProgress(completedQuizzes, totalQuizzes);
        })
        .catch(error => {
            console.error("Error loading quiz performance:", error);
            updatePieChart(0, 0); // Show empty chart on error
            updateChapterProgress(0, 9);
        });
}

/**
 * Loads and displays user achievements based on their progress.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @param {string} userId - The current user's ID.
 */
function loadUserAchievements(db, userId) {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;

    const achievementConfig = [
        { id: 'first_quiz', title: 'প্রথম পদক্ষেপ', icon: 'fa-shoe-prints', criteria: data => (data.completedQuizzesCount || 0) >= 1, desc: "প্রথম কুইজ সম্পন্ন করেছেন!" },
        { id: 'quiz_master', title: 'কুইজ মাস্টার', icon: 'fa-brain', criteria: data => (data.completedQuizzesCount || 0) >= 5, desc: "৫টি কুইজ সম্পন্ন করেছেন!" },
        { id: 'perfect_score', title: 'পারফেক্ট স্কোর', icon: 'fa-bullseye', criteria: data => data.hasPerfectScore === true, desc: "কোনো কুইজে ১০০% স্কোর করেছেন!" },
        { id: 'chapter_winner', title: 'অধ্যায় বিজয়ী', icon: 'fa-crown', criteria: data => (data.completedQuizzesCount || 0) === 9, desc: "সব কুইজ সম্পন্ন করেছেন!" }
    ];

    db.collection('users').doc(userId).get().then(doc => {
        const userData = doc.exists ? doc.data() : {};
        achievementsContainer.innerHTML = '';
        achievementConfig.forEach(ach => {
            const unlocked = ach.criteria(userData);
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${unlocked ? 'unlocked' : ''}`;
            badge.title = ach.desc;
            badge.innerHTML = `<i class="fa-solid ${ach.icon}"></i><span>${ach.title}</span>`;
            achievementsContainer.appendChild(badge);
        });
    });
}


// ===============================================
// --- UI Update Functions ---
// ===============================================

let myPieChart = null; // Store chart instance globally to prevent re-creation
/**
 * Updates the quiz performance pie chart.
 * @param {number} correct - Number of correct answers.
 * @param {number} wrong - Number of wrong answers.
 */
function updatePieChart(correct, wrong) {
    const ctx = document.getElementById('quiz-pie-chart')?.getContext('2d');
    if (!ctx) return;

    const data = {
        labels: ['সঠিক উত্তর', 'ভুল উত্তর'],
        datasets: [{
            data: (correct === 0 && wrong === 0) ? [1, 0] : [correct, wrong], // Avoid empty chart
            backgroundColor: (correct === 0 && wrong === 0) ? ['#d1d5db', '#d1d5db'] : ['#22c55e', '#ef4444'],
            borderColor: document.body.classList.contains('dark-mode') ? '#1f2937' : '#ffffff',
            borderWidth: 2
        }]
    };

    if (myPieChart) {
        myPieChart.data = data;
        myPieChart.update();
    } else {
        myPieChart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom',
                    labels: {
                        fontColor: document.body.classList.contains('dark-mode') ? '#e5e7eb' : '#374151'
                    }
                }
            }
        });
    }
}

/**
 * Updates the chapter progress bar and text.
 * @param {number} completed - Number of completed quizzes.
 * @param {number} total - Total number of quizzes.
 */
function updateChapterProgress(completed, total) {
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progressBar = document.getElementById('chapter-progress-bar');
    const progressText = document.getElementById('chapter-progress-text');
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}% সম্পন্ন`;
}

// ===============================================
// --- Static UI Setup Functions ---
// ===============================================

function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const icon = darkModeToggle.querySelector('i');

    const updateTheme = (isDark) => {
        if (isDark) {
            body.classList.replace('day-mode', 'dark-mode');
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
            if(myPieChart) {
                myPieChart.options.legend.labels.fontColor = '#e5e7eb';
                myPieChart.data.datasets[0].borderColor = '#1f2937';
                myPieChart.update();
            }
        } else {
            body.classList.replace('dark-mode', 'day-mode');
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
             if(myPieChart) {
                myPieChart.options.legend.labels.fontColor = '#374151';
                myPieChart.data.datasets[0].borderColor = '#ffffff';
                myPieChart.update();
            }
        }
    };

    if (localStorage.getItem('theme') === 'dark') {
        updateTheme(true);
    }
    
    darkModeToggle.addEventListener('click', () => {
        updateTheme(body.classList.contains('day-mode'));
    });
}

function setupSearchBar() {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        const sections = document.querySelectorAll('main > section');
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            sections.forEach(section => {
                const sectionText = section.innerText.toLowerCase();
                section.style.display = sectionText.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
}

function setupModalsAndButtons() {
    // Formula Sheet Modal
    const formulaBtn = document.getElementById('formula-sheet-btn');
    const modal = document.getElementById('formula-modal');
    if (formulaBtn && modal) {
        const closeBtn = modal.querySelector('.modal-close-btn');
        formulaBtn.addEventListener('click', () => modal.style.display = 'flex');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    }

    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.onscroll = () => {
            backToTopBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "block" : "none";
        };
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function loadDailyChallenge() {
    const challengeText = document.getElementById('challenge-text');
    if(challengeText) {
         const challenges = [
            "চ্যালেঞ্জ: সেট ১ কুইজ দিয়ে দেখুন!",
            "চ্যালেঞ্জ: একটি রিভিশন নোট পড়ুন।",
            "চ্যালেঞ্জ: ৩টি ক্লাস নোট ডাউনলোড করুন।",
            "চ্যালেঞ্জ: লিডারবোর্ড চেক করুন।",
            "চ্যালেঞ্জ: পোমোডোরো টাইমার ব্যবহার করে পড়ুন।",
            "চ্যালেঞ্জ: কুইজ সেট ৫-এ ৮০% স্কোর করার চেষ্টা করুন!",
            "চ্যালেঞ্জ: আপনার নোটপ্যাড আপডেট করুন."
        ];
        challengeText.textContent = challenges[new Date().getDay()];
    }
}

function initPomodoroTimer() {
    // Pomodoro timer logic here (your previous code was good, can be placed here)
    // I'm keeping it concise for this example
    console.log("Pomodoro Timer Initialized.");
}