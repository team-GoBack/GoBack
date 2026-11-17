// [백엔드 팀] 투표+댓글, 궁금해요 "주문 창구" (진짜: Supabase)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
//
// 블라인드 규칙은 DB(RLS)가 막아줌. 볼 수 없는 댓글은 DB가 아예 안 보내줌.
// - 내가 투표+댓글 쓰기 전엔 남의 댓글·결과가 빈 배열로 옴
// - 궁금해요를 누르면 보이지만, 그 사연엔 투표 불가
// - 사연자 본인은 항상 다 보임
// - 투표 마감 후엔 누구나(로그인 안 해도) 다 보이고, 아무도 투표 못 함
import { supabase } from './supabase.js'
import { getCurrentUser } from './auth.js'

// DB의 도우미 함수 호출 (is_post_author, has_responded 등) → true/false
async function ask(fn, postId) {
  const { data, error } = await supabase.rpc(fn, { pid: Number(postId) })
  if (error) {
    console.error(`${fn} 실패:`, error)
    return false
  }
  return Boolean(data)
}

// 내 상태 (화면이 "무엇을 보여줄지" 정할 때 쓰는 함수)
// 넣는 값: postId
// 돌려주는 값: { isAuthor, hasResponded, hasPeeked, isClosed, canVote, canSeeResponses }
export async function getMyStatus(postId) {
  const me = await getCurrentUser()
  const [isAuthor, hasResponded, hasPeeked, isClosed] = await Promise.all([
    me ? ask('is_post_author', postId) : false,
    me ? ask('has_responded', postId) : false,
    me ? ask('has_peeked', postId) : false,
    ask('is_post_closed', postId),
  ])

  return {
    isAuthor,
    hasResponded,
    hasPeeked,
    isClosed,
    canVote: Boolean(me) && !isAuthor && !hasResponded && !hasPeeked && !isClosed,
    canSeeResponses: isAuthor || hasResponded || hasPeeked || isClosed,
  }
}

// 투표+댓글 쓰기 (1인 1회, 수정·삭제 불가)
// 넣는 값: postId, optionId (고른 선택지), content (내 경험/의견)
// 돌려주는 값: { ok: true } 또는 { ok: false, reason }
//   reason: 'login' (로그인 필요) | 'author' (내 사연) | 'already' (이미 함)
//           | 'peeked' (궁금해요 누름) | 'closed' (마감됨) | 'empty' (댓글 비어 있음) | 'error' (그 밖의 실패)
export async function respond(postId, optionId, content) {
  const me = await getCurrentUser()
  if (!me) return { ok: false, reason: 'login' }
  if (!content || !content.trim()) return { ok: false, reason: 'empty' }

  const status = await getMyStatus(postId)
  if (status.isAuthor) return { ok: false, reason: 'author' }
  if (status.hasResponded) return { ok: false, reason: 'already' }
  if (status.hasPeeked) return { ok: false, reason: 'peeked' }
  if (status.isClosed) return { ok: false, reason: 'closed' }

  const { error } = await supabase
    .from('responses')
    .insert({ post_id: Number(postId), option_id: Number(optionId), content: content.trim() })
  if (error) {
    console.error('respond 실패:', error)
    if (error.code === '23505') return { ok: false, reason: 'already' } // 1인 1투표에 걸림
    return { ok: false, reason: 'error' }
  }
  return { ok: true }
}

// 궁금해요 (누르면 댓글은 보이지만 이 사연엔 투표 불가. 되돌릴 수 없음)
// ※ 누르기 전에 화면에서 "투표 못 하게 돼요" 경고를 꼭 띄울 것
// 넣는 값: postId
// 돌려주는 값: { ok: true } 또는 { ok: false, reason }  ('login' | 'author' | 'already' | 'error')
export async function peek(postId) {
  const me = await getCurrentUser()
  if (!me) return { ok: false, reason: 'login' }

  const status = await getMyStatus(postId)
  if (status.isAuthor) return { ok: false, reason: 'author' }
  if (status.hasResponded || status.hasPeeked) return { ok: false, reason: 'already' }

  const { error } = await supabase.from('peeks').insert({ post_id: Number(postId) })
  if (error) {
    console.error('peek 실패:', error)
    if (error.code === '23505') return { ok: false, reason: 'already' }
    return { ok: false, reason: 'error' }
  }
  return { ok: true }
}

// 댓글 목록 (블라인드 적용)
// 넣는 값: postId
// 돌려주는 값: [{ id, option_id, content, created_at, is_mine }, ...]  (오래된 순)
//   볼 수 없는 상태면 빈 배열 []
//   ※ 누가 썼는지(user_id)는 절대 안 줌. 화면엔 "익명"으로 표시
export async function getResponses(postId) {
  const status = await getMyStatus(postId)
  if (!status.canSeeResponses) return []

  const me = await getCurrentUser()
  const { data, error } = await supabase
    .from('responses')
    .select('id, option_id, content, created_at, user_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('getResponses 실패:', error)
    return []
  }
  return data.map((r) => ({
    id: r.id,
    option_id: r.option_id,
    content: r.content,
    created_at: r.created_at,
    is_mine: Boolean(me) && r.user_id === me.id,
  }))
}

// 투표 결과 (블라인드 적용)
// 넣는 값: postId
// 돌려주는 값: [{ option_id, label, count }, ...]  (선택지 순서대로)
//   볼 수 없는 상태면 빈 배열 []
export async function getResults(postId) {
  const status = await getMyStatus(postId)
  if (!status.canSeeResponses) return []

  const [{ data: options, error: optionError }, { data: rows, error }] = await Promise.all([
    supabase.from('options').select('id, label, sort_order').eq('post_id', postId).order('sort_order'),
    supabase.from('responses').select('option_id').eq('post_id', postId),
  ])
  if (optionError || error) {
    console.error('getResults 실패:', optionError ?? error)
    return []
  }
  return options.map((option) => ({
    option_id: option.id,
    label: option.label,
    count: rows.filter((r) => r.option_id === option.id).length,
  }))
}
