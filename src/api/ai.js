// [백엔드 팀] AI 답변 "주문 창구"
// 함수 이름 / 넣는 값 / 돌려주는 모양은 절대 혼자 바꾸지 말 것 (약속!)
// AI 호출은 서버(/api/ai-answer)가 함. 브라우저에는 API 키가 없음
import { supabase } from './supabase.js'

// 저장된 AI 답변 가져오기
// 넣는 값: postId
// 돌려주는 값: { content, created_at } 또는 null (아직 없음)
export async function getAiAnswer(postId) {
  const { data, error } = await supabase
    .from('ai_answers')
    .select('content, created_at')
    .eq('post_id', Number(postId))
    .maybeSingle()
  if (error) console.error('getAiAnswer 실패:', error)
  return data ?? null
}

// AI에게 답변 요청 (사연 작성자만, 투표 0명인 사연만, 한 번 만들면 저장됨)
// 넣는 값: postId
// 돌려주는 값: { ok: true, content } 또는 { ok: false, message }
export async function requestAiAnswer(postId) {
  try {
    // 서버가 "작성자인지" 확인할 수 있게 로그인 토큰을 같이 보냄
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return { ok: false, message: '로그인이 필요해요' }

    const res = await fetch('/api/ai-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ postId: Number(postId) }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.content) return { ok: false, message: json.error ?? 'AI 답변을 받지 못했어요' }
    return { ok: true, content: json.content }
  } catch (error) {
    console.error('requestAiAnswer 실패:', error)
    return { ok: false, message: '서버에 연결하지 못했어요' }
  }
}
