import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { projectsApi, tasksApi, requestsApi } from '../api'
import { AppShell, TopHeader } from '../components/layout'
import { Card, StatCard, Badge, Avatar, PageLoader, EmptyState } from '../components/ui'
import { timeAgo, formatDate, PRIORITY_CONFIG, STATUS_CONFIG, isOverdue } from '../utils'

const DashboardPage = () => {
  const { user } = useAuth()
  const [loading,  setLoading]  = useState(true)
  const [projects, setProjects] = useState([])
  const [tasks,    setTasks]    = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    console.log('%c[DASHBOARD] loading overview data', 'color:#4f8ef7')
    Promise.all([
      projectsApi.getMine(),
      tasksApi.getMine({ status: 'pending' }),
      requestsApi.getMine(),
    ]).then(([pRes, tRes, rRes]) => {
      setProjects(pRes.data.data.projects || [])
      setTasks(tRes.data.data.tasks || [])
      setRequests(rRes.data.data.requests || [])
      console.log('%c[DASHBOARD] loaded', 'color:#34d399', {
        projects: pRes.data.data.projects?.length,
        tasks:    tRes.data.data.tasks?.length,
        requests: rRes.data.data.requests?.length,
      })
    }).catch(err => {
      console.error('%c[DASHBOARD] error loading', 'color:#f87171', err)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><PageLoader /></AppShell>

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const overdueTasks    = tasks.filter(t => isOverdue(t.due_date, t.status))

  return (
    <AppShell>
      <TopHeader title={`Good day, ${user?.first_name} ✦`} />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <StatCard icon="◫" label="My Projects" value={projects.length} color="var(--accent)" />
          <StatCard icon="◉" label="Pending Tasks" value={tasks.length} color="var(--warning)" />
          <StatCard icon="⚠" label="Overdue" value={overdueTasks.length} color="var(--danger)" />
          <StatCard icon="◌" label="Open Requests" value={pendingRequests.length} color="var(--purple)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* My Projects */}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>My Projects</span>
              <Link to="/projects/mine" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View all →</Link>
            </div>
            {projects.length === 0
              ? <EmptyState icon="◫" title="No projects yet" description="Create one or join a public project" />
              : projects.slice(0, 5).map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '13px 20px', borderBottom: '1px solid var(--border)',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius)',
                      background: 'var(--accent-dim)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', color: 'var(--accent)',
                    }}>◫</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: 'var(--text-primary)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {p.member_count} members · {p.my_role}
                      </div>
                    </div>
                    <Badge
                      label={p.visibility}
                      color={p.visibility === 'public' ? 'var(--success)' : 'var(--text-muted)'}
                      bg={p.visibility === 'public' ? 'var(--success-dim)' : 'var(--bg-elevated)'}
                    />
                  </div>
                </Link>
              ))
            }
          </Card>

          {/* My Pending Tasks */}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>My Tasks</span>
              <Link to="/tasks/me" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View all →</Link>
            </div>
            {tasks.length === 0
              ? <EmptyState icon="◉" title="No pending tasks" description="You're all caught up!" />
              : tasks.slice(0, 5).map(t => {
                const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
                const overdue = isOverdue(t.due_date, t.status)
                return (
                  <Link key={t.id} to={`/projects/${t.project_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 20px', borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <div style={{
                        width: 4, height: 36, borderRadius: '2px', flexShrink: 0,
                        background: overdue ? 'var(--danger)' : pc.color,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: overdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {t.project_name}
                          {t.due_date ? ` · Due ${formatDate(t.due_date)}` : ''}
                          {overdue ? ' ⚠ Overdue' : ''}
                        </div>
                      </div>
                      <Badge label={pc.label} color={pc.color} bg={pc.bg} />
                    </div>
                  </Link>
                )
              })
            }
          </Card>
        </div>

        {/* Pending join requests */}
        {pendingRequests.length > 0 && (
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Pending Join Requests</span>
              <Link to="/requests" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage →</Link>
            </div>
            {pendingRequests.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 20px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '16px' }}>◌</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{r.project_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {r.type === 'admin_invite' ? 'You were invited' : 'Your request'} · {timeAgo(r.created_at)}
                  </div>
                </div>
                <Badge label="Pending" color="var(--warning)" bg="var(--warning-dim)" />
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default DashboardPage
