/** The notification sound.
 *
 * It is made in the browser from two soft notes, so there is no audio file to
 * load or to get wrong. Browsers will not play sound until the person has
 * touched the page, so the first click or key press wakes the audio up
 * (`unlockAudio`); after that a notification can chime on its own. */

const KEY = "pdm.notificationSound"

let context: AudioContext | null = null
const listeners = new Set<() => void>()

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  context ??= new Ctor()
  return context
}

/** Wakes the audio up. Called from the first click or key press. */
export function unlockAudio() {
  const c = audio()
  if (c && c.state === "suspended") c.resume().catch(() => {})
}

/** Whether the person has the sound on. On unless they turned it off. */
export function soundEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "off"
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off")
  } catch {}
  listeners.forEach((listen) => listen())
}

/** For `useSyncExternalStore`: tells a component when the setting changes, here
 * or in another tab. */
export function subscribeSound(onChange: () => void) {
  listeners.add(onChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) onChange()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", onStorage)
  }
}

/** Two short, quiet notes, the second a fourth above the first. */
export function playNotificationSound() {
  const c = audio()
  if (!c) return
  if (c.state === "suspended") c.resume().catch(() => {})

  const start = c.currentTime
  const notes = [
    { hz: 988, at: 0 },
    { hz: 1319, at: 0.11 },
  ]
  for (const { hz, at } of notes) {
    const tone = c.createOscillator()
    const volume = c.createGain()
    tone.type = "sine"
    tone.frequency.value = hz
    // A quick rise and a soft fall, so it chimes and does not click.
    volume.gain.setValueAtTime(0, start + at)
    volume.gain.linearRampToValueAtTime(0.14, start + at + 0.015)
    volume.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.3)
    tone.connect(volume).connect(c.destination)
    tone.start(start + at)
    tone.stop(start + at + 0.32)
  }
}
