// Filename: js/script.js - Upgraded for Dashboard & Dropdown Leaderboard
document.addEventListener('DOMContentLoaded', () => {
    // Firebase Authentication Check
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            initApp(user);
        } else {
            // যদি ব্যবহারকারী লগইন করা না থাকে, তাহলে লগইন পেজে পাঠিয়ে দেওয়া হবে।
            window.location.href = 'https://keshab1997.github.io/Study-With-Keshab/login.html';
        }
    });
});

/**
 * Main function to initialize all functionalities.
 * @param {firebase.User} user - The authenticated user object.
 */
function initApp(user) {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'none';
    }

    const db = firebase.firestore();
    
    // এই ড্যাশবোর্ডের জন্য নির্দিষ্ট অধ্যায়ের নাম
    const chapterName = "কার্য, ক্ষমতা ও শক্তি";
    const chapterKey = chapterName.replace(/\s/g, '_'); // Firestore-এর জন্য নিরাপদ কী

    // --- UI সেটআপ এবং ডেটা লোড ---
    setupUserProfile(user);
    setupUIInteractions();
    
    // --- Firebase থেকে অধ্যায়-ভিত্তিক ডেটা লোড ---
    loadChapterLeaderboard(db, chapterKey); // **ড্রপডাউনসহ উন্নত লিডারবোর্ড**
    loadDashboardData(db, user.uid, chapterKey);
}

// ===============================================
// --- UI Setup Functions ---
// ===============================================

function setupUserProfile(user) {
    document.getElementById('user-display-name').textContent = user.displayName || 'ব্যবহারকারী';
    document.getElementById('user-email').textContent = user.email;
    if (user.photoURL) {
        document.getElementById('user-profile-pic').src = user.photoURL;
    }
}

function setupUIInteractions() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.replace('day-mode', 'dark-mode');
        darkModeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    darkModeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.replace('dark-mode', 'day-mode');
            darkModeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('theme', 'day');
        } else {
            document.body.classList.replace('day-mode', 'dark-mode');
            darkModeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
        // পাই চার্ট পুনরায় আঁকা হবে থিম পরিবর্তনের সাথে
        if(myPieChart) myPieChart.update();
    });

    // Search Bar
    document.getElementById('search-bar').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('main section.card').forEach(section => {
            const title = section.querySelector('h2')?.textContent.toLowerCase() || '';
            const content = section.textContent.toLowerCase();
            section.style.display = (title.includes(query) || content.includes(query)) ? '' : 'none';
        });
    });

    // Formula Modal
    const modal = document.getElementById('formula-modal');
    const openBtn = document.getElementById('formula-sheet-btn');
    const closeBtn = modal.querySelector('.modal-close-btn');
    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
    
    // Back to Top button
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });

    // ************* নতুন কোড: লিডারবোর্ড ড্রপডাউন ক্লিক হ্যান্ডলার *************
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (leaderboardBody) {
        leaderboardBody.addEventListener('click', function(event) {
            const button = event.target.closest('.toggle-details-btn');
            if (!button) return;

            const mainRow = button.closest('.leaderboard-row');
            const detailsRow = mainRow.nextElementSibling;
            
            // সব খোলা ড্রপডাউন বন্ধ করি, শুধু ক্লিক করাটি ছাড়া
            document.querySelectorAll('.details-row').forEach(row => {
                if (row !== detailsRow && row.style.display === 'table-row') {
                    row.style.display = 'none';
                    const prevBtnIcon = row.previousElementSibling.querySelector('.toggle-details-btn i');
                    if (prevBtnIcon) {
                        prevBtnIcon.classList.remove('fa-chevron-up');
                        prevBtnIcon.classList.add('fa-chevron-down');
                    }
                }
            });

            // বর্তমান ড্রপডাউনটি টগল করি
            const icon = button.querySelector('i');
            if (detailsRow.style.display === 'table-row') {
                detailsRow.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                detailsRow.style.display = 'table-row';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        });
    }
}

// ===============================================
// --- Firebase Data Loading Functions ---
// ===============================================

/**
 * [FINAL VERSION with DROPDOWN] Loads leaderboard data.
 * @param {firebase.firestore.Firestore} db
 * @param {string} chapterKey - The Firestore-safe key for the chapter.
 */
function loadChapterLeaderboard(db, chapterKey) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">লিডারবোর্ড লোড হচ্ছে...</td></tr>';
    
    db.collection('users').orderBy(`chapters.${chapterKey}.totalScore`, 'desc').limit(10).get()
        .then(snapshot => {
            if (snapshot.empty) {
                leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">এই অধ্যায়ের জন্য কোনো স্কোর পাওয়া যায়নি।</td></tr>';
                return;
            }

            let leaderboardHTML = '';
            let rank = 1;
            let foundScores = false;

            snapshot.forEach(doc => {
                const userData = doc.data();
                const chapterData = userData.chapters?.[chapterKey];
                
                if (chapterData && chapterData.totalScore > 0) {
                    foundScores = true;
                    
                    let icon = '';
                    if (rank === 1) icon = '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i> ';
                    else if (rank === 2) icon = '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i> ';
                    else if (rank === 3) icon = '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i> ';
                    
                    // --- বিস্তারিত স্কোরের জন্য ড্রপডাউন কন্টেন্ট তৈরি ---
                    let scoreDetailsHTML = '<li>কোনো বিস্তারিত স্কোর নেই।</li>';
                    if (chapterData.quiz_sets) {
                        const sortedSets = Object.entries(chapterData.quiz_sets)
                            .sort((a, b) => {
                                const numA = parseInt(a[0].replace('Set_', ''), 10);
                                const numB = parseInt(b[0].replace('Set_', ''), 10);
                                return numA - numB;
                            });

                        scoreDetailsHTML = sortedSets.map(([setName, setData]) => {
                            const cleanSetName = setName.replace('_', ' ');
                            return `<li><span class="label">${cleanSetName}:</span> ${setData.score}/${setData.totalQuestions}</li>`;
                        }).join('');
                    }
                    // --- ড্রপডাউন কন্টেন্ট তৈরি শেষ ---

                    // প্রধান সারি
                    leaderboardHTML += `
                        <tr class="leaderboard-row">
                            <td>${icon}${rank}</td>
                            <td>${userData.displayName || 'Unknown User'}</td>
                            <td><strong>${chapterData.totalScore}</strong></td>
                            <td>
                                <button class="toggle-details-btn" aria-label="বিস্তারিত দেখুন">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </td>
                        </tr>
                    `;

                    // লুকানো বিস্তারিত সারি
                    leaderboardHTML += `
                        <tr class="details-row">
                            <td colspan="4">
                                <div class="details-content">
                                    <ul>${scoreDetailsHTML}</ul>
                                </div>
                            </td>
                        </tr>
                    `;
                    rank++;
                }
            });

            if (foundScores) {
                leaderboardBody.innerHTML = leaderboardHTML;
            } else {
                 leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">এই অধ্যায়ের জন্য কোনো স্কোর পাওয়া যায়নি।</td></tr>';
            }
        })
        .catch(error => {
            console.error("Error loading chapter leaderboard:", error);
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">ত্রুটি: লিডারবোর্ড লোড করা যায়নি।</td></tr>';
        });
}


/**
 * [UNCHANGED] Loads all data for the user dashboard.
 * @param {firebase.firestore.Firestore} db
 * @param {string} userId - The current user's ID.
 * @param {string} chapterKey - The Firestore-safe key for the chapter.
 */
function loadDashboardData(db, userId, chapterKey) {
    const totalQuizzesInChapter = 9;

    db.collection('users').doc(userId).get().then(doc => {
        let chapterData = {};
        if (doc.exists && doc.data().chapters && doc.data().chapters[chapterKey]) {
            chapterData = doc.data().chapters[chapterKey];
        }

        updateChapterProgress(chapterData.completedQuizzesCount || 0, totalQuizzesInChapter);
        updatePieChart(chapterData.totalCorrect || 0, chapterData.totalWrong || 0);
        updateUserAchievements(chapterData);
        loadDailyChallenge();

    }).catch(error => {
        console.error("Error loading user dashboard data:", error);
        updateChapterProgress(0, totalQuizzesInChapter);
        updatePieChart(0, 0);
        updateUserAchievements({});
        loadDailyChallenge();
    });
}

// ===============================================
// --- Dashboard Update Functions (UNCHANGED) ---
// ===============================================

function updateChapterProgress(completed, total) {
    const progressBar = document.getElementById('chapter-progress-bar');
    const progressText = document.getElementById('chapter-progress-text');
    if (!progressBar || !progressText) return;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% সম্পন্ন (${completed}/${total}টি কুইজ)`;
}

let myPieChart = null;
function updatePieChart(correct, wrong) {
    const ctx = document.getElementById('quiz-pie-chart')?.getContext('2d');
    if (!ctx) return;
    if (myPieChart) myPieChart.destroy();
    const chartData = (correct === 0 && wrong === 0) 
        ? { labels: ['এখনো কোনো কুইজ দেননি'], datasets: [{ data: [1], backgroundColor: ['#bdc3c7'] }] }
        : {
            labels: ['সঠিক উত্তর', 'ভুল উত্তর'],
            datasets: [{
                data: [correct, wrong],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderColor: document.body.classList.contains('dark-mode') ? '#1e1e1e' : '#ffffff',
                borderWidth: 3
            }]
        };
    myPieChart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: { position: 'bottom', labels: { fontColor: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#34495e', fontFamily: "'Hind Siliguri', sans-serif" }},
            tooltips: { titleFontFamily: "'Hind Siliguri', sans-serif", bodyFontFamily: "'Hind Siliguri', sans-serif" }
        }
    });
}

function updateUserAchievements(chapterData) {
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) return;
    const achievementConfig = [
        { id: 'first_quiz', title: 'প্রথম পদক্ষেপ', icon: 'fa-shoe-prints', criteria: data => (data.completedQuizzesCount || 0) >= 1, desc: "এই অধ্যায়ের প্রথম কুইজ সম্পন্ন করেছেন!" },
        { id: 'quiz_master', title: 'কুইজ মাস্টার', icon: 'fa-brain', criteria: data => (data.completedQuizzesCount || 0) >= 5, desc: "এই অধ্যায়ের ৫টি কুইজ সম্পন্ন করেছেন!" },
        { id: 'chapter_winner', title: 'অধ্যায় বিজয়ী', icon: 'fa-crown', criteria: data => (data.completedQuizzesCount || 0) >= 9, desc: "এই অধ্যায়ের সব কুইজ সম্পন্ন করেছেন!" }
    ];
    achievementsContainer.innerHTML = '';
    achievementConfig.forEach(ach => {
        const unlocked = ach.criteria(chapterData);
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${unlocked ? 'unlocked' : ''}`;
        badge.title = `${ach.title} - ${ach.desc}`;
        badge.innerHTML = `<i class="fa-solid ${ach.icon}"></i><span>${ach.title}</span>`;
        achievementsContainer.appendChild(badge);
    });
}

function loadDailyChallenge() {
    const challengeText = document.getElementById('challenge-text');
    if (!challengeText) return;
    const challenges = [
        "আজকে কমপক্ষে ২টি কুইজ সেট সমাধান করো।",
        "সূত্র তালিকাটি সম্পূর্ণ মুখস্থ করে ফেলো।",
        "ক্লাস নোট ১ এবং ২ রিভিশন দাও।",
        "গতিশক্তি ও বিভবশক্তির মধ্যে পার্থক্যগুলো লেখো।"
    ];
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    challengeText.textContent = challenges[dayOfYear % challenges.length];
}