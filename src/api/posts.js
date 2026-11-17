// [백엔드 팀] 사연 관련 "주문 창구"
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
//
// 지금 상태
// - getPosts, getPost : 진짜 (Supabase posts 표)
// - 나머지            : 가짜 (fakeStore.js 메모리, 새로고침하면 사라짐)
import { supabase } from './supabase.js'
import { FAKE_ME, fakePosts, newPostId, fakeOptions, fakeResponses, fakeFinishes, newId, ensureSample } from './fakeStore.js'

function countResponses(postId) {
  return fakeResponses[String(postId)]?.length ?? 0
}

function findFakePost(id) {
  return fakePosts.find((post) => post.id === Number(id))
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

  const { data, error } = await query
  if (error) {
    console.error('getPosts 실패:', error)
    return []
  }

  // 임시: createPost로 만든 가짜 사연도 맨 앞에 같이 보여줌
  const fakes = fakePosts.filter((post) => !tag || post.tag === tag)
  const all = [...fakes, ...data]
  // response_count는 아직 투표 표가 없어서 가짜 댓글 수로 채움 (약속한 모양 유지)
  return all.map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    tag: post.tag,
    vote_ends_at: post.vote_ends_at,
    response_count: countResponses(post.id),
  }))
}

// 사연 하나 가져오기
// 넣는 값: id
// 돌려주는 값: { id, title, content, tag, vote_ends_at, response_count } 또는 null
export async function getPost(id) {
  const fake = findFakePost(id)
  if (fake) {
    return {
      id: fake.id,
      title: fake.title,
      content: fake.content,
      tag: fake.tag,
      vote_ends_at: fake.vote_ends_at,
      response_count: countResponses(fake.id),
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, content, tag, vote_ends_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    console.error('getPost 실패:', error)
    return null
  }
  return { ...data, response_count: countResponses(data.id) }
}

// [가짜] 사연 쓰기 (선택지도 같이)
// 넣는 값: { title, content, tag, voteHours, wantsEpilogue, options }
//   - voteHours: 투표 시간(시간 단위 숫자). 1시간=1, 1일=24, 1주일=168
//   - wantsEpilogue: 후일담 받기 체크 (true/false)
//   - options: 선택지 글자 배열. 예) ['한다', '안 한다', '모르겠다']  (2개 이상)
// 돌려주는 값: { id } (새 사연 번호) 또는 null (실패)
export async function createPost({ title, content, tag, voteHours, wantsEpilogue, options }) {
  if (!title || !content || !tag || !voteHours || !options || options.length < 2) {
    console.error('createPost 실패: 빠진 값이 있거나 선택지가 2개 미만')
    return null
  }

  const id = newPostId()
  const voteEndsAt = new Date(Date.now() + voteHours * 60 * 60 * 1000).toISOString()

  fakePosts.unshift({
    id,
    title,
    content,
    tag,
    vote_ends_at: voteEndsAt,
    wants_epilogue: Boolean(wantsEpilogue),
    user_id: FAKE_ME.id,
    created_at: new Date().toISOString(),
  })
  fakeOptions[String(id)] = options.map((label, i) => ({ id: newId(), label, order: i + 1 }))
  fakeResponses[String(id)] = []

  return { id }
}

// [가짜] 사연 수정 (투표 마감 전, 내 사연만)
// 넣는 값: id, { title, content, tag }  (바꿀 것만 넣어도 됨)
// 돌려주는 값: true (성공) / false (실패: 마감됐거나 내 사연이 아님)
export async function updatePost(id, changes) {
  const post = findFakePost(id)
  if (!post || post.user_id !== FAKE_ME.id) return false
  if (new Date(post.vote_ends_at) <= new Date()) return false

  if (changes.title !== undefined) post.title = changes.title
  if (changes.content !== undefined) post.content = changes.content
  if (changes.tag !== undefined) post.tag = changes.tag
  return true
}

// [가짜] 사연 삭제 (투표 마감 전, 내 사연만)
// 넣는 값: id
// 돌려주는 값: true (성공) / false (실패)
export async function deletePost(id) {
  const post = findFakePost(id)
  if (!post || post.user_id !== FAKE_ME.id) return false
  if (new Date(post.vote_ends_at) <= new Date()) return false

  fakePosts.splice(fakePosts.indexOf(post), 1)
  return true
}

// [가짜] 선택지 가져오기
// 넣는 값: postId
// 돌려주는 값: [{ id, label, order }, ...]  (order 순)
export async function getOptions(postId) {
  ensureSample(postId)
  return [...fakeOptions[String(postId)]].sort((a, b) => a.order - b.order)
}

// [가짜] 사연자 마무리: 내 선택 공개 + Best Pick 댓글 1개 선정 (마감 후, 내 사연만)
// 넣는 값: id, optionId (내가 고른 선택지), bestResponseId (Best Pick 댓글 id)
// 돌려주는 값: true (성공) / false (실패)
export async function finishPost(id, optionId, bestResponseId) {
  const post = findFakePost(id)
  if (!post || post.user_id !== FAKE_ME.id) return false
  if (new Date(post.vote_ends_at) > new Date()) return false // 아직 마감 전
  if (fakeFinishes[String(id)]) return false // 이미 마무리함

  fakeFinishes[String(id)] = { chosen_option_id: optionId, best_response_id: bestResponseId }
  return true
}

// [가짜] 사연자 마무리 결과 보기
// 넣는 값: id
// 돌려주는 값: { chosen_option_id, best_response_id } 또는 null (아직 마무리 안 함)
export async function getFinish(id) {
  return fakeFinishes[String(id)] ?? null
}
