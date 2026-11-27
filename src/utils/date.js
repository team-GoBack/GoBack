// [공통] 날짜 표시 도우미 (팀장 관리)
// 여러 화면에서 같은 모양으로 날짜를 보여주려고 한 곳에 모아 둠

// 시각을 "2026.11.27 13:55" 모양 글자로 바꿈
// 넣는 값: created_at 같은 시각 값 (문자열)
// 돌려주는 값: 글자 (값이 없거나 이상하면 '')
export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
