// [백엔드 팀] 사연 관련 "주문 창구" (진짜: Supabase)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
// 누가 무엇을 할 수 있는지는 DB 규칙(RLS)이 최종으로 막아줌. 여기서는 친절한 안내용으로 한 번 더 확인.
import { supabase } from './supabase.js'
import { getCurrentUser } from './auth.js'

// 사연별 투표 수 { 사연id: 개수 } (블라인드와 상관없이 개수만 셈)
async function getCounts() {
  const { data, error } = await supabase.rpc('response_counts')
  if (error) {
    console.error('response_counts 실패:', error)
    return {}
  }
  const counts = {}
  for (const row of data) counts[row.post_id] = Number(row.count)
  return counts
}

// 사연 목록 가져오기
// 넣는 값: tag (없으면 전체)
// 돌려주는 값: [{ id, title, content, tag, vote_ends_at, response_count }, ...]  (최신순)
export async function getPosts(tag) {
  let query = supabase
    .from('posts')
    .select('id, title, content, tag, vote_ends_at')
    .order('created_at', { ascending: false })

  if (tag) query = query.eq('tag', tag)

  const [{ data, error }, counts] = await Promise.all([query, getCounts()])
  if (error) {
    console.error('getPosts 실패:', error)
    return []
  }
  return data.map((post) => ({ ...post, response_count: counts[post.id] ?? 0 }))
}

// 사연 하나 가져오기
// 넣는 값: id
// 돌려주는 값: { id, title, content, tag, vote_ends_at, wants_epilogue, response_count } 또는 null
//   - wants_epilogue: 사연자가 후일담을 약속했는지 (true/false)
export async function getPost(id) {
  const [{ data, error }, counts] = await Promise.all([
    supabase.from('posts').select('id, title, content, tag, vote_ends_at, wants_epilogue').eq('id', id).maybeSingle(),
    getCounts(),
  ])
  if (error || !data) {
    if (error) console.error('getPost 실패:', error)
    return null
  }
  return { ...data, response_count: counts[data.id] ?? 0 }
}

// 사연 쓰기 (선택지도 같이)
// 넣는 값: { title, content, tag, voteHours, wantsEpilogue, options }
//   - voteHours: 투표 시간(시간 단위 숫자). 1시간=1, 1일=24, 1주일=168
//   - wantsEpilogue: 후일담 받기 체크 (true/false)
//   - options: 선택지 글자 배열. 예) ['한다', '안 한다', '모르겠다']  (2개 이상)
// 돌려주는 값: { id } (새 사연 번호) 또는 null (실패)
export async function createPost({ title, content, tag, voteHours, wantsEpilogue, options }) {
  const me = await getCurrentUser()
  if (!me) {
    console.error('createPost 실패: 로그인 필요')
    return null
  }
  const labels = (options ?? []).map((label) => String(label).trim()).filter(Boolean)
  if (!title || !content || !tag || !voteHours || labels.length < 2) {
    console.error('createPost 실패: 빠진 값이 있거나 선택지가 2개 미만')
    return null
  }

  const voteEndsAt = new Date(Date.now() + voteHours * 60 * 60 * 1000).toISOString()

  // 1) 사연 넣기 (user_id는 DB가 로그인한 사람으로 자동으로 채움)
  const { data: post, error } = await supabase
    .from('posts')
    .insert({ title, content, tag, vote_ends_at: voteEndsAt, wants_epilogue: Boolean(wantsEpilogue) })
    .select('id')
    .single()
  if (error) {
    console.error('createPost 실패:', error)
    return null
  }

  // 2) 선택지 넣기. 실패하면 방금 넣은 사연도 지워서 반쪽짜리 사연이 남지 않게
  const { error: optionError } = await supabase
    .from('options')
    .insert(labels.map((label, i) => ({ post_id: post.id, label, sort_order: i + 1 })))
  if (optionError) {
    console.error('createPost 선택지 실패:', optionError)
    await supabase.from('posts').delete().eq('id', post.id)
    return null
  }

  return { id: post.id }
}

// 사연 수정 (투표 마감 전, 내 사연만)
// 넣는 값: id, { title, content, tag }  (바꿀 것만 넣어도 됨)
// 돌려주는 값: true (성공) / false (실패: 마감됐거나 내 사연이 아님)
export async function updatePost(id, changes) {
  const patch = {}
  if (changes.title !== undefined) patch.title = changes.title
  if (changes.content !== undefined) patch.content = changes.content
  if (changes.tag !== undefined) patch.tag = changes.tag

  const { data, error } = await supabase
    .from('posts')
    .update(patch)
    .eq('id', id)
    .gt('vote_ends_at', new Date().toISOString())
    .select('id')
  if (error) console.error('updatePost 실패:', error)
  return !error && data.length === 1
}

// 사연 삭제 (투표 마감 전, 내 사연만)
// 넣는 값: id
// 돌려주는 값: true (성공) / false (실패)
export async function deletePost(id) {
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select('id')
  if (error) console.error('deletePost 실패:', error)
  return !error && data.length === 1
}

// 지금 바로 마감 (투표 마감 전, 내 사연만)
// 넣는 값: id
// 돌려주는 값: true (성공) / false (실패: 이미 마감됐거나 내 사연이 아님)
export async function closePost(id) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('posts')
    .update({ vote_ends_at: now })
    .eq('id', id)
    .gt('vote_ends_at', now) // 아직 마감 전인 사연만
    .select('id')
  if (error) console.error('closePost 실패:', error)
  return !error && data.length === 1
}

// 선택지 가져오기
// 넣는 값: postId
// 돌려주는 값: [{ id, label, order }, ...]  (order 순)
export async function getOptions(postId) {
  const { data, error } = await supabase
    .from('options')
    .select('id, label, sort_order')
    .eq('post_id', postId)
    .order('sort_order')
  if (error) {
    console.error('getOptions 실패:', error)
    return []
  }
  return data.map((o) => ({ id: o.id, label: o.label, order: o.sort_order }))
}

// 사연자 마무리: 내 선택 공개 + Best Pick 댓글 1개 선정 (마감 후, 내 사연만, 한 번만)
// 넣는 값: id, optionId (내가 고른 선택지), bestResponseId (Best Pick 댓글 id)
// 돌려주는 값: true (성공) / false (실패)
export async function finishPost(id, optionId, bestResponseId) {
  const { data, error } = await supabase
    .from('posts')
    .update({ chosen_option_id: optionId, best_response_id: bestResponseId })
    .eq('id', id)
    .lte('vote_ends_at', new Date().toISOString()) // 마감 후에만
    .is('chosen_option_id', null) // 아직 마무리 안 한 사연만
    .select('id')
  if (error) console.error('finishPost 실패:', error)
  return !error && data.length === 1
}

// 사연자 마무리 결과 보기
// 넣는 값: id
// 돌려주는 값: { chosen_option_id, best_response_id } 또는 null (아직 마무리 안 함)
export async function getFinish(id) {
  const { data, error } = await supabase
    .from('posts')
    .select('chosen_option_id, best_response_id')
    .eq('id', id)
    .maybeSingle()
  if (error || !data || data.chosen_option_id === null) return null
  return data
}
