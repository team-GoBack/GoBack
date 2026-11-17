// [백엔드 팀] 투표+댓글, 궁금해요 "주문 창구"
// 지금은 전부 가짜 (fakeStore.js 메모리, 새로고침하면 사라짐)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
//
// 블라인드 규칙 (진짜 버전에선 DB가 막아줌. 가짜 버전도 똑같이 흉내 냄)
// - 내가 투표+댓글 쓰기 전엔 남의 댓글·결과가 빈 배열로 옴
// - 궁금해요를 누르면 보이지만, 그 사연엔 투표 불가
// - 사연자 본인은 항상 다 보임
// - 투표 마감 후엔 누구나 다 보이고, 아무도 투표 못 함
import { getCurrentUser } from './auth.js'
import { getPost } from './posts.js'
import { fakePosts, fakeOptions, fakeResponses, fakePeeks, newId, ensureSample } from './fakeStore.js'

// 내 상태 (화면이 "무엇을 보여줄지" 정할 때 쓰는 함수)
// 넣는 값: postId
// 돌려주는 값: {
//   isAuthor,         // 내가 쓴 사연인가
//   hasResponded,     // 이미 투표+댓글 했나
//   hasPeeked,        // 궁금해요 눌렀나
//   isClosed,         // 투표 마감됐나
//   canVote,          // 지금 투표할 수 있나
//   canSeeResponses,  // 남의 댓글·결과를 볼 수 있나
// }
export async function getMyStatus(postId) {
  ensureSample(postId)
  const key = String(postId)
  const me = await getCurrentUser()
  const post = await getPost(postId)

  const isAuthor = Boolean(me) && fakePosts.some((p) => p.id === Number(postId) && p.user_id === me.id)
  const hasResponded = Boolean(me) && fakeResponses[key].some((r) => r.user_id === me.id)
  const hasPeeked = Boolean(me) && fakePeeks[key].includes(me.id)
  const isClosed = post ? new Date(post.vote_ends_at) <= new Date() : false

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
//           | 'peeked' (궁금해요 누름) | 'closed' (마감됨) | 'empty' (댓글 비어 있음)
export async function respond(postId, optionId, content) {
  const me = await getCurrentUser()
  if (!me) return { ok: false, reason: 'login' }
  if (!content || !content.trim()) return { ok: false, reason: 'empty' }

  const status = await getMyStatus(postId)
  if (status.isAuthor) return { ok: false, reason: 'author' }
  if (status.hasResponded) return { ok: false, reason: 'already' }
  if (status.hasPeeked) return { ok: false, reason: 'peeked' }
  if (status.isClosed) return { ok: false, reason: 'closed' }

  fakeResponses[String(postId)].push({
    id: newId(),
    option_id: optionId,
    user_id: me.id,
    content: content.trim(),
    created_at: new Date().toISOString(),
  })
  return { ok: true }
}

// 궁금해요 (누르면 댓글은 보이지만 이 사연엔 투표 불가. 되돌릴 수 없음)
// ※ 누르기 전에 화면에서 "투표 못 하게 돼요" 경고를 꼭 띄울 것
// 넣는 값: postId
// 돌려주는 값: { ok: true } 또는 { ok: false, reason }  ('login' | 'author' | 'already')
export async function peek(postId) {
  const me = await getCurrentUser()
  if (!me) return { ok: false, reason: 'login' }

  const status = await getMyStatus(postId)
  if (status.isAuthor) return { ok: false, reason: 'author' }
  if (status.hasResponded || status.hasPeeked) return { ok: false, reason: 'already' }

  fakePeeks[String(postId)].push(me.id)
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
  return fakeResponses[String(postId)].map((r) => ({
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

  const key = String(postId)
  return [...fakeOptions[key]]
    .sort((a, b) => a.order - b.order)
    .map((option) => ({
      option_id: option.id,
      label: option.label,
      count: fakeResponses[key].filter((r) => r.option_id === option.id).length,
    }))
}
