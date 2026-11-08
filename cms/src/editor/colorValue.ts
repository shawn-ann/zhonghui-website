const NAMED: Record<string, string> = {
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF0000',
  green: '#008000',
  blue: '#0000FF',
  gray: '#808080',
  grey: '#808080',
}

function toHex(part: string): string {
  return Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, '0')
}

/** 把编辑器里可能出现的颜色值统一成 #RRGGBB；无法识别时返回空字符串。 */
export function normalizeHexColor(value?: string | null): string {
  if (!value) return ''
  const raw = value.trim()
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const digits = hex[1]
    const full = digits.length === 3
      ? digits.split('').map((char) => char + char).join('')
      : digits
    return `#${full.toUpperCase()}`
  }
  const rgb = raw.match(/^rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/i)
  if (rgb) return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`.toUpperCase()
  return NAMED[raw.toLowerCase()] || ''
}
