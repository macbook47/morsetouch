<template>
  <div class="tap-mode">
    <div class="decoded-display">
      <div class="decoded-letter" :class="{ flash: flashCorrect, wrong: flashWrong }">
        {{ decodedChar || '?' }}
      </div>
      <div class="sequence-display">
        <span
          v-for="(sym, i) in sequence"
          :key="i"
          class="symbol"
          :class="sym === '.' ? 'dot' : 'dash'"
        >{{ sym === '.' ? '·' : '—' }}</span>
        <span v-if="sequence.length === 0" class="hint-text">tap to start</span>
      </div>
    </div>

    <!-- Big tap button -->
    <div class="tap-area">
      <button
        class="tap-btn"
        :class="{ pressed: isPressed }"
        @touchstart.prevent="onTouchStart"
        @touchend.prevent="onTouchEnd"
        @mousedown="onTouchStart"
        @mouseup="onTouchEnd"
      >
        <span class="tap-inner">
          <span class="tap-label">{{ isPressed ? '●' : 'TAP' }}</span>
          <span class="tap-hint">short = · &nbsp; long = —</span>
        </span>
      </button>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button class="ctrl-btn" @click="clearSequence">
        <span>⌫ Clear</span>
      </button>
      <button class="ctrl-btn play" @click="playCurrentMorse" :disabled="sequence.length === 0 || isPlaying">
        <span>{{ isPlaying ? '♪ Playing…' : '▶ Play' }}</span>
      </button>
    </div>

    <!-- Alphabet reference -->
    <div class="reference-grid">
      <div
        v-for="([char, code]) in morseList"
        :key="char"
        class="ref-item"
        :class="{ highlight: decodedChar === char }"
        @click="selectChar(char, code)"
      >
        <span class="ref-char">{{ char }}</span>
        <span class="ref-code">{{ code.replace(/\./g, '·').replace(/-/g, '—') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { MORSE_CODE, REVERSE_MORSE } from '../data/morse.js'
import { useMorseAudio } from '../composables/useAudio.js'

const { beep, startBeep, stopBeep, playMorse, isPlaying } = useMorseAudio()

const sequence = ref([])
const isPressed = ref(false)
const pressStart = ref(0)
const flashCorrect = ref(false)
const flashWrong = ref(false)
const DOT_THRESHOLD = 250 // ms

let clearTimer = null

const morseList = Object.entries(MORSE_CODE)

const decodedChar = computed(() => {
  if (sequence.value.length === 0) return ''
  const code = sequence.value.join('')
  return REVERSE_MORSE[code] || null
})

function onTouchStart() {
  isPressed.value = true
  pressStart.value = Date.now()
  startBeep()               // ← continuous tone starts immediately on press
  clearTimeout(clearTimer)
}

function onTouchEnd() {
  if (!isPressed.value) return
  isPressed.value = false
  stopBeep()                // ← tone stops on release

  const duration = Date.now() - pressStart.value
  const symbol = duration < DOT_THRESHOLD ? '.' : '-'
  sequence.value.push(symbol)

  // Short click feedback for dot (since the hold was too short to "hear")
  if (symbol === '.') beep(80)

  clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    if (decodedChar.value) {
      flashCorrect.value = true
      setTimeout(() => { flashCorrect.value = false }, 600)
    } else if (sequence.value.length > 0) {
      flashWrong.value = true
      setTimeout(() => { flashWrong.value = false }, 600)
    }
    setTimeout(() => { sequence.value = [] }, 1200)
  }, 1500)
}

function clearSequence() {
  sequence.value = []
  clearTimeout(clearTimer)
}

function playCurrentMorse() {
  if (sequence.value.length > 0) {
    playMorse(sequence.value.join(''))
  }
}

function selectChar(char, code) {
  sequence.value = code.split('')
  playMorse(code)
}

onUnmounted(() => clearTimeout(clearTimer))
</script>

<style scoped>
.tap-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1rem 2rem;
  min-height: calc(100vh - 80px);
}

.decoded-display {
  text-align: center;
  padding: 1.2rem 2rem;
  background: rgba(0, 255, 170, 0.03);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 12px;
  width: 100%;
  max-width: 340px;
  transition: all 0.2s;
}

.decoded-letter {
  font-family: 'Orbitron', monospace;
  font-size: 4rem;
  font-weight: 900;
  color: #00ffaa;
  line-height: 1;
  transition: all 0.2s;
  text-shadow: 0 0 20px rgba(0, 255, 170, 0.5);
}

.decoded-letter.flash {
  color: #fff;
  text-shadow: 0 0 40px #00ffaa, 0 0 80px #00ffaa;
  transform: scale(1.1);
}

.decoded-letter.wrong {
  color: #ff4455;
  text-shadow: 0 0 20px rgba(255, 68, 85, 0.5);
}

.sequence-display {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 0.8rem;
  min-height: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.symbol {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.8rem;
  line-height: 1;
}

.symbol.dot {
  color: #00ffaa;
}

.symbol.dash {
  color: #00ccff;
  letter-spacing: -2px;
}

.hint-text {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.tap-area {
  width: 100%;
  max-width: 340px;
  display: flex;
  justify-content: center;
}

.tap-btn {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 170, 0.4);
  background: radial-gradient(circle at 40% 35%, rgba(0, 255, 170, 0.08), rgba(0, 0, 0, 0.6));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.08s ease;
  box-shadow: 0 0 30px rgba(0, 255, 170, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.3);
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  user-select: none;
}

.tap-btn.pressed {
  transform: scale(0.93);
  border-color: #00ffaa;
  background: radial-gradient(circle at 40% 35%, rgba(0, 255, 170, 0.25), rgba(0, 20, 10, 0.8));
  box-shadow: 0 0 60px rgba(0, 255, 170, 0.4), inset 0 0 20px rgba(0, 255, 170, 0.1);
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
  font-size: 1.8rem;
  font-weight: 700;
  color: #00ffaa;
  letter-spacing: 0.15em;
}

.tap-hint {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.65rem;
  color: rgba(0, 255, 170, 0.5);
  letter-spacing: 0.05em;
}

.controls {
  display: flex;
  gap: 0.8rem;
}

.ctrl-btn {
  padding: 0.6rem 1.4rem;
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 8px;
  background: rgba(0, 255, 170, 0.05);
  color: rgba(0, 255, 170, 0.8);
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.ctrl-btn:active, .ctrl-btn:hover {
  background: rgba(0, 255, 170, 0.15);
  border-color: #00ffaa;
}

.ctrl-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ctrl-btn.play {
  border-color: rgba(0, 204, 255, 0.3);
  color: rgba(0, 204, 255, 0.8);
  background: rgba(0, 204, 255, 0.05);
}

.ctrl-btn.play:active, .ctrl-btn.play:hover {
  background: rgba(0, 204, 255, 0.15);
  border-color: #00ccff;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  width: 100%;
  max-width: 380px;
}

.ref-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.ref-item:active, .ref-item:hover {
  background: rgba(0, 255, 170, 0.08);
  border-color: rgba(0, 255, 170, 0.3);
}

.ref-item.highlight {
  background: rgba(0, 255, 170, 0.12);
  border-color: #00ffaa;
  box-shadow: 0 0 10px rgba(0, 255, 170, 0.2);
}

.ref-char {
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.ref-code {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  color: rgba(0, 255, 170, 0.7);
  margin-top: 2px;
  letter-spacing: 1px;
}
</style>
