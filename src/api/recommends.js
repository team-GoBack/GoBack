// [백엔드 팀] 추천 "주문 창구" (진짜: Supabase)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
//
// 추천 = 사연에 누르는 "좋아요". 한 사람이 한 사연에 한 번, 다시 누르면 취소.
// DB 규칙(RLS)
// - 누가 추천했는지는 본인 것만 보임 (익명 유지). 개수는 recommend_counts로만 셈
// - 추천·취소: 로그인한 사람이 자기 것만
import { supabase } from './supabase.js'
import { getCurrentUser } from './auth.js'

// 사연별 추천 수 { 사연id: 개수 }  (메인 카드 등에서 사용)
export async function getRecommendCounts() {
  const { data, error } = await supabase.rpc('recommend_counts')
  if (error) {
    console.error('recommend_counts 실패:', error)
    return {}
  }
  const counts = {}
  for (const row of data) counts[row.post_id] = Number(row.count)
  return counts
}

// 내가 이 사연을 추천했는지
async function isRecommended(postId) {
  const me = await getCurrentUser()
  if (!me) return false
  const { data, error } = await supabase
    .from('recommends')
    .select('post_id')
    .eq('post_id', Number(postId))
    .maybeSingle()
  if (error) console.error('추천 여부 확인 실패:', error)
  return Boolean(data)
}

// 사연 하나의 추천 상태
// 넣는 값: postId
// 돌려주는 값: { count, recommended }
//   - count: 추천 수
//   - recommended: 내가 추천했는지 (로그인 안 했으면 false)
export async function getRecommend(postId) {
  const [counts, recommended] = await Promise.all([getRecommendCounts(), isRecommended(postId)])
  return { count: counts[Number(postId)] ?? 0, recommended }
}

// 추천 누르기 / 취소 (번갈아)
// 넣는 값: postId
// 돌려주는 값: 바뀐 뒤의 { count, recommended } 또는 null (실패: 로그인 안 함 등)
export async function toggleRecommend(postId) {
  const me = await getCurrentUser()
  if (!me) {
    console.error('toggleRecommend 실패: 로그인 필요')
    return null
  }

  const id = Number(postId)
  if (await isRecommended(id)) {
    const { error } = await supabase.from('recommends').delete().eq('post_id', id)
    if (error) {
      console.error('추천 취소 실패:', error)
      return null
    }
  } else {
    // user_id는 DB가 로그인한 사람으로 자동으로 채움
    const { error } = await supabase.from('recommends').insert({ post_id: id })
    // 23505 = 이미 추천함 (버튼 연타 등) → 실패로 치지 않음
    if (error && error.code !== '23505') {
      console.error('추천 실패:', error)
      return null
    }
  }

  return getRecommend(id)
}
