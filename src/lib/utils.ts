export function euro(centen: number): string {
  return (centen / 100).toFixed(2).replace('.', ',')
}

export function centen(euroAmount: number): number {
  return Math.round(euroAmount * 100)
}
