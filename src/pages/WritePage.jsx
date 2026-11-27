import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'
import { createPost } from '../api/posts'

const tags = ['연애', '입시', '기타']
const voteTimes = [
  { hours: 1, label: '1시간' },
  { hours: 24, label: '1일' },
  { hours: 168, label: '1주일' },
]

export default function WritePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('연애')
  const [options, setOptions] = useState(['', ''])
  const [voteHours, setVoteHours] = useState(24) // 기본 1일
  const [wantsEpilogue, setWantsEpilogue] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

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
    voteTimeList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    epilogueLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--ink)',
      cursor: 'pointer',
    },
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
        voteHours,
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
                  style={styles.voteTimeLabel(voteHours === item.hours)}
                >
                  <input
                    id={`vote-time-${item.hours}`}
                    type="radio"
                    name="voteHours"
                    value={item.hours}
                    checked={voteHours === item.hours}
                    onChange={() => setVoteHours(item.hours)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div style={styles.field}>
          <label htmlFor="wants-epilogue" style={styles.epilogueLabel}>
            <input
              id="wants-epilogue"
              type="checkbox"
              checked={wantsEpilogue}
              onChange={(event) => setWantsEpilogue(event.target.checked)}
            />
            후일담 받기
          </label>
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