<template>
  <div class="app" :class="{ 'dark': true }">
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-dot">·</span>
          <span class="logo-dash">—</span>
          <span class="logo-text">MORSE<span class="logo-accent">TOUCH</span></span>
        </div>
        <div class="header-right" v-if="activeTab === 'quiz'">
          <button class="reset-btn" @click="resetScore">↺</button>
        </div>
      </div>
    </header>

    <!-- Tab content -->
    <main class="app-main">
      <Transition name="slide" mode="out-in">
        <TapMode v-if="activeTab === 'tap'" key="tap" />
        <TreeMode v-else-if="activeTab === 'tree'" key="tree" />
        <QuizMode v-else-if="activeTab === 'quiz'" key="quiz" />
      </Transition>
    </main>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="nav-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TapMode from './components/TapMode.vue'
import TreeMode from './components/TreeMode.vue'
import QuizMode from './components/QuizMode.vue'
import { useScore } from './composables/useScore.js'

const { reset: resetScore } = useScore()

const activeTab = ref('tap')

const tabs = [
  { id: 'tap', icon: '◉', label: 'TAP' },
  { id: 'tree', icon: '⬡', label: 'TREE' },
  { id: 'quiz', icon: '⚡', label: 'QUIZ' },
]
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a0f;
  --bg2: #0f0f18;
  --green: #00ffaa;
  --blue: #00ccff;
  --text: #e8e8f0;
  --text-dim: rgba(232,232,240,0.4);
  --border: rgba(255,255,255,0.08);
}

html, body {
  background: var(--bg);
  color: var(--text);
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}

#app {
  height: 100%;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--bg);
  overflow: hidden;
  position: relative;
}

/* Subtle grid bg */
.app::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,255,170,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,170,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

.app-header {
  flex-shrink: 0;
  padding: 0.9rem 1.2rem 0.7rem;
  border-bottom: 1px solid var(--border);
  background: rgba(10,10,15,0.9);
  backdrop-filter: blur(10px);
  z-index: 10;
  position: relative;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 480px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-dot {
  font-size: 1.4rem;
  color: var(--green);
  line-height: 1;
}

.logo-dash {
  font-size: 1rem;
  color: var(--blue);
  margin-right: 4px;
}

.logo-text {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.08em;
}

.logo-accent {
  color: var(--green);
}

.reset-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 1rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Share Tech Mono', monospace;
  transition: all 0.15s;
}

.reset-btn:hover, .reset-btn:active {
  border-color: rgba(255,68,85,0.4);
  color: #ff4455;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav {
  flex-shrink: 0;
  display: flex;
  border-top: 1px solid var(--border);
  background: rgba(10,10,15,0.95);
  backdrop-filter: blur(10px);
  z-index: 10;
  padding-bottom: max(env(safe-area-inset-bottom), 8px);
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0.6rem 0.5rem 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--green);
  border-radius: 2px 2px 0 0;
  transform: scaleX(0);
  transition: transform 0.2s;
}

.nav-btn.active::after {
  transform: scaleX(1);
}

.nav-icon {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.3);
  transition: all 0.2s;
}

.nav-label {
  font-family: 'Orbitron', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: rgba(255,255,255,0.3);
  transition: all 0.2s;
}

.nav-btn.active .nav-icon,
.nav-btn.active .nav-label {
  color: var(--green);
}

.nav-btn:active .nav-icon,
.nav-btn:active .nav-label {
  color: rgba(0,255,170,0.7);
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.slide-enter-from { opacity: 0; transform: translateY(10px); }
.slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
