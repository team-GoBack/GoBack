// [백엔드 팀] 가짜 데이터 보관함 (임시)
// 아직 Supabase 표가 없는 기능(선택지, 투표+댓글, 궁금해요 등)을
// 화면 팀이 먼저 만들 수 있게, 브라우저 메모리에 데이터를 잠깐 들고 있는 곳.
// 새로고침하면 처음 상태로 돌아감. 진짜 표가 생기면 이 파일은 지워짐.
// 화면 파일에서 이 파일을 직접 import 하지 말 것! (api 함수만 부르기)

// 가짜로 "작성한" 사연들 (createPost로 만든 것). id는 9001부터
export const fakePosts = []
let nextPostId = 9001
export function newPostId() {
  return nextPostId++
}

// postId → [{ id, label, order }]
export const fakeOptions = {}

// postId → [{ id, option_id, user_id, content, created_at }]
export const fakeResponses = {}

// postId → [user_id, ...]  (궁금해요 누른 사람)
export const fakePeeks = {}

// postId → { chosen_option_id, best_response_id }  (사연자 마무리)
export const fakeFinishes = {}

let nextId = 1
export function newId() {
  return nextId++
}

// 선택지/댓글이 아직 없는 사연이면 예시를 채워 넣음
// (Supabase에 있는 테스트 사연들도 상세 페이지를 만들어볼 수 있게)
export function ensureSample(postId) {
  const key = String(postId)
  if (!fakeOptions[key]) {
    fakeOptions[key] = [
      { id: newId(), label: '한다', order: 1 },
      { id: newId(), label: '안 한다', order: 2 },
    ]
  }
  if (!fakeResponses[key]) {
    const [a, b] = fakeOptions[key]
    fakeResponses[key] = [
      { id: newId(), option_id: a.id, user_id: 'someone-1', content: '저도 비슷한 고민 했는데 해서 후회 안 했어요', created_at: '2026-11-16T10:00:00+09:00' },
      { id: newId(), option_id: b.id, user_id: 'someone-2', content: '지금은 타이밍이 아닌 것 같아요', created_at: '2026-11-16T11:30:00+09:00' },
    ]
  }
  if (!fakePeeks[key]) fakePeeks[key] = []
}
