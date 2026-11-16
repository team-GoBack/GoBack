// [백엔드 팀] 사연 관련 "주문 창구"
// 지금은 가짜 데이터를 돌려줌. 나중에 안쪽만 Supabase로 바꾸고,
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)

const FAKE_POSTS = [
  {
    id: 1,
    title: '고백할까 말까',
    content: '3년 동안 친구로 지낸 사람이 있는데...',
    tag: '연애',
    vote_ends_at: '2026-11-20T21:00:00+09:00',
    response_count: 12,
  },
  {
    id: 2,
    title: '휴학하고 편입 준비할까',
    content: '지금 학교도 나쁘진 않은데 미련이 남아요',
    tag: '입시',
    vote_ends_at: '2026-11-22T12:00:00+09:00',
    response_count: 5,
  },
  {
    id: 3,
    title: '새벽 2시인데 야식 먹을까',
    content: '치킨이 너무 먹고 싶다',
    tag: '기타',
    vote_ends_at: '2026-11-16T03:00:00+09:00',
    response_count: 27,
  },
  {
    id: 12,
    title: '교환학생 갈까요 말까요',
    content: '교환학생 갈까 고민이 돼요...',
    tag: '입시',
    vote_ends_at: '2026-11-20T21:00:00+09:00',
    response_count: 12,
  }
]

// 사연 목록 가져오기
// 넣는 값: tag (없으면 전체)
// 돌려주는 값: [{ id, title, content, tag, vote_ends_at, response_count }, ...]
export async function getPosts(tag) {
  if (!tag) return FAKE_POSTS
  return FAKE_POSTS.filter((post) => post.tag === tag)
}

// 사연 하나 가져오기
// 넣는 값: id
// 돌려주는 값: { id, title, content, tag, vote_ends_at, response_count } 또는 null
export async function getPost(id) {
  return FAKE_POSTS.find((post) => post.id === Number(id)) ?? null
}
