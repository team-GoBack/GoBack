// [공통] 헤더의 로그인 / 로그아웃 버튼
// 로그인 상태를 기억하고, 바뀌면 버튼 글자도 자동으로 바뀜
import { useEffect, useState } from 'react'
import { getCurrentUser, onAuthChange, signIn, signOut } from '../api/auth.js'

export default function LoginButton() {
  const [user, setUser] = useState(null) // 로그인한 사람 (없으면 null)

  useEffect(() => {
    getCurrentUser().then(setUser)      // 처음 열렸을 때 한 번 확인
    return onAuthChange(setUser)        // 이후 바뀔 때마다 갱신, 화면이 사라지면 그만 듣기
  }, [])

  if (user) {
    return <button className="login-btn" onClick={signOut}>로그아웃</button>
  }
  return <button className="login-btn" onClick={signIn}>구글로 로그인</button>
}
