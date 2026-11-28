// [공통] 선택지별 색 (팀장 관리)
// 선택지 순서(0~4)마다 정해진 색. 투표 결과 막대와 댓글의 "내가 고른 선택지" 태그가 같은 색을 씀
// 색 값은 index.css의 --opt-1 ~ --opt-5

// 넣는 값: 선택지 순서 (0부터). 모르면 -1
// 돌려주는 값: 'var(--opt-N)' 글자 (모르면 회색)
export function optionColor(index) {
  if (index == null || index < 0) return 'var(--muted)'
  return `var(--opt-${(index % 5) + 1})`
}

// 선택지 순서 → 글자 (0 → A, 1 → B ...). 모르면 '?'
export function optionLetter(index) {
  if (index == null || index < 0) return '?'
  return String.fromCharCode(65 + index)
}

// 긴 선택지 글자를 줄임 (댓글 태그용). 전체 글자는 title로 보여 주면 됨
export function shortLabel(label, max = 15) {
  const text = String(label ?? '')
  return text.length > max ? `${text.slice(0, max)}…` : text
}
