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
