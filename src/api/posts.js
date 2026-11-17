// [백엔드 팀] 사연 관련 "주문 창구"
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
import { supabase } from './supabase.js'

// 사연 목록 가져오기
// 넣는 값: tag (없으면 전체)
// 돌려주는 값: [{ id, title, content, tag, vote_ends_at, response_count }, ...]
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
  // response_count는 아직 투표 표가 없어서 0으로 채움 (약속한 모양 유지)
  return data.map((post) => ({ ...post, response_count: 0 }))
}

// 사연 하나 가져오기
// 넣는 값: id
// 돌려주는 값: { id, title, content, tag, vote_ends_at, response_count } 또는 null
export async function getPost(id) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, content, tag, vote_ends_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    console.error('getPost 실패:', error)
    return null
  }
  return { ...data, response_count: 0 }
}