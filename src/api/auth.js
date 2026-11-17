//함수 이름 / 넣는 값 / 돌려주는 모양은 그대로
import { FAKE_ME } from './fakeStore.js'

let loggedIn = true

// 구글 로그인 시작
export async function signIn() {
  loggedIn = true
}

// 로그아웃
// 넣는 값: 없음
// 돌려주는 값: 없음
export async function signOut() {
  loggedIn = false
}

// 지금 로그인한 사람
// 넣는 값: 없음
// 돌려주는 값: { id, email } 또는 null (로그인 안 했으면)
// 화면 표시는 항상 "익명"
export async function getCurrentUser() {
  return loggedIn ? FAKE_ME : null
}
