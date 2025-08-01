// Filename: js/script.js - Fully Updated for Chapter-Specific Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Authentication Check
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            initApp(user);
        } else {
            window.location.href = 'https://keshab1997.github.io/Study-With-Keshab/login.html';
        }
    });
});

/**
 * Main function to initialize all functionalities for the specific chapter.
 * @param {firebase.User} user - The authenticated user object.
 */
function initApp(user) {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';

    const db = firebase.firestore();
    
    // Define the specific chapter for this dashboard
    const chapterName = "কার্য, ক্ষমতা ও শক্তি";
    const chapterKey = chapterName.replace(/\s/g, '_'); // Firestore-safe key

    // --- Setup UI and Load Data ---
    setupUserProfile(user);
    setupDarkMode();
    setupSearchBar();
    setupModalsAndButtons();
    // initPomodoroTimer(); // You can add your pomodoro logic back here
    
    // --- Load Chapter-Specific Data from Firebase ---
    loadChapterLeaderboard(db, chapterKey, chapterName);
    loadChapterUserPerformance(db, user.uid, chapterKey);
    loadChapterUserAchievements(db, user.uid, chapterKey);
    loadDailyChallenge();

    const clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn');
    if (clearLeaderboardBtn) {
        clearLeaderboardBtn.addEventListener('click', () => {
            alert("এই লিডারবোর্ডটি সরাসরি ডেটাবেস থেকে আসছে এবং এটি ব্যবহারকারীর ব্রাউজার থেকে মোছা যাবে না।");
        });
    }
}

// ===============================================
// --- Firebase Data Loading Functions (Chapter-Specific) ---
// ===============================================

function setupUserProfile(user) {
    document.getElementById('user-display-name').textContent = user.displayName || 'ব্যবহারকারী';
    document.getElementById('user-email').textContent = user.email;
    if (user.photoURL) {
        document.getElementById('user-profile-pic').src = user.photoURL;
    }
}

/**
 * Loads and displays the leaderboard for a specific chapter.
 * @param {firebase.firestore.Firestore} db
 * @param {string} chapterKey - The Firestore-safe key for the chapter.
 * @param {string} chapterName - The display name of the chapter.
 */
function loadChapterLeaderboard(db, chapterKey, chapterName) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = '<tr><td colspan="4">লিডারবোর্ড লোড হচ্ছে...</td></tr>';
    
    // Query based on the nested totalScore for the specific chapter
    db.collection('users').orderBy(`chapters.${chapterKey}.totalScore`, 'desc').limit(10).get()
        .then(snapshot => {
            if (snapshot.empty) {
                leaderboardBody.innerHTML = '<tr><td colspan="4">এই অধ্যায়ের জন্য কোনো স্কোর পাওয়া যায়নি।</td></tr>';
                return;
            }

            leaderboardBody.innerHTML = '';
            let rank = 1;
            let foundScores = false;
            snapshot.forEach(doc => {
                const userData = doc.data();
                const chapterData = userData.chapters?.[chapterKey];
                
                // Ensure the user has a score for this chapter
                if (chapterData && chapterData.totalScore > 0) {
                    foundScores = true;
                    const row = document.createElement('tr');
                    let icon = '';
                    if (rank === 1) icon = '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i> ';
                    else if (rank === 2) icon = '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i> ';
                    else if (rank === 3) icon = '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i> ';
                    
                    row.innerHTML = `
                        <td>${icon}${rank}</td>
                        <td>${userData.displayName || 'Unknown User'}</td>
                        <td>${chapterName}</td>
                        <td>${chapterData.totalScore}</td>
                    `;
                    leaderboardBody.appendChild(row);
                    rank++;
                }
            });

            if (!foundScores) {
                 leaderboardBody.innerHTML = '<tr><td colspan="4">এই অধ্যায়ের জন্য কোনো স্কোর পাওয়া যায়নি।</td></tr>';
            }
        })
        .catch(error => {
            console.error("Error loading chapter leaderboard:", error);
            leaderboardBody.innerHTML = '<tr><td colspan="4">ত্রুটি: লিডারবোর্ড লোড করা যায়নি। (কনসোল চেক করুন)</td></tr>';
        });
}

/**
 * Loads the user's performance (pie chart, progress) for a specific chapter.
 * @param {firebase.firestore.Firestore} db
 * @param {string} userId
 * @param {string} chapterKey
 */
function loadChapterUserPerformance(db, userId, chapterKey) {
    db.collection('users').doc(userId).get().then(doc => {
        const totalQuizzesInChapter = 9; // Total quizzes for "কার্য, ক্ষমতা ও শক্তি"
        
        if (doc.exists) {
            const chapterData = doc.data().chapters?.[chapterKey];
            if (chapterData) {
                updatePieChart(chapterData.totalCorrect || 0, chapterData.totalWrong || 0);
                updateChapterProgress(chapterData.completedQuizzesCount || 0, totalQuizzesInChapter);
                return;
            }
        }
        // If user doc or chapter data doesn't exist, show default empty state
        updatePieChart(0, 0);
        updateChapterProgress(0, totalQuizzesInChapter);
    });
}

/**
 * Loads and displays user achievements for a specific chapter.
 * @param {firebase.firestore.Firestore} db
 * @param {string} userId
 * @param {string} chapterKey
 */
function loadChapterUserAchievements(db, userId, chapterKey) {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;

    // These criteria are now chapter-specific
    const achievementConfig = [
        { id: 'first_quiz', title: 'প্রথম পদক্ষেপ', icon: 'fa-shoe-prints', criteria: data => (data.completedQuizzesCount || 0) >= 1, desc: "এই অধ্যায়ের প্রথম কুইজ সম্পন্ন করেছেন!" },
        { id: 'quiz_master', title: 'কুইজ মাস্টার', icon: 'fa-brain', criteria: data => (data.completedQuizzesCount || 0) >= 5, desc: "এই অধ্যায়ের ৫টি কুইজ সম্পন্ন করেছেন!" },
        // hasPerfectScore would need to be stored per chapter as well for this to be accurate
        // { id: 'perfect_score', title: 'পারফেক্ট স্কোর', icon: 'fa-bullseye', criteria: data => data.hasPerfectScore === true, desc: "এই অধ্যায়ের কোনো কুইজে ১০০% স্কোর করেছেন!" },
        { id: 'chapter_winner', title: 'অধ্যায় বিজয়ী', icon: 'fa-crown', criteria: data => (data.completedQuizzesCount || 0) === 9, desc: "এই অধ্যায়ের সব কুইজ সম্পন্ন করেছেন!" }
    ];

    db.collection('users').doc(userId).get().then(doc => {
        const chapterData = doc.exists ? (doc.data().chapters?.[chapterKey] || {}) : {};
        achievementsContainer.innerHTML = '';
        achievementConfig.forEach(ach => {
            const unlocked = ach.criteria(chapterData);
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${unlocked ? 'unlocked' : ''}`;
            badge.title = ach.desc;
            badge.innerHTML = `<i class="fa-solid ${ach.icon}"></i><span>${ach.title}</span>`;
            achievementsContainer.appendChild(badge);
        });
    });
}

// ===============================================
// --- UI Update Functions (No change needed here) ---
// ===============================================

let myPieChart = null;
function updatePieChart(correct, wrong) {
    const ctx = document.getElementById('quiz-pie-chart')?.getContext('2d');
    if (!ctx) return;
    const data = {
        labels: ['সঠিক উত্তর', 'ভুল উত্তর'],
        datasets: [{
            data: (correct === 0 && wrong === 0) ? [1, 0] : [correct, wrong],
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
                legend: { position: 'bottom', labels: { fontColor: document.body.classList.contains('dark-mode') ? '#e5e7eb' : '#374151' } }
            }
        });
    }
}

function updateChapterProgress(completed, total) {
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progressBar = document.getElementById('chapter-progress-bar');
    const progressText = document.getElementById('chapter-progress-text');
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}% সম্পন্ন`;
}

// ===============================================
// --- Static UI Setup Functions (No change needed here) ---
// ===============================================

function setupDarkMode() { /* Your existing dark mode code here */ }
function setupSearchBar() { /* Your existing search bar code here */ }
function setupModalsAndButtons() { /* Your existing modal code here */ }
function loadDailyChallenge() { /* Your existing daily challenge code here */ }
function initPomodoroTimer() { /* Your existing pomodoro timer code here */ }