export const MORSE_CODE = {
  'A': '.-',   'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-',  'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
  'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-',  'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
  'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
}

export const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
)

// Build tree structure for visual display
export function buildMorseTree() {
  const root = { char: null, dot: null, dash: null, code: '' }
  
  for (const [char, code] of Object.entries(MORSE_CODE)) {
    let node = root
    for (const symbol of code) {
      if (symbol === '.') {
        if (!node.dot) node.dot = { char: null, dot: null, dash: null, code: node.code + '.' }
        node = node.dot
      } else {
        if (!node.dash) node.dash = { char: null, dot: null, dash: null, code: node.code + '-' }
        node = node.dash
      }
    }
    node.char = char
  }
  return root
}
