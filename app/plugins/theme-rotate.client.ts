interface ThemePalette {
  vars: Record<string, string>
}

const PALETTES: [ThemePalette, ...ThemePalette[]] = [
  {
    vars: {
      '--accent': '#0f7173',
      '--accent-2': '#2f6fed',
      '--accent-warm': '#ff5c3d',
      '--accent-warm-2': '#e67e22',
      '--success': '#198754',
      '--bg-orb-1': 'rgba(15, 113, 115, 0.22)',
      '--bg-orb-2': 'rgba(255, 92, 61, 0.18)',
      '--bg-base-1': '#f8fafc',
      '--bg-base-2': '#eef4f7',
      '--hero-orb-1': 'rgba(15, 113, 115, 0.2)',
      '--hero-orb-2': 'rgba(47, 111, 237, 0.07)'
    }
  },
  {
    vars: {
      '--accent': '#2c5e1a',
      '--accent-2': '#1f9d6a',
      '--accent-warm': '#d1495b',
      '--accent-warm-2': '#f08a24',
      '--success': '#2f9e44',
      '--bg-orb-1': 'rgba(44, 94, 26, 0.2)',
      '--bg-orb-2': 'rgba(240, 138, 36, 0.2)',
      '--bg-base-1': '#f7faf6',
      '--bg-base-2': '#edf6ef',
      '--hero-orb-1': 'rgba(31, 157, 106, 0.2)',
      '--hero-orb-2': 'rgba(209, 73, 91, 0.08)'
    }
  },
  {
    vars: {
      '--accent': '#5a2a83',
      '--accent-2': '#0c7b93',
      '--accent-warm': '#f26419',
      '--accent-warm-2': '#f6ae2d',
      '--success': '#2a9d8f',
      '--bg-orb-1': 'rgba(90, 42, 131, 0.2)',
      '--bg-orb-2': 'rgba(242, 100, 25, 0.18)',
      '--bg-base-1': '#f9f7fc',
      '--bg-base-2': '#edf4f8',
      '--hero-orb-1': 'rgba(90, 42, 131, 0.2)',
      '--hero-orb-2': 'rgba(12, 123, 147, 0.08)'
    }
  },
  {
    vars: {
      '--accent': '#8f2d56',
      '--accent-2': '#218380',
      '--accent-warm': '#f46036',
      '--accent-warm-2': '#f6aa1c',
      '--success': '#2b9348',
      '--bg-orb-1': 'rgba(143, 45, 86, 0.2)',
      '--bg-orb-2': 'rgba(246, 170, 28, 0.18)',
      '--bg-base-1': '#fcf7f9',
      '--bg-base-2': '#eef6f5',
      '--hero-orb-1': 'rgba(143, 45, 86, 0.2)',
      '--hero-orb-2': 'rgba(33, 131, 128, 0.08)'
    }
  }
]

const STORAGE_KEY = 'dailyboost.theme.index'

function pickPaletteIndex(): number {
  const lastRaw = window.sessionStorage.getItem(STORAGE_KEY)
  const last = Number(lastRaw)

  if (!Number.isFinite(last) || PALETTES.length < 2) {
    return Math.floor(Math.random() * PALETTES.length)
  }

  let next = Math.floor(Math.random() * PALETTES.length)

  // Стараемся не повторять палитру на соседних перезагрузках.
  if (next === last) {
    next = (next + 1) % PALETTES.length
  }

  return next
}

export default defineNuxtPlugin(() => {
  const root = document.documentElement
  const index = pickPaletteIndex()
  const palette = PALETTES[index] ?? PALETTES[0]

  for (const [key, value] of Object.entries(palette.vars)) {
    root.style.setProperty(key, value)
  }

  window.sessionStorage.setItem(STORAGE_KEY, String(index))
})
