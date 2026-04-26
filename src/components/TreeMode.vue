<template>
  <div class="tree-mode">
    <!-- Active letter display -->
    <div class="active-display" :class="{ lit: activeLetter }">
      <div class="active-letter">{{ activeLetter || '?' }}</div>
      <div class="active-code">
        <span
          v-for="(sym, i) in activePath"
          :key="i"
          class="path-sym"
          :class="sym === '.' ? 'dot-sym' : 'dash-sym'"
        >{{ sym === '.' ? '·' : '—' }}</span>
        <span v-if="!activeLetter" class="hint">tap any letter</span>
      </div>
    </div>

    <!-- SVG Tree -->
    <div class="tree-wrap">
      <svg :viewBox="`0 0 ${W} ${H}`" class="tree-svg">
        <!-- Edges first -->
        <line
          v-for="e in edges"
          :key="e.id"
          :x1="e.x1" :y1="e.y1"
          :x2="e.x2" :y2="e.y2"
          :class="['edge', isEdgeActive(e) ? 'edge-on' : 'edge-off']"
        />

        <!-- Nodes -->
        <g
          v-for="n in nodes"
          :key="n.code"
          :transform="`translate(${n.x},${n.y})`"
          class="node-g"
          @click="selectNode(n)"
        >
          <!-- Rectangle for dash-reached nodes, circle for dot-reached (or root) -->
          <rect
            v-if="n.isDash"
            :x="-NW/2" :y="-NH/2"
            :width="NW" :height="NH" :rx="3"
            :class="['node-shape', nodeClass(n)]"
          />
          <circle
            v-else
            :r="NR"
            :class="['node-shape', nodeClass(n)]"
          />
          <text
            text-anchor="middle"
            dominant-baseline="central"
            :class="['node-text', n.code === activeCode ? 'node-text-active' : '']"
          >{{ n.char || '' }}</text>
        </g>

        <!-- Antenna / start icon at top -->
        <g :transform="`translate(${W/2}, 22)`" @click="clearActive" class="node-g">
          <polygon points="0,-10 7,4 -7,4" class="antenna-tri" />
          <line x1="0" y1="4" x2="0" y2="12" class="antenna-stem" />
          <line x1="-6" y1="8" x2="6" y2="8" class="antenna-stem" />
        </g>

        <!-- Dot / Dash legend at bottom -->
        <g :transform="`translate(20, ${H-16})`">
          <circle r="6" cx="6" cy="0" class="legend-circle" />
          <text x="18" y="4" class="legend-txt">= dot (·)</text>
          <rect x="74" y="-6" width="16" height="12" rx="2" class="legend-rect" />
          <text x="96" y="4" class="legend-txt">= dash (—)</text>
        </g>
      </svg>
    </div>

    <!-- Alpha picker -->
    <div class="alpha-strip">
      <button
        v-for="([char, code]) in morseEntries"
        :key="char"
        class="alpha-chip"
        :class="{ selected: activeLetter === char }"
        @click="selectByChar(char, code)"
      >{{ char }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MORSE_CODE } from '../data/morse.js'
import { useMorseAudio } from '../composables/useAudio.js'

const { playMorse } = useMorseAudio()

// ── Layout constants ──────────────────────────────────────────
const W = 360
const LEVEL_H = 68
const TOP_PAD = 52
const NR = 10          // circle radius
const NW = 18          // rect width
const NH = 12          // rect height

// How many levels deep? max morse length is 4 for letters, 5 for digits
const DEPTH = 4
const H = TOP_PAD + DEPTH * LEVEL_H + 50

// ── Build tree layout ─────────────────────────────────────────
function buildLayout() {
  const nodeMap = []  // { char, code, isDash, x, y }
  const edgeList = [] // { id, x1,y1,x2,y2, active-check }

  // root is dot-type (circle), at top center
  const root = { char: null, code: '', isDash: false, x: W / 2, y: TOP_PAD }
  nodeMap.push(root)

  function place(code, xMin, xMax, depth) {
    const x = (xMin + xMax) / 2
    const y = TOP_PAD + depth * LEVEL_H
    const isDash = code.length > 0 && code[code.length - 1] === '-'
    const char = MORSE_CODE_REVERSE[code] || null
    const n = { char, code, isDash, x, y }
    nodeMap.push(n)

    // parent coords
    const parentCode = code.slice(0, -1)
    const parent = nodeMap.find(p => p.code === parentCode)
    if (parent) {
      edgeList.push({
        id: code,
        x1: parent.x, y1: parent.y,
        x2: x, y2: y,
        childCode: code,
        parentCode,
        type: code[code.length - 1]
      })
    }

    if (depth < DEPTH) {
      const dotCode = code + '.'
      const dashCode = code + '-'
      const mid = (xMin + xMax) / 2
      if (hasDescendant(dotCode))  place(dotCode,  xMin, mid,  depth + 1)
      if (hasDescendant(dashCode)) place(dashCode, mid,  xMax, depth + 1)
    }
  }

  // dot branch from root
  place('.', 0, W / 2, 1)
  // dash branch from root
  place('-', W / 2, W, 1)

  return { nodes: nodeMap, edges: edgeList }
}

// Reverse map: morse code → letter
const MORSE_CODE_REVERSE = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
)

// Check if a code prefix has any letter descendant
function hasDescendant(prefix) {
  return Object.values(MORSE_CODE).some(v => v === prefix || v.startsWith(prefix))
}

const { nodes, edges } = buildLayout()
const morseEntries = Object.entries(MORSE_CODE)

// ── State ─────────────────────────────────────────────────────
const activeLetter = ref('')
const activeCode = ref('')
const activePath = computed(() => activeCode.value ? activeCode.value.split('') : [])

function nodeClass(n) {
  if (!activeCode.value) return 'node-default'
  if (n.code === activeCode.value) return 'node-active'
  if (activeCode.value.startsWith(n.code) && n.code.length > 0) return 'node-path'
  return 'node-default'
}

function isEdgeActive(e) {
  return !!activeCode.value && activeCode.value.startsWith(e.childCode)
}

function selectNode(n) {
  if (!n.char) return
  activeLetter.value = n.char
  activeCode.value = n.code
  playMorse(n.code)
}

function selectByChar(char, code) {
  activeLetter.value = char
  activeCode.value = code
  playMorse(code)
}

function clearActive() {
  activeLetter.value = ''
  activeCode.value = ''
}
</script>

<style scoped>
.tree-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 0.5rem 2rem;
}

/* ── Active display ── */
.active-display {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.7rem 2rem;
  border: 1px solid rgba(0,255,170,0.12);
  border-radius: 12px;
  background: rgba(0,255,170,0.02);
  width: 100%;
  max-width: 340px;
  justify-content: center;
  transition: all 0.3s;
}
.active-display.lit {
  border-color: rgba(0,255,170,0.4);
  background: rgba(0,255,170,0.06);
}
.active-letter {
  font-family: 'Orbitron', monospace;
  font-size: 2.4rem;
  font-weight: 900;
  color: #00ffaa;
  min-width: 36px;
  text-align: center;
  text-shadow: 0 0 16px rgba(0,255,170,0.4);
}
.active-code {
  display: flex;
  gap: 6px;
  align-items: center;
}
.path-sym {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.8rem;
  line-height: 1;
}
.dot-sym  { color: #00ffaa; }
.dash-sym { color: #00ccff; letter-spacing: -2px; }
.hint {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.2);
  letter-spacing: 0.08em;
}

/* ── Tree SVG wrapper ── */
.tree-wrap {
  width: 100%;
  max-width: 400px;
}
.tree-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* ── Edges ── */
.edge {
  stroke-width: 1.2;
  transition: stroke 0.25s, stroke-width 0.25s;
}
.edge-off {
  stroke: rgba(255,255,255,0.1);
}
.edge-on {
  stroke: #00ffaa;
  stroke-width: 2.2;
  filter: drop-shadow(0 0 3px rgba(0,255,170,0.5));
}

/* ── Node shapes ── */
.node-g {
  cursor: pointer;
}
.node-shape {
  transition: all 0.25s;
}
.node-default {
  fill: rgba(255,255,255,0.04);
  stroke: rgba(255,255,255,0.22);
  stroke-width: 1;
}
.node-path {
  fill: rgba(0,255,170,0.1);
  stroke: rgba(0,255,170,0.55);
  stroke-width: 1.2;
}
.node-active {
  fill: rgba(0,255,170,0.28);
  stroke: #00ffaa;
  stroke-width: 1.8;
  filter: drop-shadow(0 0 5px rgba(0,255,170,0.7));
}

/* ── Node text ── */
.node-text {
  font-family: 'Orbitron', monospace;
  font-size: 7px;
  font-weight: 700;
  fill: rgba(255,255,255,0.65);
  pointer-events: none;
}
.node-text-active {
  fill: #fff;
  font-size: 8px;
}

/* ── Antenna ── */
.antenna-tri {
  fill: rgba(0,255,170,0.35);
  stroke: #00ffaa;
  stroke-width: 1.2;
  cursor: pointer;
}
.antenna-stem {
  stroke: #00ffaa;
  stroke-width: 1.5;
  stroke-linecap: round;
}

/* ── Legend ── */
.legend-circle {
  fill: rgba(255,255,255,0.05);
  stroke: rgba(255,255,255,0.3);
  stroke-width: 1;
}
.legend-rect {
  fill: rgba(255,255,255,0.05);
  stroke: rgba(255,255,255,0.3);
  stroke-width: 1;
}
.legend-txt {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  fill: rgba(255,255,255,0.3);
}

/* ── Alpha strip ── */
.alpha-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  max-width: 360px;
  padding: 0 0.5rem;
}
.alpha-chip {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.6);
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.alpha-chip:active,
.alpha-chip:hover {
  background: rgba(0,255,170,0.1);
  border-color: rgba(0,255,170,0.4);
  color: #00ffaa;
}
.alpha-chip.selected {
  background: rgba(0,255,170,0.2);
  border-color: #00ffaa;
  color: #00ffaa;
  box-shadow: 0 0 8px rgba(0,255,170,0.25);
}
</style>