import { ref } from 'vue'

let audioCtx = null
let activeOscillator = null
let activeGain = null

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function useMorseAudio() {
  const isPlaying = ref(false)

  // Short one-shot beep (used for dots and playback)
  function beep(duration = 100, freq = 700) {
    const ctx = getAudioCtx()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.value = freq
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000 - 0.01)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  }

  // Start a continuous tone (used on press — for dash feedback)
  function startBeep(freq = 700) {
    stopBeep() // safety: kill any existing tone
    const ctx = getAudioCtx()
    activeOscillator = ctx.createOscillator()
    activeGain = ctx.createGain()
    activeOscillator.connect(activeGain)
    activeGain.connect(ctx.destination)
    activeOscillator.type = 'sine'
    activeOscillator.frequency.value = freq
    activeGain.gain.setValueAtTime(0, ctx.currentTime)
    activeGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.015) // fade in
    activeOscillator.start(ctx.currentTime)
  }

  // Stop the continuous tone with a short fade-out
  function stopBeep() {
    if (activeOscillator && activeGain) {
      const ctx = getAudioCtx()
      activeGain.gain.setValueAtTime(activeGain.gain.value, ctx.currentTime)
      activeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02) // fade out
      activeOscillator.stop(ctx.currentTime + 0.025)
      activeOscillator = null
      activeGain = null
    }
  }

  async function playMorse(code) {
    if (isPlaying.value) return
    isPlaying.value = true
    const unit = 120
    for (const symbol of code) {
      if (symbol === '.') {
        beep(unit)
        await sleep(unit + 60)
      } else if (symbol === '-') {
        beep(unit * 3)
        await sleep(unit * 3 + 60)
      }
    }
    isPlaying.value = false
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  return { beep, startBeep, stopBeep, playMorse, isPlaying }
}