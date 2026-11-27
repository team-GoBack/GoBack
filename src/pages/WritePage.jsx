import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'
import { createPost } from '../api/posts'
import HaedalEasterEgg from '../components/HaedalEasterEgg.jsx'

const tags = ['연애', '입시', '기타']
const voteTimes = [
  { hours: 1, label: '1시간' },
  { hours: 24, label: '1일' },
  { hours: 168, label: '1주일' },
]

// 직접 설정: 단위별 시간 환산 + 허용 범위 (최소 15분, 최대 30일)
const customUnits = [
  { key: 'minutes', label: '분', hours: 1 / 60 },
  { key: 'hours', label: '시간', hours: 1 },
  { key: 'days', label: '일', hours: 24 },
]
const MIN_VOTE_HOURS = 0.25 // 15분
const MAX_VOTE_HOURS = 720 // 30일

// 마감 예정 시각 미리보기용 ("11월 28일 오후 3:20")
function formatEndTime(hours) {
  const end = new Date(Date.now() + hours * 60 * 60 * 1000)
  return end.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function WritePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('연애')
  const [options, setOptions] = useState(['', ''])
  const [voteHours, setVoteHours] = useState(24) // 기본 1일
  const [isCustomTime, setIsCustomTime] = useState(false) // "직접 설정"을 골랐는지
  const [customAmount, setCustomAmount] = useState('30')
  const [customUnit, setCustomUnit] = useState('minutes')
  const [wantsEpilogue, setWantsEpilogue] = useState(false)
  const [isEpilogueFocused, setIsEpilogueFocused] = useState(false) // 키보드 포커스 테두리용
  const [showEpilogueHelp, setShowEpilogueHelp] = useState(false) // ? 말풍선 표시 여부
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [showHaedal, setShowHaedal] = useState(false) // 🌅 이스터에그 연출 중인지

  useEffect(() => {
    let isActive = true

    async function checkLogin() {
      try {
        const user = await getCurrentUser()
        if (isActive) {
          setIsLoggedIn(Boolean(user))
        }
      } catch {
        if (isActive) {
          setIsLoggedIn(false)
        }
      } finally {
        if (isActive) {
          setIsCheckingUser(false)
        }
      }
    }

    checkLogin()

    return () => {
      isActive = false
    }
  }, [])

  // 실제로 넘길 투표 시간(시간 단위). 직접 설정이면 입력값 × 단위
  const unitHours = customUnits.find((unit) => unit.key === customUnit)?.hours ?? 1
  const customHours = Number(customAmount) * unitHours
  const effectiveVoteHours = isCustomTime ? customHours : voteHours
  const isVoteTimeValid =
    Number.isFinite(effectiveVoteHours) &&
    effectiveVoteHours >= MIN_VOTE_HOURS &&
    effectiveVoteHours <= MAX_VOTE_HOURS

  const styles = {
    page: {
      maxWidth: '640px',
      margin: '0 auto',
      padding: '32px 20px',
      color: 'var(--ink)',
    },
    heading: {
      marginBottom: '24px',
    },
    field: {
      marginBottom: '24px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
    },
    input: {
      boxSizing: 'border-box',
      width: '100%',
      padding: '12px',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      fontSize: '16px',
      color: 'var(--ink)',
      backgroundColor: 'var(--card)',
    },
    textarea: {
      boxSizing: 'border-box',
      width: '100%',
      minHeight: '180px',
      padding: '12px',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      fontSize: '16px',
      resize: 'vertical',
      color: 'var(--ink)',
      backgroundColor: 'var(--card)',
    },
    optionRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
    },
    smallButton: (disabled) => ({
      padding: '10px 14px',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      backgroundColor: 'var(--card)',
      color: 'var(--ink)',
      fontSize: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }),
    fieldset: {
      border: 'none',
      padding: 0,
      margin: 0,
    },
    voteTimeLabel: (isSelected) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      border: isSelected
        ? '1px solid var(--primary)'
        : '1px solid var(--border)',
      borderRadius: '8px',
      backgroundColor: 'var(--card)',
      color: 'var(--ink)',
      cursor: 'pointer',
    }),
    customRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '10px',
    },
    srOnly: {
      position: 'absolute',
      left: '-9999px',
    },
    voteTimeHint: {
      margin: '8px 0 0',
      color: 'var(--muted)',
      fontSize: '14px',
    },
    voteTimeList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    // 후일담: 유리 카드 한 줄 (왼쪽 글자 + ?, 오른쪽 스위치)
    epilogueRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '14px 16px',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      backgroundColor: 'var(--card)',
    },
    epilogueTitle: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: 'var(--ink)',
      fontWeight: 'bold',
    },
    helpButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      padding: 0,
      border: '1px solid var(--border)',
      borderRadius: '50%',
      backgroundColor: 'var(--card)',
      color: 'var(--muted)',
      fontSize: '12px',
      fontWeight: 'bold',
      lineHeight: 1,
      cursor: 'help',
    },
    helpBubble: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      zIndex: 5,
      width: '260px',
      padding: '10px 12px',
      borderRadius: '10px',
      backgroundColor: 'var(--primary)',
      color: 'var(--on-primary)',
      fontSize: '13px',
      fontWeight: 'normal',
      lineHeight: 1.6,
      boxShadow: 'var(--shadow)',
    },
    switchLabel: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--muted)',
      fontSize: '14px',
      cursor: 'pointer',
    },
    switchTrack: (isOn, isFocused) => ({
      position: 'relative',
      width: '44px',
      height: '26px',
      borderRadius: '999px',
      backgroundColor: isOn
        ? 'var(--primary)'
        : 'color-mix(in srgb, var(--muted) 30%, var(--card))',
      outline: isFocused ? '2px solid var(--muted)' : 'none',
      outlineOffset: '2px',
      transition: 'background-color 0.2s ease',
      flexShrink: 0,
    }),
    switchKnob: (isOn) => ({
      position: 'absolute',
      top: '3px',
      left: isOn ? '21px' : '3px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: 'var(--on-primary)',
      boxShadow: 'var(--shadow)',
      transition: 'left 0.2s ease',
    }),
    message: {
      color: 'var(--accent)',
      marginBottom: '16px',
    },
    submitButton: {
      width: '100%',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: 'var(--primary)',
      color: 'var(--on-primary)',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
  }

  function updateOption(index, value) {
    setOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    )
  }

  function addOption() {
    if (options.length < 5) {
      setOptions((currentOptions) => [...currentOptions, ''])
    }
  }

  function removeOption(index) {
    if (options.length > 2) {
      setOptions((currentOptions) =>
        currentOptions.filter((_, optionIndex) => optionIndex !== index)
      )
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    // 🌅 이스터에그: 제목·내용·선택지가 전부 "해달"이면 저장하지 않고 노을 연출 → 해달 사이트
    const isHaedal = (text) => text.trim() === '해달'
    const filledForEgg = options.filter((option) => option.trim())
    if (
      isHaedal(title) &&
      isHaedal(content) &&
      filledForEgg.length >= 2 &&
      filledForEgg.every(isHaedal)
    ) {
      setShowHaedal(true)
      return
    }

    if (isSubmitting) {
      return
    }

    setMessage('')

    if (!title.trim()) {
      setMessage('제목을 입력해 주세요.')
      return
    }

    if (!content.trim()) {
      setMessage('내용을 입력해 주세요.')
      return
    }

    const filledOptions = options.map((option) => option.trim()).filter((option) => option)

    if (filledOptions.length < 2) {
      setMessage('선택지를 2개 이상 입력해 주세요.')
      return
    }

    if (!isVoteTimeValid) {
      setMessage('투표 시간은 15분 이상, 30일 이하로 설정해 주세요.')
      return
    }

    if (!isLoggedIn) {
      setMessage('로그인 후 사연을 쓸 수 있어요')
      return
    }

    setIsSubmitting(true)

    try {
      const createdPost = await createPost({
        title: title.trim(),
        content: content.trim(),
        tag,
        voteHours: effectiveVoteHours,
        wantsEpilogue,
        options: filledOptions,
      })

      if (createdPost?.id) {
        navigate(`/posts/${createdPost.id}`)
      } else {
        setMessage('등록에 실패했습니다')
      }
    } catch {
      setMessage('등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={styles.page}>
      {showHaedal && <HaedalEasterEgg />}
      <h2 style={styles.heading}>사연 쓰기</h2>

      <form onSubmit={handleSubmit}>
        <div style={styles.field}>
          <label htmlFor="story-title" style={styles.label}>
            제목
          </label>
          <input
            id="story-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="사연 제목을 입력해 주세요"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="story-content" style={styles.label}>
            내용
          </label>
          <textarea
            id="story-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="어떤 고민이 있는지 적어 주세요"
            style={styles.textarea}
          />
        </div>

        <div style={styles.field}>
          <span style={styles.label}>태그</span>
          <div className="tags">
            {tags.map((item) => (
              <button
                key={item}
                type="button"
                className={tag === item ? 'active' : ''}
                aria-pressed={tag === item}
                onClick={() => setTag(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <span style={styles.label}>선택지 ({options.length}/5)</span>
          {options.map((option, index) => (
            <div key={index} style={styles.optionRow}>
              <label
                htmlFor={`story-option-${index}`}
                style={{ position: 'absolute', left: '-9999px' }}
              >
                선택지 {index + 1}
              </label>
              <input
                id={`story-option-${index}`}
                type="text"
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`선택지 ${index + 1}`}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                style={styles.smallButton(options.length <= 2)}
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= 5}
            style={styles.smallButton(options.length >= 5)}
          >
            선택지 추가
          </button>
        </div>

        <div style={styles.field}>
          <fieldset style={styles.fieldset}>
            <legend style={styles.label}>투표 시간</legend>
            <div style={styles.voteTimeList}>
              {voteTimes.map((item) => (
                <label
                  key={item.hours}
                  htmlFor={`vote-time-${item.hours}`}
                  style={styles.voteTimeLabel(!isCustomTime && voteHours === item.hours)}
                >
                  <input
                    id={`vote-time-${item.hours}`}
                    type="radio"
                    name="voteHours"
                    value={item.hours}
                    checked={!isCustomTime && voteHours === item.hours}
                    onChange={() => {
                      setIsCustomTime(false)
                      setVoteHours(item.hours)
                    }}
                  />
                  {item.label}
                </label>
              ))}
              <label
                htmlFor="vote-time-custom"
                style={styles.voteTimeLabel(isCustomTime)}
              >
                <input
                  id="vote-time-custom"
                  type="radio"
                  name="voteHours"
                  value="custom"
                  checked={isCustomTime}
                  onChange={() => setIsCustomTime(true)}
                />
                직접 설정
              </label>
            </div>

            {/* 직접 설정: 숫자 + 단위(분/시간/일) */}
            {isCustomTime && (
              <div style={styles.customRow}>
                <label htmlFor="vote-time-amount" style={styles.srOnly}>
                  투표 시간 숫자
                </label>
                <input
                  id="vote-time-amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  style={{ ...styles.input, width: '110px' }}
                />
                <label htmlFor="vote-time-unit" style={styles.srOnly}>
                  투표 시간 단위
                </label>
                <select
                  id="vote-time-unit"
                  value={customUnit}
                  onChange={(event) => setCustomUnit(event.target.value)}
                  style={{ ...styles.input, width: '100px' }}
                >
                  {customUnits.map((unit) => (
                    <option key={unit.key} value={unit.key}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 마감 예정 시각 미리보기 (범위를 벗어나면 안내) */}
            <p style={styles.voteTimeHint}>
              {isVoteTimeValid
                ? `${formatEndTime(effectiveVoteHours)} 마감 예정`
                : '15분 이상, 30일 이하로 설정해 주세요.'}
            </p>
          </fieldset>
        </div>

        <div style={styles.field}>
          <div style={styles.epilogueRow}>
            {/* 왼쪽: 제목 + ? (마우스를 올리거나 누르면 설명 말풍선) */}
            <div style={styles.epilogueTitle}>
              <span>후일담 약속하기</span>
              <button
                type="button"
                aria-label="후일담이 뭔가요?"
                aria-describedby={showEpilogueHelp ? 'epilogue-help' : undefined}
                onMouseEnter={() => setShowEpilogueHelp(true)}
                onMouseLeave={() => setShowEpilogueHelp(false)}
                onFocus={() => setShowEpilogueHelp(true)}
                onBlur={() => setShowEpilogueHelp(false)}
                onClick={() => setShowEpilogueHelp((current) => !current)}
                style={styles.helpButton}
              >
                ?
              </button>
              {showEpilogueHelp && (
                <span id="epilogue-help" role="tooltip" style={styles.helpBubble}>
                  투표가 끝나고 실제로 어떻게 됐는지 나중에 후기로 알려 주겠다는 약속이에요.
                  약속하면 사연 화면에 표시되고, 후일담을 올리면 투표한 사람들에게 알림이 가요.
                </span>
              )}
            </div>

            {/* 오른쪽: 켜기/끄기 스위치 (진짜 체크박스는 숨기고 모양만 새로 그림) */}
            <label htmlFor="wants-epilogue" style={styles.switchLabel}>
              <span>{wantsEpilogue ? '약속' : '안 함'}</span>
              <input
                id="wants-epilogue"
                type="checkbox"
                role="switch"
                aria-checked={wantsEpilogue}
                checked={wantsEpilogue}
                onChange={(event) => setWantsEpilogue(event.target.checked)}
                onFocus={() => setIsEpilogueFocused(true)}
                onBlur={() => setIsEpilogueFocused(false)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <span style={styles.switchTrack(wantsEpilogue, isEpilogueFocused)} aria-hidden="true">
                <span style={styles.switchKnob(wantsEpilogue)} />
              </span>
            </label>
          </div>
        </div>

        {message && (
          <p role="alert" style={styles.message}>
            {message}
          </p>
        )}

        {isCheckingUser ? (
          <p role="status">로그인 상태를 확인하고 있어요.</p>
        ) : isLoggedIn ? (
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        ) : (
          <p role="status">로그인 후 사연을 쓸 수 있어요</p>
        )}
      </form>
    </main>
  )
}