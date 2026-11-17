// [백엔드 팀] 로그인 관련 "주문 창구" (진짜: Supabase 구글 로그인)
// 함수 이름 / 넣는 값 / 돌려주는 모양은 그대로 (약속!)
import { supabase } from './supabase.js'

// 구글 로그인 시작
// 넣는 값: 없음
// 돌려주는 값: 없음 (구글 로그인 화면으로 이동했다가, 로그인 후 지금 보던 페이지로 돌아옴)
export async function signIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  })
  if (error) console.error('signIn 실패:', error)
}

// 로그아웃
// 넣는 값: 없음
// 돌려주는 값: 없음
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('signOut 실패:', error)
}

// 지금 로그인한 사람
// 넣는 값: 없음
// 돌려주는 값: { id, email } 또는 null (로그인 안 했으면)
// ※ 화면에는 이메일을 보여주지 말 것. 화면 표시는 항상 "익명"
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  return user ? { id: user.id, email: user.email } : null
}

// 로그인 상태가 바뀔 때마다 알려주기 (로그인 버튼 같은 곳에서 사용)
// 넣는 값: callback 함수. 바뀔 때마다 callback({ id, email } 또는 null)이 불림
// 돌려주는 값: 그만 듣기 함수 (화면이 사라질 때 불러주기)
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user
    callback(user ? { id: user.id, email: user.email } : null)
  })
  return () => data.subscription.unsubscribe()
}
