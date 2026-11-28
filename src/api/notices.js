// [백엔드 팀] 알림 "주문 창구" (배너용)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
//
// 알림 두 가지 (후일담 알림은 epilogues.js)
// - 사연자용: 마감됐는데 아직 마무리 안 한 내 사연 → 마무리하면 저절로 사라짐 (읽음 기록 없음)
// - 투표자용: 내가 투표한 사연의 최종 선택이 공개됨 → 한 번 보면 꺼짐 (읽음 기준은 이 브라우저, 계정마다 따로)
import { supabase } from './supabase.js'
import { getCurrentUser } from './auth.js'

// 마감됐는데 아직 마무리 안 한 내 사연 (마감 최신순)
// 돌려주는 값: [{ post_id, title }, ...]  (로그인 안 했으면 [])
export async function getPendingFinishes() {
  const me = await getCurrentUser()
  if (!me) return []

  const { data, error } = await supabase
    .from('posts')
    .select('id, title')
    .eq('user_id', me.id)
    .is('chosen_option_id', null)
    .lte('vote_ends_at', new Date().toISOString())
    .order('vote_ends_at', { ascending: false })
  if (error) {
    console.error('getPendingFinishes 실패:', error)
    return []
  }
  return data.map((p) => ({ post_id: p.id, title: p.title }))
}

// ===== 최종 선택 공개 알림 =====
function seenKey(userId) {
  return `goback:finish-seen:${userId}`
}

function readSeenAt(userId) {
  try {
    return localStorage.getItem(seenKey(userId))
  } catch {
    return null
  }
}

function writeSeenAt(userId) {
  try {
    localStorage.setItem(seenKey(userId), new Date().toISOString())
  } catch {
    // 저장이 안 되는 브라우저면 다음에 또 보일 뿐, 문제없음
  }
}

// 내가 투표한 사연 중, 아직 안 본 "최종 선택 공개"
// 돌려주는 값: [{ post_id, title, finished_at, is_best }, ...]  (Best Pick 먼저, 그다음 최신순. 로그인 안 했으면 [])
//   - is_best: 내 댓글이 Best Pick으로 뽑혔는지
// 이 브라우저에서 처음 확인하는 계정이면 예전 것은 건너뛰고 지금부터 알림
export async function getUnreadFinishes() {
  const me = await getCurrentUser()
  if (!me) return []

  const seenAt = readSeenAt(me.id)
  if (!seenAt) {
    writeSeenAt(me.id)
    return []
  }

  const { data: mine, error: myError } = await supabase
    .from('responses')
    .select('id, post_id')
    .eq('user_id', me.id)
  if (myError) {
    console.error('getUnreadFinishes 실패:', myError)
    return []
  }
  const postIds = mine.map((r) => r.post_id)
  if (postIds.length === 0) return []

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, finished_at, best_response_id')
    .in('id', postIds)
    .gt('finished_at', seenAt)
    .order('finished_at', { ascending: false })
  if (error) {
    console.error('getUnreadFinishes 실패:', error)
    return []
  }
  const myResponseIds = new Set(mine.map((r) => r.id))
  const list = data.map((p) => ({
    post_id: p.id,
    title: p.title,
    finished_at: p.finished_at,
    is_best: myResponseIds.has(p.best_response_id),
  }))
  return [...list.filter((x) => x.is_best), ...list.filter((x) => !x.is_best)]
}

// 지금까지의 최종 선택 공개를 "봤음"으로 표시 (배너 닫기·보러 가기 누를 때)
export async function markFinishesRead() {
  const me = await getCurrentUser()
  if (me) writeSeenAt(me.id)
}

// ===== 알림 공통 도우미 (배너와 종이 같이 씀) =====

// 알림 하나를 구분하는 이름표
export function noticeKey(kind, item) {
  return kind === 'epilogue' ? `epilogue:${item.id}` : `${kind}:${item.post_id}`
}

// 하나씩 지운 알림 기억 (이 브라우저, 계정마다 따로)
function dismissedStorageKey(userId) {
  return `goback:notice-dismissed:${userId}`
}

export function loadDismissed(userId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(dismissedStorageKey(userId)) || '[]'))
  } catch {
    return new Set()
  }
}

export function saveDismissed(userId, set) {
  try {
    localStorage.setItem(dismissedStorageKey(userId), JSON.stringify([...set].slice(-500)))
  } catch {
    // 저장이 안 되는 브라우저면 다음에 또 보일 뿐, 문제없음
  }
}

// 알림 상태가 바뀌었다고 화면 전체에 알리기 (배너에서 지우면 종 숫자도 바로 갱신)
export const NOTICES_CHANGED = 'goback:notices-changed'
export function notifyNoticesChanged() {
  window.dispatchEvent(new Event(NOTICES_CHANGED))
}

// 최근 알림 기록 (읽은 것 포함, 최신순)
// 넣는 값: limit (기본 30)
// 돌려주는 값: [{ kind, post_id, title, at, is_best?, id? }, ...]  (로그인 안 했으면 [])
//   - kind: 'pending'(마무리 필요) | 'finish'(최종 선택 공개) | 'epilogue'(새 후일담)
//   - at: 알림이 생긴 시각
export async function getNoticeHistory(limit = 30) {
  const me = await getCurrentUser()
  if (!me) return []

  const [{ data: mine }, { data: myPending }] = await Promise.all([
    supabase.from('responses').select('id, post_id').eq('user_id', me.id),
    supabase
      .from('posts')
      .select('id, title, vote_ends_at')
      .eq('user_id', me.id)
      .is('chosen_option_id', null)
      .lte('vote_ends_at', new Date().toISOString()),
  ])

  const items = (myPending ?? []).map((p) => ({ kind: 'pending', post_id: p.id, title: p.title, at: p.vote_ends_at }))

  const postIds = (mine ?? []).map((r) => r.post_id)
  if (postIds.length > 0) {
    const myResponseIds = new Set(mine.map((r) => r.id))
    const [{ data: finished }, { data: epilogues }] = await Promise.all([
      supabase.from('posts').select('id, title, finished_at, best_response_id').in('id', postIds).not('finished_at', 'is', null),
      supabase.from('epilogues').select('id, post_id, created_at, posts(title)').in('post_id', postIds),
    ])
    for (const p of finished ?? []) {
      items.push({ kind: 'finish', post_id: p.id, title: p.title, at: p.finished_at, is_best: myResponseIds.has(p.best_response_id) })
    }
    for (const e of epilogues ?? []) {
      items.push({ kind: 'epilogue', id: e.id, post_id: e.post_id, title: e.posts?.title ?? '사연', at: e.created_at })
    }
  }

  return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit)
}
