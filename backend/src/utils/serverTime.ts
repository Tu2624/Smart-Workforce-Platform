let offsetMs = 0

export function getNow(): Date {
  return new Date(Date.now() + offsetMs)
}

export function getOffsetMs(): number {
  return offsetMs
}

export function setOffsetMs(ms: number): void {
  offsetMs = ms
}

export function resetOffset(): void {
  offsetMs = 0
}
