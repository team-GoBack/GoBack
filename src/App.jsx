// [공통 파일] 팀장만 수정
// 주소(URL)마다 어떤 페이지를 보여줄지 정하는 곳
import { useEffect, useState } from 'react'
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import { getCurrentUser, onAuthChange } from './api/auth.js'
import MainPage from './pages/MainPage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import WritePage from './pages/WritePage.jsx'
import ReelsPage from './pages/ReelsPage.jsx'
import MyPage from './pages/MyPage.jsx'
import LoginButton from './components/LoginButton.jsx'
import EpilogueBanner from './components/EpilogueBanner.jsx'
import NoticeBell from './components/NoticeBell.jsx'

// 헤더 링크: 지금 보고 있는 페이지면 active (진하게)
const navClass = ({ isActive }) => (isActive ? 'reels-link active' : 'reels-link')

export default function App() {
  const location = useLocation()
  const [user, setUser] = useState(null) // 로그인한 사람 (없으면 null)

  useEffect(() => {
    getCurrentUser().then(setUser)
    return onAuthChange(setUser)
  }, [])

  // 내 활동 페이지에서는 헤더 오른쪽에 알림 종 + 로그아웃만
  const onMyPage = location.pathname === '/me'

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">
          <img src="/favicon.svg" alt="" className="logo-icon" />
          GoBack
        </Link>
        <div className="header-actions">
          {onMyPage ? (
            <>
              {user && <NoticeBell />}
              <LoginButton />
            </>
          ) : (
            <>
            <NavLink to="/reels" className={navClass} aria-label="릴스: 사연 넘겨 보기">
              {/* 세로 화면 안에 재생 버튼 모양 아이콘 */}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="6" y="2.5" width="12" height="19" rx="3.5" />
                <path d="M10.5 9.2v5.6l4.4-2.8z" fill="currentColor" stroke="none" />
              </svg>
              <span>Swipe</span>
            </NavLink>
            {/* 로그인했으면 내 활동, 아니면 로그인 버튼 */}
            {user ? <NavLink to="/me" className={navClass}>내 활동</NavLink> : <LoginButton />}
            <Link to="/write" className="write-btn">사연 쓰기</Link>
            </>
          )}
        </div>
      </header>

      {/* 내가 투표한 사연에 새 후일담이 올라오면 알림 */}
      <EpilogueBanner />

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/me" element={<MyPage />} />
      </Routes>
    </div>
  )
}
