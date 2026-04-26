<template>
  <div class="quiz-mode">
    <!-- Score bar -->
    <div class="score-bar">
      <div class="score-item">
        <span class="score-label">CORRECT</span>
        <span class="score-val green">{{ correct }}</span>
      </div>
      <div class="score-item center">
        <span class="score-label">STREAK</span>
        <span class="score-val" :class="streak >= 5 ? 'gold' : 'white'">
          {{ streak }}{{ streak >= 5 ? ' 🔥' : '' }}
        </span>
      </div>
      <div class="score-item right">
        <span class="score-label">ACCURACY</span>
        <span class="score-val" :class="accuracy >= 80 ? 'green' : accuracy >= 50 ? 'yellow' : 'red'">
          {{ accuracy }}%
        </span>
      </div>
    </div>

    <!-- Question: show letter, user types morse -->
    <div class="question-card" :class="feedbackClass">
      <div class="question-label">Tap the morse for</div>
      <div class="question-char">{{ currentChar }}</div>
      <div class="question-hint" v-if="showHint">
        {{ MORSE_CODE[currentChar] }}
      </div>
    </div>

    <!-- User input display -->
    <div class="input-display">
      <span
        v-for="(sym, i) in userInput"
        :key="i"
        class="sym"
        :class="sym === '.' ? 'dot' : 'dash'"
      >{{ sym === '.' ? '·' : '—' }}</span>
      <span class="cursor-blink" v-if="userInput.length < 6">|</span>
    </div>

    <!-- Tap button -->
    <div class="tap-area">
      <button
        class="tap-btn"
        :class="{ pressed: isPressed }"
        @touchstart.prevent="onTouchStart"
        @touchend.prevent="onTouchEnd"
        @mousedown="onTouchStart"
        @mouseup="onTouchEnd"
        :disabled="!!feedbackClass"
      >
        <span class="tap-inner">
          <span class="tap-label">{{ isPressed ? '●' : 'TAP' }}</span>
          <span class="tap-hint">short = · &nbsp; long = —</span>
        </span>
      </button>
    </div>

    <!-- Action buttons -->
    <div class="actions">
      <button class="action-btn hint-btn" @click="toggleHint">
        {{ showHint ? '👁 Hide' : '💡 Hint' }}
      </button>
      <button class="action-btn submit-btn" @click="submitAnswer" :disabled="userInput.length === 0 || !!feedbackClass">
        ✓ Submit
      </button>
      <button class="action-btn skip-btn" @click="nextQuestion">
        ↻ Skip
      </button>
    </div>

    <!-- Feedback -->
    <transition name="fade">
      <div class="feedback-msg" v-if="feedbackMsg" :class="feedbackClass">
        {{ feedbackMsg }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MORSE_CODE } from '../data/morse.js'
import { useMorseAudio } from '../composables/useAudio.js'
import { useScore } from '../composables/useScore.js'

const { beep, playMorse } = useMorseAudio()
const { correct, wrong, streak, accuracy, addCorrect, addWrong } = useScore()

const chars = Object.keys(MORSE_CODE)
const currentChar = ref(randomChar())
const userInput = ref([])
const isPressed = ref(false)
const pressStart = ref(0)
const feedbackClass = ref('')
const feedbackMsg = ref('')
const showHint = ref(false)

const DOT_THRESHOLD = 250

function randomChar(exclude = null) {
  let chars2 = chars.filter(c => c !== exclude)
  return chars2[Math.floor(Math.random() * chars2.length)]
}

function onTouchStart() {
  if (feedbackClass.value) return
  isPressed.value = true
  pressStart.value = Date.now()
  beep(50)
}

function onTouchEnd() {
  if (!isPressed.value) return
  isPressed.value = false
  if (feedbackClass.value) return
  const duration = Date.now() - pressStart.value
  const symbol = duration < DOT_THRESHOLD ? '.' : '-'
  userInput.value.push(symbol)
  beep(symbol === '.' ? 80 : 240)

  // Auto-submit when max length reached
  const expectedLen = MORSE_CODE[currentChar.value].length
  if (userInput.value.length >= expectedLen) {
    setTimeout(submitAnswer, 400)
  }
}

function submitAnswer() {
  if (userInput.value.length === 0 || feedbackClass.value) return
  const answer = userInput.value.join('')
  const expected = MORSE_CODE[currentChar.value]
  if (answer === expected) {
    feedbackClass.value = 'correct'
    feedbackMsg.value = '✓ Correct!'
    addCorrect()
    playMorse(expected)
  } else {
    feedbackClass.value = 'wrong'
    feedbackMsg.value = `✗ Wrong! It's ${expected.replace(/\./g, '·').replace(/-/g, '—')}`
    addWrong()
    beep(500, 200)
  }
  setTimeout(() => {
    feedbackClass.value = ''
    feedbackMsg.value = ''
    nextQuestion()
  }, 1800)
}

function nextQuestion() {
  userInput.value = []
  showHint.value = false
  currentChar.value = randomChar(currentChar.value)
}

function toggleHint() {
  showHint.value = !showHint.value
}
</script>

<style scoped>
.quiz-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1rem 2rem;
}

.score-bar {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 380px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.score-item.center { align-items: center; }
.score-item.right { align-items: flex-end; }

.score-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.55rem;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.1em;
}
.score-val {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  font-weight: 700;
}
.score-val.green { color: #00ffaa; }
.score-val.yellow { color: #ffdd00; }
.score-val.red { color: #ff4455; }
.score-val.gold { color: #ffd700; }
.score-val.white { color: #fff; }

.question-card {
  text-align: center;
  padding: 1.5rem 2.5rem;
  border: 1px solid rgba(0,255,170,0.15);
  border-radius: 14px;
  background: rgba(0,255,170,0.03);
  width: 100%;
  max-width: 340px;
  transition: all 0.3s;
}

.question-card.correct {
  border-color: #00ffaa;
  background: rgba(0,255,170,0.1);
  box-shadow: 0 0 30px rgba(0,255,170,0.2);
}

.question-card.wrong {
  border-color: #ff4455;
  background: rgba(255,68,85,0.08);
  box-shadow: 0 0 30px rgba(255,68,85,0.15);
}

.question-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.question-char {
  font-family: 'Orbitron', monospace;
  font-size: 5rem;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 30px rgba(255,255,255,0.3);
}

.question-hint {
  margin-top: 0.5rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.2rem;
  color: rgba(0,255,170,0.7);
  letter-spacing: 4px;
}

.input-display {
  display: flex;
  gap: 8px;
  min-height: 2.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0.5rem 1rem;
  min-width: 200px;
  border-bottom: 1px solid rgba(0,255,170,0.2);
}

.sym {
  font-family: 'Share Tech Mono', monospace;
  font-size: 2rem;
  line-height: 1;
}
.sym.dot { color: #00ffaa; }
.sym.dash { color: #00ccff; letter-spacing: -2px; }

.cursor-blink {
  color: rgba(0,255,170,0.5);
  animation: blink 1s step-end infinite;
  font-size: 1.5rem;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

.tap-area {
  width: 100%;
  max-width: 340px;
  display: flex;
  justify-content: center;
}

.tap-btn {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 170, 0.4);
  background: radial-gradient(circle at 40% 35%, rgba(0, 255, 170, 0.08), rgba(0,0,0,0.6));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.08s ease;
  box-shadow: 0 0 30px rgba(0, 255, 170, 0.1), inset 0 0 30px rgba(0,0,0,0.3);
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  user-select: none;
}

.tap-btn:disabled {
  opacity: 0.3;
}

.tap-btn.pressed {
  transform: scale(0.93);
  border-color: #00ffaa;
  background: radial-gradient(circle at 40% 35%, rgba(0,255,170,0.25), rgba(0,20,10,0.8));
  box-shadow: 0 0 60px rgba(0,255,170,0.4), inset 0 0 20px rgba(0,255,170,0.1);
}

.tap-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.tap-label {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #00ffaa;
  letter-spacing: 0.15em;
}

.tap-hint {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.6rem;
  color: rgba(0,255,170,0.5);
}

.actions {
  display: flex;
  gap: 0.7rem;
}

.action-btn {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid;
}

.hint-btn {
  border-color: rgba(255,220,0,0.3);
  background: rgba(255,220,0,0.05);
  color: rgba(255,220,0,0.8);
}
.hint-btn:active, .hint-btn:hover {
  background: rgba(255,220,0,0.15);
}

.submit-btn {
  border-color: rgba(0,255,170,0.4);
  background: rgba(0,255,170,0.08);
  color: #00ffaa;
}
.submit-btn:active, .submit-btn:hover {
  background: rgba(0,255,170,0.2);
}
.submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.skip-btn {
  border-color: rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.5);
}
.skip-btn:active, .skip-btn:hover {
  background: rgba(255,255,255,0.08);
}

.feedback-msg {
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  letter-spacing: 0.05em;
}
.feedback-msg.correct {
  color: #00ffaa;
  background: rgba(0,255,170,0.1);
  border: 1px solid rgba(0,255,170,0.3);
}
.feedback-msg.wrong {
  color: #ff4455;
  background: rgba(255,68,85,0.1);
  border: 1px solid rgba(255,68,85,0.3);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
