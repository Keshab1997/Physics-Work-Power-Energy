// ===============================================
// --- Day/Night Mode Toggle & Auth Section ---
// ===============================================

firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {
    alert("এই কুইজ দিতে হলে আপনাকে লগইন করতে হবে!");
    window.location.href = "https://keshab1997.github.io/Study-With-Keshab/login.html";
  }
});

function setupModeToggle() {
    const modeToggleBtn = document.getElementById("mode-toggle");
    const body = document.body;
    function applyMode(mode) {
        if (mode === 'dark-mode') {
            body.classList.add('dark-mode'); body.classList.remove('day-mode');
            if (modeToggleBtn) modeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.classList.add('day-mode'); body.classList.remove('dark-mode');
            if (modeToggleBtn) modeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    const savedMode = localStorage.getItem('quizAppMode'); // শুধুমাত্র থিম মোড সেভ রাখা হলো
    applyMode(savedMode || 'day-mode');
    if (modeToggleBtn) {
        modeToggleBtn.addEventListener("click", () => {
            const newMode = body.classList.contains('day-mode') ? 'dark-mode' : 'day-mode';
            applyMode(newMode);
            localStorage.setItem('quizAppMode', newMode);
        });
    }
}

// ===============================================
// --- Core Quiz Logic Section ---
// ===============================================
let currentQuestionIndex = 0, selectedAnswer = null, correctCount = 0, wrongCount = 0;
let correctSound = new Audio("../sounds/correct.mp3"), wrongSound = new Audio("../sounds/wrong.mp3");
let userAnswers = [], shuffledOptionsPerQuestion = [];
let timerInterval;

function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
function startTimer() { let seconds = 0; let minutes = 0; clearInterval(timerInterval); function updateTimer() { seconds++; if (seconds === 60) { seconds = 0; minutes++; } const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; document.getElementById("timer").textContent = formattedTime; } document.getElementById("timer").textContent = "00:00"; timerInterval = setInterval(updateTimer, 1000); }

function showQuestion() {
    selectedAnswer = null;
    startTimer();
    const container = document.getElementById("quiz-container");
    const q = quizSet.questions[currentQuestionIndex];
    let shuffledOptions = [...q.options];
    shuffleArray(shuffledOptions);
    shuffledOptionsPerQuestion[currentQuestionIndex] = shuffledOptions;
    const correctAnswerIndex = shuffledOptions.indexOf(q.options[q.answer]);
    container.innerHTML = `
        <div class="mb-4">
            <h2 class="text-xl md:text-2xl font-semibold mb-6 text-center">প্রশ্ন ${currentQuestionIndex + 1}: ${q.question}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${shuffledOptions.map((opt, i) => `
                    <button class="option-btn" onclick="selectAnswer(${i}, ${correctAnswerIndex})" data-index="${i}">
                        <span class="option-prefix">${String.fromCharCode(65 + i)}.</span>
                        <span>${opt}</span>
                    </button>
                `).join("")}
            </div>
        </div>
        <button id="nextBtn" onclick="nextQuestion()" class="action-btn w-full mt-6" disabled>পরবর্তী প্রশ্ন</button>
    `;
}

window.selectAnswer = function(selectedIndex, correctBtnIndex) {
    if (selectedAnswer !== null) return;
    clearInterval(timerInterval);
    selectedAnswer = selectedIndex;
    document.querySelectorAll(".option-btn").forEach((btn) => (btn.disabled = true));
    const correctBtn = document.querySelector(`[data-index="${correctBtnIndex}"]`);
    correctBtn.classList.add("correct");

    if (selectedIndex !== correctBtnIndex) {
        document.querySelector(`[data-index="${selectedIndex}"]`).classList.add("incorrect");
        wrongCount++;
        wrongSound.play();
    } else {
        correctCount++;
        correctSound.play();
    }
    userAnswers[currentQuestionIndex] = selectedIndex;
    document.getElementById("correct-count").textContent = `✔️ ${correctCount}`;
    document.getElementById("wrong-count").textContent = `❌ ${wrongCount}`;
    document.getElementById("nextBtn").disabled = false;
    document.getElementById("nextBtn").focus();
};

function nextQuestion() {
    if (selectedAnswer === null) return;
    currentQuestionIndex++;
    if (currentQuestionIndex < quizSet.questions.length) {
        showQuestion();
    } else {
        showFinalResult();
    }
}

// ===============================================
// --- showFinalResult Function (Fully Firebase based) ---
// ===============================================
function showFinalResult() {
    clearInterval(timerInterval);
    
    // ফলাফল স্বয়ংক্রিয়ভাবে Firebase-এ সেভ করা
    if (quizSet.chapterName && quizSet.setName) {
        saveDetailedQuizResult(
            quizSet.chapterName, 
            quizSet.setName, 
            correctCount, 
            wrongCount, 
            quizSet.questions.length
        );
    } else {
        console.error("`quizSet.chapterName` or `quizSet.setName` is not defined. Score cannot be saved.");
    }

    // ফলাফল দেখানোর জন্য নতুন, পরিষ্কার UI
    const container = document.getElementById("quiz-container");
    container.innerHTML = `
        <div class="text-center space-y-5">
            <h2 class="text-3xl font-bold text-green-600">🎉 কুইজ শেষ!</h2>
            <p class="text-xl">আপনার স্কোর: <strong class="text-blue-600">${correctCount}</strong> / ${quizSet.questions.length}</p>
            <p class="text-gray-600 dark:text-gray-300">আপনার ফলাফল স্বয়ংক্রিয়ভাবে সেভ করা হয়েছে।</p>
            <div class="flex flex-wrap justify-center gap-3">
                <button onclick="showReview()" class="action-btn green">রিভিউ দেখুন</button>
                <button onclick="window.location.href = '../index.html';" class="action-btn">ড্যাশবোর্ডে ফিরে যান</button>
                <button onclick="location.reload()" class="action-btn gray">🔁 আবার দিন</button>
            </div>
        </div>
    `;
}

function showReview() {
    const container = document.getElementById("quiz-container");
    let reviewHTML = `<div class="space-y-4"><h2 class="text-2xl font-bold text-center text-blue-700 mb-4">📚 কুইজ রিভিউ</h2>`;
    quizSet.questions.forEach((q, i) => {
        const userAnswerIndex = userAnswers[i];
        const shuffledOptions = shuffledOptionsPerQuestion[i];
        const correctAnswerIndex = shuffledOptions.indexOf(q.options[q.answer]);
        let isCorrect = userAnswerIndex === correctAnswerIndex;
        reviewHTML += `
            <div class="review-card text-left ${isCorrect ? "review-correct" : "review-incorrect"}">
                <h3 class="font-semibold mb-2">📝 প্রশ্ন ${i + 1}: ${q.question}</h3>
                <p><strong>সঠিক উত্তর:</strong> ${q.options[q.answer]}</p>
                <p><strong>আপনার উত্তর:</strong> <span class="font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}">${shuffledOptions[userAnswerIndex] ?? 'উত্তর দেননি'}</span></p>
                <p class="mt-2"><strong>ব্যাখ্যা:</strong> ${q.explanation || "কোনো ব্যাখ্যা নেই"}</p>
            </div>
        `;
    });
    reviewHTML += `<div class="text-center mt-6"><button onclick="location.reload()" class="action-btn gray">🔁 আবার দিন</button></div></div>`;
    container.innerHTML = reviewHTML;
}

// ===============================================
// --- NEW & ADVANCED: Detailed Firebase Saving Function ---
// ===============================================
/**
 * এই ফাংশনটি অধ্যায় এবং কুইজ সেটের বিস্তারিত ফলাফল Firestore-এর 'users' কালেকশনে সেভ করে।
 * @param {string} chapterName - অধ্যায়ের নাম (e.g., "কার্য, ক্ষমতা ও শক্তি")
 * @param {string} setName - কুইজ সেটের নাম (e.g., "Set 1")
 * @param {number} correctCount - সঠিক উত্তরের সংখ্যা
 * @param {number} wrongCount - ভুল উত্তরের সংখ্যা
 * @param {number} totalQuestions - মোট প্রশ্ন সংখ্যা
 */
async function saveDetailedQuizResult(chapterName, setName, correctCount, wrongCount, totalQuestions) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("User not logged in. Cannot save score.");
        return;
    }

    const chapterKey = chapterName.replace(/\s/g, '_');
    const setKey = setName.replace(/\s/g, '_');
    const userRef = firebase.firestore().collection('users').doc(user.uid);

    try {
        await firebase.firestore().runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.exists ? userDoc.data() : {};
            
            // পুরোনো ডেটা আনা
            const oldChapterData = userData.chapters?.[chapterKey] || {};
            const oldSetData = oldChapterData.quiz_sets?.[setKey] || {};

            // যদি এই কুইজ সেটটি আগে দেওয়া হয়ে থাকে, তাহলে পুরোনো স্কোর বাদ দিয়ে নতুনটা যোগ হবে
            const scoreChange = correctCount - (oldSetData.score || 0);
            const correctChange = correctCount - (oldSetData.correct || 0);
            const wrongChange = wrongCount - (oldSetData.wrong || 0);
            const isNewAttempt = !oldSetData.score;

            // নতুন ডেটা তৈরি করা
            const updatedData = {
                displayName: user.displayName || 'Unknown User',
                email: user.email,
                chapters: {
                    ...userData.chapters,
                    [chapterKey]: {
                        totalScore: (oldChapterData.totalScore || 0) + scoreChange,
                        totalCorrect: (oldChapterData.totalCorrect || 0) + correctChange,
                        totalWrong: (oldChapterData.totalWrong || 0) + wrongChange,
                        completedQuizzesCount: (oldChapterData.completedQuizzesCount || 0) + (isNewAttempt ? 1 : 0),
                        quiz_sets: {
                            ...oldChapterData.quiz_sets,
                            [setKey]: {
                                score: correctCount,
                                correct: correctCount,
                                wrong: wrongCount,
                                totalQuestions: totalQuestions,
                                lastAttempt: firebase.firestore.FieldValue.serverTimestamp()
                            }
                        }
                    }
                }
            };

            if (userDoc.exists) {
                transaction.update(userRef, updatedData);
            } else {
                transaction.set(userRef, updatedData);
            }
        });
        console.log("Detailed quiz result saved to Firebase successfully!");
    } catch (error) {
        console.error("Error saving detailed quiz result to Firebase: ", error);
    }
}

// ===============================================
// --- Keyboard & App Initialization ---
// ===============================================
function setupKeyboard() { /* ... Your existing keyboard code ... */ }
document.addEventListener("DOMContentLoaded", () => {
    setupModeToggle();
    if (typeof quizSet !== "undefined" && quizSet.questions) {
        document.getElementById("quiz-title").textContent = quizSet.name;
        shuffleArray(quizSet.questions);
        showQuestion();
        setupKeyboard();
    } else {
        document.getElementById("quiz-container").innerHTML = "<p class='text-red-600 font-bold text-center'>দুঃখিত, প্রশ্ন সেট লোড করা যায়নি।</p>";
    }
});