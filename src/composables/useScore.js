import { ref, computed } from 'vue'

const correct = ref(0)
const wrong = ref(0)
const streak = ref(0)
const bestStreak = ref(0)

export function useScore() {
  const total = computed(() => correct.value + wrong.value)
  const accuracy = computed(() =>
    total.value === 0 ? 0 : Math.round((correct.value / total.value) * 100)
  )

  function addCorrect() {
    correct.value++
    streak.value++
    if (streak.value > bestStreak.value) bestStreak.value = streak.value
  }

  function addWrong() {
    wrong.value++
    streak.value = 0
  }

  function reset() {
    correct.value = 0
    wrong.value = 0
    streak.value = 0
    bestStreak.value = 0
  }

  return { correct, wrong, streak, bestStreak, total, accuracy, addCorrect, addWrong, reset }
}
