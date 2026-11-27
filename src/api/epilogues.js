// [백엔드 팀] 후일담 "주문 창구" (진짜: Supabase)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
//
// 후일담 = 투표가 끝난 뒤 사연자가 "그래서 어떻게 됐는지" 남기는 후기. 한 사연에 여러 번 쓸 수 있음.
// DB 규칙(RLS)
// - 쓰기: 그 사연의 작성자만, 투표가 마감된 사연에만
// - 읽기: 마감된 사연이면 누구나
import { supabase } from './supabase.js'
import { getCurrentUser } from './auth.js'

// 후일담 목록 (오래된 순)
// 넣는 값: postId
// 돌려주는 값: [{ id, content, created_at }, ...]  (없거나 볼 수 없으면 [])
export async function getEpilogues(postId) {
  const { data, error } = await supabase
    .from('epilogues')
    .select('id, content, created_at')
    .eq('post_id', Number(postId))
    .order('created_at', { ascending: true })
  if (error) {
    console.error('getEpilogues 실패:', error)
    return []
  }
  return data
}

// 후일담 쓰기 (마감된 내 사연만, 여러 번 가능)
// 넣는 값: postId, content (1~1000자)
// 돌려주는 값: true (성공) / false (실패: 로그인 안 함, 내 사연 아님, 마감 전, 빈 내용)
export async function writeEpilogue(postId, content) {
  const text = String(content ?? '').trim()
  if (!text) return false

  const { error } = await supabase
    .from('epilogues')
    .insert({ post_id: Number(postId), content: text })
  if (error) console.error('writeEpilogue 실패:', error)
  return !error
}

// ===== 새 후일담 알림 (배너용) =====
// "어디까지 봤는지"는 이 브라우저에 기억해 둠 (계정마다 따로)
function seenKey(userId) {
  return `goback:epilogue-seen:${userId}`
}

function readSeenAt(userId) {
  try {
    return localStorage.getItem(seenKey(userId))
  } catch {
    return null
  }
}

// 내가 투표한 사연에 올라온, 아직 안 본 후일담
// 넣는 값: 없음
// 돌려주는 값: [{ id, post_id, title, created_at }, ...]  (최신순, 로그인 안 했으면 [])
export async function getUnreadEpilogues() {
  const me = await getCurrentUser()
  if (!me) return []

  // 1) 내가 투표한 사연 번호들 (RLS: 내 투표는 항상 보임)
  const { data: mine, error: myError } = await supabase
    .from('responses')
    .select('post_id')
    .eq('user_id', me.id)
  if (myError) {
    console.error('getUnreadEpilogues 실패:', myError)
    return []
  }
  const postIds = mine.map((row) => row.post_id)
  if (postIds.length === 0) return []

  // 2) 그 사연들의 후일담 중 마지막으로 본 시각 이후 것만
  let query = supabase
    .from('epilogues')
    .select('id, post_id, created_at, posts(title)')
    .in('post_id', postIds)
    .order('created_at', { ascending: false })

  const seenAt = readSeenAt(me.id)
  if (seenAt) query = query.gt('created_at', seenAt)

  const { data, error } = await query
  if (error) {
    console.error('getUnreadEpilogues 실패:', error)
    return []
  }
  return data.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    title: row.posts?.title ?? '사연',
    created_at: row.created_at,
  }))
}

// 지금까지 올라온 후일담을 "봤음"으로 표시 (배너 닫기·보러 가기 누를 때)
// 넣는 값: 없음
// 돌려주는 값: 없음
export async function markEpiloguesRead() {
  const me = await getCurrentUser()
  if (!me) return
  try {
    localStorage.setItem(seenKey(me.id), new Date().toISOString())
  } catch {
    // 저장이 안 되는 브라우저면 다음에 또 보일 뿐, 문제없음
  }
}
