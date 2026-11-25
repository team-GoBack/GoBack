import { useState } from 'react'

const tags = ['연애', '입시', '기타']

export default function WritePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tag, setTag] = useState('연애')

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
    },
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
    </main>
  )
}