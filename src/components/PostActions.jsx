import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { closePost, deletePost, updatePost } from '../api/posts'

const tags = ['연애', '학업·진로', '인간관계', '재테크', '일상', '기타']

export default function PostActions({ post, status, onUpdated }) {
    const navigate = useNavigate()
    const canManagePost = status?.isAuthor && !status?.isClosed

    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(post?.title ?? '')
    const [content, setContent] = useState(post?.content ?? '')
    const [tag, setTag] = useState(post?.tag ?? '기타')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const styles = {
        container: {
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
        },
        actions: {
            display: 'flex',
            gap: '8px',
        },
        field: {
            marginBottom: '16px',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            color: 'var(--ink)',
            fontWeight: 'bold',
        },
        input: {
            boxSizing: 'border-box',
            width: '100%',
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            backgroundColor: 'var(--card)',
            fontSize: '16px',
        },
        textarea: {
            boxSizing: 'border-box',
            width: '100%',
            minHeight: '140px',
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            backgroundColor: 'var(--card)',
            fontSize: '16px',
            resize: 'vertical',
        },
        button: {
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            backgroundColor: 'var(--card)',
            fontSize: '14px',
            cursor: 'pointer',
        },
        primaryButton: {
            padding: '10px 14px',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--on-primary)',
            backgroundColor: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
        },
        message: {
            marginTop: '12px',
            color: 'var(--muted)',
        },
    }

    async function handleUpdate(event) {
        event.preventDefault()

        if (isSubmitting) return

        const nextTitle = title.trim()
        const nextContent = content.trim()

        if (!nextTitle || !nextContent) {
            setMessage('제목과 내용을 입력해 주세요.')
            return
        }

        setIsSubmitting(true)
        setMessage('')

        try {
            const updated = await updatePost(post.id, {
                title: nextTitle,
                content: nextContent,
                tag,
            })

            if (updated) {
                onUpdated?.({
                    title: nextTitle,
                    content: nextContent,
                    tag,
                })
                setIsEditing(false)
                setMessage('사연이 수정되었습니다.')
            } else {
                setMessage('사연 수정에 실패했습니다.')
            }
        } catch {
            setMessage('사연 수정에 실패했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete() {
        if (isSubmitting) return

        const confirmed = window.confirm('이 사연을 삭제할까요?')
        if (!confirmed) return

        setIsSubmitting(true)
        setMessage('')

        try {
            const deleted = await deletePost(post.id)

            if (deleted) {
                navigate('/')
            } else {
                setMessage('사연 삭제에 실패했습니다.')
            }
        } catch {
            setMessage('사연 삭제에 실패했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // 지금 바로 마감: 마감되면 결과·댓글이 공개되고 사연자 마무리를 할 수 있음
    async function handleClose() {
        if (isSubmitting) return

        const confirmed = window.confirm(
            '지금 투표를 마감할까요?\n마감하면 결과와 댓글이 모두에게 공개되고, 다시 열 수 없습니다.'
        )
        if (!confirmed) return

        setIsSubmitting(true)
        setMessage('')

        try {
            const closed = await closePost(post.id)

            if (closed) {
                // 마감 상태·결과·마무리 화면을 처음부터 다시 불러오기
                window.location.reload()
            } else {
                setMessage('마감에 실패했습니다.')
                setIsSubmitting(false)
            }
        } catch {
            setMessage('마감에 실패했습니다.')
            setIsSubmitting(false)
        }
    }

    function startEditing() {
        setTitle(post.title)
        setContent(post.content)
        setTag(post.tag)
        setMessage('')
        setIsEditing(true)
    }

    function cancelEditing() {
        setTitle(post.title)
        setContent(post.content)
        setTag(post.tag)
        setMessage('')
        setIsEditing(false)
    }

    if (!post || !canManagePost) {
        return null
    }

    return (
        <section style={styles.container} aria-label="내 사연 관리">
            {isEditing ? (
                <form onSubmit={handleUpdate}>
                    <div style={styles.field}>
                        <label htmlFor="edit-story-title" style={styles.label}>
                            제목
                        </label>
                        <input
                            id="edit-story-title"
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label htmlFor="edit-story-content" style={styles.label}>
                            내용
                        </label>
                        <textarea
                            id="edit-story-content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
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

                    <div style={styles.actions}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={styles.primaryButton}
                        >
                            {isSubmitting ? '저장 중...' : '저장'}
                        </button>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={cancelEditing}
                            style={styles.button}
                        >
                            취소
                        </button>
                    </div>
                </form>
            ) : (
                <div style={styles.actions}>
                    <button
                        type="button"
                        onClick={startEditing}
                        style={styles.button}
                    >
                        수정
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        style={styles.button}
                    >
                        {isSubmitting ? '처리 중...' : '삭제'}
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        style={{ ...styles.primaryButton, marginLeft: 'auto' }}
                    >
                        {isSubmitting ? '처리 중...' : '지금 마감하기'}
                    </button>
                </div>
            )}

            {message && (
                <p role="status" style={styles.message}>
                    {message}
                </p>
            )}
        </section>
    )
}