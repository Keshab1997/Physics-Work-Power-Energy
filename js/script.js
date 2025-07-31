// Filename: js/script.js (for Homepage) - UPDATED with Timer State Persistence

document.addEventListener('DOMContentLoaded', () => {
    // --- Preloader Functionality ---
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';

    // --- Dark Mode Functionality ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const icon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

    const enableDarkMode = () => {
        body.classList.replace('day-mode', 'dark-mode');
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark-mode');
        if (typeof updateCharts === 'function') updateCharts('dark');
    };
    const disableDarkMode = () => {
        body.classList.replace('dark-mode', 'day-mode');
        if (icon) icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'day-mode');
        if (typeof updateCharts === 'function') updateCharts('light');
    };
    if (localStorage.getItem('theme') === 'dark-mode') enableDarkMode();
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            body.classList.contains('day-mode') ? enableDarkMode() : disableDarkMode();
        });
    }

    // --- Search Bar Functionality ---
    const searchBar = document.getElementById('search-bar');
    const sections = document.querySelectorAll('main > section');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            sections.forEach(section => {
                section.style.display = section.innerText.toLowerCase().includes(searchTerm) ? 'block' : 'none';
            });
        });
    }

    // --- Dashboard & Visualization Logic ---
    const totalQuizzes = 9;
    let quizPieChart;
    const achievements = [
        { id: 'first_quiz', title: 'প্রথম পদক্ষেপ', icon: 'fa-shoe-prints', criteria: (data) => data.completedQuizzes >= 1, desc: "প্রথম কুইজ সম্পন্ন করেছেন!" },
        { id: 'quiz_master', title: 'কুইজ মাস্টার', icon: 'fa-brain', criteria: (data) => data.completedQuizzes >= 5, desc: "৫টি কুইজ সম্পন্ন করেছেন!" },
        { id: 'perfect_score', title: 'পারফেক্ট স্কোর', icon: 'fa-bullseye', criteria: (data) => data.hasPerfectScore, desc: "কোনো কুইজে ১০০% স্কোর করেছেন!" },
        { id: 'chapter_winner', title: 'অধ্যায় বিজয়ী', icon: 'fa-crown', criteria: (data) => data.completedQuizzes === totalQuizzes, desc: "সব কুইজ সম্পন্ন করেছেন!" }
    ];

    window.updateCharts = (mode) => {
        if (quizPieChart) {
            const chartColor = mode === 'dark' ? '#e0e0e0' : '#333';
            quizPieChart.options.plugins.legend.labels.color = chartColor;
            quizPieChart.data.datasets[0].borderColor = mode === 'dark' ? '#1f2937' : '#ffffff';
            quizPieChart.update();
        }
    };
    
    function updateDashboard() {
        const comprehensiveLeaderboard = JSON.parse(localStorage.getItem('comprehensiveLeaderboard') || '{}');
        const userName = localStorage.getItem('quizUserName');
        let completedQuizzes = 0, hasPerfectScore = false;
        
        if (userName && comprehensiveLeaderboard[userName]) {
            const userScores = comprehensiveLeaderboard[userName].scores;
            completedQuizzes = Object.keys(userScores).length;
            for (const scoreData of Object.values(userScores)) {
                if (scoreData.score === scoreData.total) { hasPerfectScore = true; break; }
            }
        }

        const chapterProgressBar = document.getElementById('chapter-progress-bar');
        if(chapterProgressBar){
            chapterProgressBar.style.width = `${Math.round((completedQuizzes / totalQuizzes) * 100)}%`;
        }
        const chapterProgressText = document.getElementById('chapter-progress-text');
        if(chapterProgressText){
            chapterProgressText.textContent = `${Math.round((completedQuizzes / totalQuizzes) * 100)}% সম্পন্ন`;
        }
        
        const pieCtx = document.getElementById('quiz-pie-chart')?.getContext('2d');
        if (pieCtx) {
            const chartData = {
                labels: ['সম্পন্ন', 'বাকি'],
                datasets: [{ 
                    data: [completedQuizzes, totalQuizzes - completedQuizzes], 
                    backgroundColor: ['#27ae60', '#e74c3c'], 
                    borderColor: body.classList.contains('dark-mode') ? '#1f2937' : '#ffffff', 
                    borderWidth: 2 
                }]
            };

            if (quizPieChart) quizPieChart.destroy();
            quizPieChart = new Chart(pieCtx, { type: 'pie', data: chartData, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: body.classList.contains('dark-mode') ? '#e0e0e0' : '#333' } } } } });
        }
    
        const progressData = { completedQuizzes, hasPerfectScore };
        const achievementsContainer = document.getElementById('achievements-container');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = '';
            achievements.forEach(ach => {
                const unlocked = ach.criteria(progressData);
                const badge = document.createElement('div');
                badge.className = `achievement-badge ${unlocked ? 'unlocked' : ''}`;
                badge.title = ach.desc;
                badge.innerHTML = `<i class="fa-solid ${ach.icon}"></i><span>${ach.title}</span>`;
                achievementsContainer.appendChild(badge);
            });
        }
    }

    const challengeText = document.getElementById('challenge-text');
    if (challengeText) {
        const challenges = [
            "চ্যালেঞ্জ: সেট ১ কুইজ দিয়ে দেখুন!",
            "চ্যালেঞ্জ: একটি রিভিশন নোট পড়ুন।",
            "চ্যালেঞ্জ: ৩টি ক্লাস নোট ডাউনলোড করুন।",
            "চ্যালেঞ্জ: লিডারবোর্ড চেক করুন।",
            "চ্যালেঞ্জ: পোমোডোরো টাইমার ব্যবহার করে পড়ুন।",
            "চ্যালেঞ্জ: কুইজ সেট ৫-এ ৮০% স্কোর করার চেষ্টা করুন!",
            "চ্যালেঞ্জ: আপনার নোটপ্যাড আপডেট করুন."
        ];
        const dayOfWeek = new Date().getDay();
        challengeText.textContent = challenges[dayOfWeek];
    }
    
    // --- Leaderboard ---
    const leaderboardBody = document.getElementById('leaderboard-body');
    const clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn');
    const loadLeaderboard = () => {
        if (!leaderboardBody) return;
        leaderboardBody.innerHTML = '';
        const comprehensiveLeaderboard = JSON.parse(localStorage.getItem('comprehensiveLeaderboard') || '{}');
        const sortedLeaderboard = Object.entries(comprehensiveLeaderboard)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 10);
        if (sortedLeaderboard.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">লিডারবোর্ড এখনো খালি!</td></tr>'; return;
        }
        sortedLeaderboard.forEach((user, index) => {
            const row = document.createElement('tr');
            let icon = '';
            if (index === 0) icon = '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i> ';
            else if (index === 1) icon = '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i> ';
            else if (index === 2) icon = '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i> ';
            row.innerHTML = `<td>${icon}${index + 1}</td><td>${user.name}</td><td>${user.totalScore}</td>`;
            leaderboardBody.appendChild(row);
        });
    };
    if (clearLeaderboardBtn) {
        clearLeaderboardBtn.addEventListener('click', () => {
            if (confirm('আপনি কি লিডারবোর্ডের সমস্ত ডেটা মুছে ফেলতে চান?')) {
                localStorage.removeItem('comprehensiveLeaderboard');
                loadLeaderboard(); updateDashboard(); alert('লিডারবোর্ড সফলভাবে পরিষ্কার করা হয়েছে।');
            }
        });
    }

    // --- FAQ, Modal, Notepad, Back-to-Top ---
    const faqItems = document.querySelectorAll('.faq-question');
    faqItems.forEach(item => { item.addEventListener('click', () => { /* ... */ }); });

    const formulaBtn = document.getElementById('formula-sheet-btn'),
          modal = document.getElementById('formula-modal');
    if (formulaBtn && modal) {
        formulaBtn.addEventListener('click', function() {
            modal.style.display = 'flex';
        });
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    const completedNotes = document.getElementById('completed-notes'),
          todoNotes = document.getElementById('todo-notes');
    const saveBtn = document.getElementById('save-notes-btn'),
          clearBtn = document.getElementById('clear-notes-btn');
    const loadNotes = () => { /* ... */ };
    if (saveBtn) { /* ... */ }
    if (clearBtn) { /* ... */ }
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) { window.onscroll = () => { /* ... */ }; }

    // ===================================================================
    // --- Study Timer with State Persistence (UPDATED SECTION) ---
    // ===================================================================
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-timer-btn');
    const pauseBtn = document.getElementById('pause-timer-btn');
    const resetBtn = document.getElementById('reset-timer-btn');
    const breakModal = document.getElementById('break-modal');
    const breakMessage = document.getElementById('break-message');
    const closeBreakModalBtn = document.getElementById('close-break-modal');

    if (timerDisplay) {
        const breakMessages = [
            "এক কাপ চা খেয়ে নাও ☕",
            "একটু হালকা ব্যায়াম করে নাও 💪",
            "ছাদে বা বারান্দায় একটু ঘুরে এসো 🚶‍♂️",
            "প্রিয় কোনো গান শুনে নাও 🎧",
            "চোখের বিশ্রাম দাও, দূরে কোথাও তাকাও 👀"
        ];
        let countdown;
        let timeLeft;
        let isPaused;

        function saveTimerState() {
            const timerState = {
                timeLeft: timeLeft,
                isPaused: isPaused,
                timestamp: Date.now()
            };
            localStorage.setItem('pomodoroTimerState', JSON.stringify(timerState));
        }
        function loadTimerState() {
            const savedState = JSON.parse(localStorage.getItem('pomodoroTimerState'));
            if (savedState) {
                const timePassed = Math.round((Date.now() - savedState.timestamp) / 1000);
                if (!savedState.isPaused) {
                    timeLeft = Math.max(0, savedState.timeLeft - timePassed);
                } else {
                    timeLeft = savedState.timeLeft;
                }
                isPaused = savedState.isPaused;
                if (timeLeft === 0) {
                    resetTimer(false);
                } else if (!isPaused) {
                    timer(timeLeft); 
                }
            } else {
                timeLeft = 1500;
                isPaused = true;
            }
            displayTimeLeft(timeLeft);
        }
        function displayTimeLeft(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            timerDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        }
        function showBreakPopup() {
            const randomIndex = Math.floor(Math.random() * breakMessages.length);
            breakMessage.textContent = breakMessages[randomIndex];
            breakModal.style.display = 'flex';
            setTimeout(() => breakModal.classList.add('active'), 10);
            localStorage.removeItem('pomodoroTimerState');
        }
        function closeBreakModal() {
            breakModal.classList.remove('active');
            setTimeout(() => {
                breakModal.style.display = 'none';
                resetTimer(false);
            }, 300);
        }
        function timer(seconds) {
            isPaused = false;
            clearInterval(countdown);
            const then = Date.now() + seconds * 1000;
            displayTimeLeft(seconds);
            countdown = setInterval(() => {
                const secondsLeft = Math.round((then - Date.now()) / 1000);
                if (secondsLeft < 0) {
                    clearInterval(countdown);
                    showBreakPopup();
                    return;
                }
                displayTimeLeft(secondsLeft);
                timeLeft = secondsLeft;
            }, 1000);
        }
        function resetTimer(confirmReset = true) {
            if (confirmReset && !confirm("আপনি কি টাইমার রিসেট করতে চান?")) return;
            clearInterval(countdown);
            timeLeft = 1500;
            isPaused = true;
            displayTimeLeft(timeLeft);
            localStorage.removeItem('pomodoroTimerState');
        }
        if (startBtn) startBtn.addEventListener('click', () => timer(timeLeft));
        if (pauseBtn) pauseBtn.addEventListener('click', () => {
            clearInterval(countdown);
            isPaused = true;
            saveTimerState();
        });
        if (resetBtn) resetBtn.addEventListener('click', () => resetTimer(true));
        if (closeBreakModalBtn) closeBreakModalBtn.addEventListener('click', closeBreakModal);
        if (breakModal) breakModal.addEventListener('click', (e) => { if (e.target === breakModal) closeBreakModal(); });
        window.addEventListener('beforeunload', () => {
            if (!isPaused) {
                saveTimerState();
            }
        });
        loadTimerState();
    }

    // --- Initial Load of other components ---
    if (typeof loadNotes === 'function') loadNotes();
    if (typeof loadLeaderboard === 'function') loadLeaderboard();
    if (typeof updateDashboard === 'function') updateDashboard();
});