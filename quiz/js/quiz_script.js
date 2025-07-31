// ===============================================
// সহজ এবং ফাইনাল কুইজ স্ক্রিপ্ট (সংস্করণ ৪.০ - সঠিক পাথ সহ)
// ===============================================

function setupModeToggle(){const e=document.getElementById("mode-toggle"),t=document.body;function o(o){"dark-mode"===o?(t.classList.add("dark-mode"),t.classList.remove("day-mode"),e&&(e.innerHTML='<i class="fas fa-sun"></i>')):(t.classList.add("day-mode"),t.classList.remove("dark-mode"),e&&(e.innerHTML='<i class="fas fa-moon"></i>'))}const d=localStorage.getItem("quizAppMode");d?o(d):o("day-mode"),e&&e.addEventListener("click",()=>{t.classList.contains("day-mode")?(o("dark-mode"),localStorage.setItem("quizAppMode","dark-mode")):(o("day-mode"),localStorage.setItem("quizAppMode","day-mode"))})}let currentQuestionIndex=0,selectedAnswer=null,score=0,correctCount=0,wrongCount=0,correctSound=new Audio("sounds/correct.mp3"),wrongSound=new Audio("sounds/wrong.mp3"),userAnswers=[],shuffledOptionsPerQuestion=[],timerInterval;function shuffleArray(e){for(let t=e.length-1;t>0;t--){const o=Math.floor(Math.random()*(t+1));[e[t],e[o]]=[e[o],e[t]]}}function startTimer(){let e=0,t=0;clearInterval(timerInterval);let o=()=>{e++,60===e&&(e=0,t++),document.getElementById("timer").textContent=`${String(t).padStart(2,"0")}:${String(e).padStart(2,"0")}`};document.getElementById("timer").textContent="00:00",timerInterval=setInterval(o,1e3)}function showQuestion(){selectedAnswer=null,startTimer();const e=document.getElementById("quiz-container"),t=quizSet.questions[currentQuestionIndex];let o=[...t.options];shuffleArray(o),shuffledOptionsPerQuestion[currentQuestionIndex]=o;const d=o.indexOf(t.options[t.answer]);e.innerHTML=`<div class="mb-4"><h2 class="text-xl md:text-2xl font-semibold mb-6 text-center">প্রশ্ন ${currentQuestionIndex+1}: ${t.question}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${o.map((e,t)=>`<button class="option-btn" onclick="selectAnswer(${t}, ${d})" data-index="${t}"><span class="option-prefix">${String.fromCharCode(65+t)}.</span><span>${e}</span></button>`).join("")}</div></div><button id="nextBtn" onclick="nextQuestion()" class="action-btn w-full mt-6" disabled>পরবর্তী প্রশ্ন</button>`}window.selectAnswer=function(e,t){if(null!==selectedAnswer)return;clearInterval(timerInterval),selectedAnswer=e,document.querySelectorAll(".option-btn").forEach(e=>e.disabled=!0);const o=document.querySelector(`[data-index="${t}"]`);o.classList.add("correct"),e!==t?(document.querySelector(`[data-index="${e}"]`).classList.add("incorrect"),wrongCount++,wrongSound.play()):(correctCount++,correctSound.play()),userAnswers[currentQuestionIndex]=e,document.getElementById("correct-count").textContent=`✔️ ${correctCount}`,document.getElementById("wrong-count").textContent=`❌ ${wrongCount}`,document.getElementById("nextBtn").disabled=!1,document.getElementById("nextBtn").focus()};function nextQuestion(){null!==selectedAnswer&&(currentQuestionIndex++,selectedAnswer=null,currentQuestionIndex<quizSet.questions.length?showQuestion():showFinalResult())}function showFinalResult(){clearInterval(timerInterval),saveScoreToFirebase(correctCount);const e=document.getElementById("quiz-container");e.innerHTML=`<div class="text-center space-y-5"><h2 class="text-3xl font-bold text-green-600">🎉 কুইজ শেষ!</h2><p class="text-xl">আপনার স্কোর: <strong class="text-blue-600">${correctCount}</strong> / ${quizSet.questions.length}</p><div class="flex flex-wrap justify-center gap-3"><button onclick="showReview()" class="action-btn">রিভিউ দেখুন</button><button onclick="window.location.href='../user-dashboard.html'" class="action-btn green">ড্যাশবোর্ড দেখুন</button><button onclick="location.reload()" class="action-btn gray">🔁 আবার দিন</button></div></div>`}function showReview(){const e=document.getElementById("quiz-container");let t=`<div class="space-y-4"><h2 class="text-2xl font-bold text-center text-blue-700 mb-4">📚 কুইজ রিভিউ</h2>`;for(let o=0;o<quizSet.questions.length;o++){const d=quizSet.questions[o],n=userAnswers[o],s=shuffledOptionsPerQuestion[o],r=s.indexOf(d.options[d.answer]);let l=n===r,c=l?"review-correct":"review-incorrect";t+=`<div class="review-card text-left ${c}"><h3 class="font-semibold mb-2">📝 প্রশ্ন ${o+1}: ${d.question}</h3><p><strong>সঠিক উত্তর:</strong> ${d.options[d.answer]}</p>`,void 0!==n&&(t+=`<p><strong>আপনার উত্তর:</strong> <span class="font-bold ${l?"text-green-700":"text-red-700"}">${s[n]}</span></p>`),t+=`<p class="mt-2"><strong>ব্যাখ্যা:</strong> ${d.explanation||"কোনো ব্যাখ্যা নেই"}</p></div>`}t+='<div class="text-center mt-6"><button onclick="location.reload()" class="action-btn gray">🔁 আবার দিন</button></div></div>',e.innerHTML=t}function setupKeyboard(){document.addEventListener("keydown",function(e){if("INPUT"===document.activeElement.tagName||"TEXTAREA"===document.activeElement.tagName)return;"Enter"===e.key&&document.getElementById("nextBtn")&&!document.getElementById("nextBtn").disabled?nextQuestion():null===selectedAnswer&&e.key.match(/^[1-4a-d]$/i)&&(e.preventDefault(),function(e){const t={1:0,2:1,3:2,4:3,a:0,b:1,c:2,d:3}[e.toLowerCase()],o=document.querySelectorAll(".option-btn");t<o.length&&o[t].click()}(e.key))})}

async function saveScoreToFirebase(finalScore) {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        return;
    }
    const auth = firebase.auth();
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const db = firebase.firestore();
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === 'admin') {
                    console.log("Admin score not saved.");
                    return;
                }
            } catch (error) {
                console.error("Role check error:", error);
                return;
            }
            const scoreData = {
                userId: user.uid,
                email: user.email,
                subject: quizSet.subject || "অজানা বিষয়",
                chapter: quizSet.name || "সাধারণ কুইজ",
                score: finalScore,
                totalQuestions: quizSet.questions.length,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection("quiz_scores").add(scoreData);
                console.log("Score saved.");
            } catch (error) {
                console.error("Score saving error:", error);
            }
        } else {
            alert("স্কোর সেভ করার জন্য আপনাকে লগইন করতে হবে।");
            window.location.href = '../login.html';
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  setupModeToggle();
  if (typeof quizSet !== "undefined" && quizSet.questions) {
    document.getElementById("quiz-title").textContent = quizSet.name;
    shuffleArray(quizSet.questions);
    showQuestion();
    setupKeyboard();
  } else {
    document.getElementById("quiz-container").innerHTML = "<p>প্রশ্ন সেট লোড করা যায়নি।</p>";
  }
});
