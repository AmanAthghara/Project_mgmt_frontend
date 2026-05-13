import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { tasksApi } from '../../api'
import { AppShell, TopHeader } from '../../components/layout'
import { Card, Badge, Button, PageLoader, EmptyState } from '../../components/ui'
import { formatDate, timeAgo, PRIORITY_CONFIG, STATUS_CONFIG, isOverdue, getErrorMessage } from '../../utils'

const MyTasksPage = () => {
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [completing, setCompleting] = useState({})

  const load = (status = filterStatus) => {
    console.log('%c[MY TASKS] loading personal tasks', 'color:#34d399', { status })
    setLoading(true)
    tasksApi.getMine({ status: status || undefined })
      .then(({ data }) => {
        setTasks(data.data.tasks || [])
        console.log('%c[MY TASKS] loaded', 'color:#34d399', data.data.tasks?.length)
      })
      .catch(err => console.error('%c[MY TASKS] error', 'color:#f87171', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const handleStatusChange = (s) => {
    setFilterStatus(s)
    load(s)
  }

  const handleComplete = async (task) => {
    console.log('%c[MY TASKS] marking complete', 'color:#34d399', task.id)
    setCompleting(c => ({ ...c, [task.id]: true }))
    try {
      await tasksApi.markComplete(task.project_id, task.id)
      toast.success(`"${task.title}" marked as complete!`)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCompleting(c => ({ ...c, [task.id]: false }))
    }
  }

  const pending     = tasks.filter(t => t.status === 'pending')
  const inProgress  = tasks.filter(t => t.status === 'in_progress')
  const completed   = tasks.filter(t => t.status === 'completed')
  const overdue     = tasks.filter(t => isOverdue(t.due_date, t.status))

  return (
    <AppShell>
      <TopHeader title="My Tasks" />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'All',         value: '',            count: tasks.length    },
            { label: 'Pending',     value: 'pending',     count: pending.length  },
            { label: 'In Progress', value: 'in_progress', count: inProgress.length },
            { label: 'Completed',   value: 'completed',   count: completed.length  },
          ].map(f => (
            <button key={f.value} onClick={() => handleStatusChange(f.value)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: 'var(--radius)',
              border: '1px solid ' + (filterStatus === f.value ? 'var(--accent)' : 'var(--border)'),
              background: filterStatus === f.value ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: filterStatus === f.value ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {f.label}
              <span style={{
                fontSize: '11px', padding: '1px 6px', borderRadius: '99px',
                background: filterStatus === f.value ? 'var(--accent-dim2)' : 'var(--bg-elevated)',
              }}>{f.count}</span>
            </button>
          ))}
          {overdue.length > 0 && !filterStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: 'var(--radius)',
              border: '1px solid rgba(248,113,113,0.35)',
              background: 'var(--danger-dim)',
              color: 'var(--danger)', fontSize: '13px',
            }}>
              ⚠ {overdue.length} overdue
            </div>
          )}
        </div>

        {loading ? (
          <PageLoader />
        ) : tasks.length === 0 ? (
          <EmptyState icon="✅" title="No tasks here"
            description={filterStatus ? `No ${filterStatus.replace('_', ' ')} tasks` : "You have no assigned tasks — enjoy the break!"}
          />
        ) : (
          <Card style={{ overflow: 'hidden' }}>
            {tasks.map((t, i) => {
              const pc     = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
              const sc     = STATUS_CONFIG[t.status]     || STATUS_CONFIG.pending
              const overdue = isOverdue(t.due_date, t.status)

              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 20px',
                  borderBottom: i === tasks.length - 1 ? 'none' : '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {/* Priority stripe */}
                  <div style={{
                    width: 3, height: 44, borderRadius: 2, flexShrink: 0,
                    background: overdue ? 'var(--danger)' : pc.color,
                  }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '14px', fontWeight: 500,
                        color: t.status === 'completed' ? 'var(--text-muted)' : overdue ? 'var(--danger)' : 'var(--text-primary)',
                        textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                      }}>{t.title}</span>
                      <Badge label={sc.label} color={sc.color} bg={sc.bg} />
                      <Badge label={pc.label} color={pc.color} bg={pc.bg} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <Link to={`/projects/${t.project_id}`} style={{ color: 'var(--accent)' }}>
                        ◫ {t.project_name}
                      </Link>
                      {t.due_date && (
                        <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                          📅 Due {formatDate(t.due_date)} {overdue ? '⚠' : ''}
                        </span>
                      )}
                      {t.completed_at && (
                        <span>✅ Completed {timeAgo(t.completed_at)}</span>
                      )}
                      <span>by {t.creator_first_name} {t.creator_last_name}</span>
                    </div>
                  </div>

                  {/* Complete button */}
                  {t.status !== 'completed' && (
                    <Button
                      size="sm" variant="success"
                      loading={completing[t.id]}
                      onClick={() => handleComplete(t)}
                    >
                      ✓ Mark Done
                    </Button>
                  )}
                </div>
              )
            })}
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default MyTasksPage
