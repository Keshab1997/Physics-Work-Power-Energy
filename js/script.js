// Filename: js/script.js - Final Update with all fixes

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
    
    // --- Load Chapter-Specific Data from Firebase ---
    loadChapterLeaderboard(db, chapterKey); // UPDATED function will be used
    loadChapterUserPerformance(db, user.uid, chapterKey);
    loadChapterUserAchievements(db, user.uid, chapterKey);
    loadDailyChallenge();

    // "Clear leaderboard" button logic has been removed as requested.
}

// ===============================================
// --- Firebase Data Loading Functions (FIXED LEADERBOARD) ---
// ===============================================

function setupUserProfile(user) {
    document.getElementById('user-display-name').textContent = user.displayName || 'ব্যবহারকারী';
    document.getElementById('user-email').textContent = user.email;
    if (user.photoURL) {
        document.getElementById('user-profile-pic').src = user.photoURL;
    }
}

/**
 * [FIXED & UPDATED] Loads leaderboard with detailed scores, without user photos, and renders HTML correctly.
 * @param {firebase.firestore.Firestore} db
 * @param {string} chapterKey - The Firestore-safe key for the chapter.
 */
function loadChapterLeaderboard(db, chapterKey) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">লিডারবোর্ড লোড হচ্ছে...</td></tr>';
    
    db.collection('users').orderBy(`chapters.${chapterKey}.totalScore`, 'desc').limit(10).get()
        .then(snapshot => {
            if (snapshot.empty) {
                leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">এই অধ্যায়ের জন্য কোনো স্কোর পাওয়া যায়নি।</td></tr>';
                return;
            }

            leaderboardBody.innerHTML = '';
            let rank = 1;
            let foundScores = false;

            snapshot.forEach(doc => {
                const userData = doc.data();
                const chapterData = userData.chapters?.[chapterKey];
                
                if (chapterData && chapterData.totalScore > 0) {
                    foundScores = true;
                    const row = document.createElement('tr');
                    
                    let icon = '';
                    if (rank === 1) icon = '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i> ';
                    else if (rank === 2) icon = '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i> ';
                    else if (rank === 3) icon = '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i> ';
                    
                    // === ফিক্স: বিস্তারিত স্কোর স্ট্রিং তৈরি করা ===
                    let detailedScoresText = '';
                    if (chapterData.quiz_sets) {
                        const sortedSets = Object.entries(chapterData.quiz_sets)
                            .sort((a, b) => {
                                const numA = parseInt(a[0].replace('Set_', ''), 10);
                                const numB = parseInt(b[0].replace('Set_', ''), 10);
                                return numA - numB;
                            });

                        // <ul><li> না ব্যবহার করে <br> দিয়ে নতুন লাইন তৈরি করা
                        detailedScoresText = sortedSets.map(([setName, setData]) => {
                            const cleanSetName = setName.replace('_', ' ');
                            return `${cleanSetName}: <strong>${setData.score}/${setData.totalQuestions}</strong>`;
                        }).join('<br>'); 
                    }
                    // ============================================

                    // ফিক্স: ব্যবহারকারীর ছবি ছাড়া টেবিলের সারি তৈরি করা
                    row.innerHTML = `
                        <td>${icon}${rank}</td>
                        <td>${userData.displayName || 'Unknown User'}</td>
                        <td><strong>${chapterData.totalScore}</strong></td>
                        <td>${detailedScoresText || 'N/A'}</td>
                    `;
                    leaderboardBody.appendChild(row);
                    rank++;
                }
            });

            if (!foundScores) {
                 leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">এই অধ্যায়ের জন্য কোনো স্কোর পাওয়া যায়নি।</td></tr>';
            }
        })
        .catch(error => {
            console.error("Error loading chapter leaderboard:", error);
            leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">ত্রুটি: লিডারবোর্ড লোড করা যায়নি।</td></tr>';
        });
}

// --- The rest of the functions are correct and remain unchanged ---

function loadChapterUserPerformance(db, userId, chapterKey) {
    db.collection('users').doc(userId).get().then(doc => {
        const totalQuizzesInChapter = 9;
        if (doc.exists) {
            const chapterData = doc.data().chapters?.[chapterKey];
            if (chapterData) {
                updatePieChart(chapterData.totalCorrect || 0, chapterData.totalWrong || 0);
                updateChapterProgress(chapterData.completedQuizzesCount || 0, totalQuizzesInChapter);
                return;
            }
        }
        updatePieChart(0, 0);
        updateChapterProgress(0, totalQuizzesInChapter);
    });
}

function loadChapterUserAchievements(db, userId, chapterKey) {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;
    const achievementConfig = [
        { id: 'first_quiz', title: 'প্রথম পদক্ষেপ', icon: 'fa-shoe-prints', criteria: data => (data.completedQuizzesCount || 0) >= 1, desc: "এই অধ্যায়ের প্রথম কুইজ সম্পন্ন করেছেন!" },
        { id: 'quiz_master', title: 'কুইজ মাস্টার', icon: 'fa-brain', criteria: data => (data.completedQuizzesCount || 0) >= 5, desc: "এই অধ্যায়ের ৫টি কুইজ সম্পন্ন করেছেন!" },
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

let myPieChart = null;
function updatePieChart(correct, wrong) { /* ... Your existing code ... */ }
function updateChapterProgress(completed, total) { /* ... Your existing code ... */ }
function setupDarkMode() { /* Your existing code ... */ }
function setupSearchBar() { /* Your existing code ... */ }
function setupModalsAndButtons() { /* Your existing code ... */ }
function loadDailyChallenge() { /* Your existing code ... */ }