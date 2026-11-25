import { useState } from 'react'

const tags = ['연애', '입시', '기타']

export default function WritePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('연애')
  const [options, setOptions] = useState(['', ''])

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

  return (
    <main style={styles.page}>
      <h2 style={styles.heading}>사연 쓰기</h2>

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
    </main>
  )
}