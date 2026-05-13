import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { projectsApi, tasksApi, requestsApi } from '../../api'
import { useAuth } from '../../context/useAuth'
import { AppShell, TopHeader } from '../../components/layout'
import {
  Card, Badge, Button, Input, Textarea, Select, Modal,
  Avatar, PageLoader, EmptyState, ConfirmModal, StatCard,
} from '../../components/ui'
import { useModal } from '../../hooks'
import { timeAgo, formatDate, PRIORITY_CONFIG, STATUS_CONFIG, getErrorMessage, isOverdue } from '../../utils'

/* ── Tab Bar ─────────────────────────────────────────────────── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '4px', padding: '0 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '13.5px', fontWeight: active === t.id ? 500 : 400,
        color: active === t.id ? 'var(--accent)' : 'var(--text-secondary)',
        borderBottom: active === t.id ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.15s',
      }}>
        {t.label}
        {t.count != null && (
          <span style={{
            marginLeft: '6px', fontSize: '11px', padding: '1px 6px',
            borderRadius: '99px', background: active === t.id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            color: active === t.id ? 'var(--accent)' : 'var(--text-muted)',
          }}>{t.count}</span>
        )}
      </button>
    ))}
  </div>
)

/* ══════════════════════════════════════════════════════════════
   PROJECT DETAIL PAGE
══════════════════════════════════════════════════════════════ */
const ProjectDetailPage = () => {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project,  setProject]  = useState(null)
  const [members,  setMembers]  = useState([])
  const [tasks,    setTasks]    = useState([])
  const [stats,    setStats]    = useState(null)
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('tasks')

  const isAdmin = project?.my_role === 'admin'

  // ── Load everything ──────────────────────────────────────────
  const loadProject = useCallback(() => {
    console.log('%c[PROJECT DETAIL] loading project', 'color:#4f8ef7', projectId)
    return projectsApi.getById(projectId).then(({ data }) => {
      setProject(data.data.project)
      console.log('%c[PROJECT DETAIL] project loaded', 'color:#34d399', data.data.project.name)
    })
  }, [projectId])

  const loadMembers = useCallback(() =>
    projectsApi.getMembers(projectId).then(({ data }) => setMembers(data.data.members || []))
  , [projectId])

  const loadTasks = useCallback(() =>
    tasksApi.getProjectTasks(projectId).then(({ data }) => setTasks(data.data.tasks || []))
  , [projectId])

  const loadStats = useCallback(() =>
    tasksApi.getStats(projectId).then(({ data }) => setStats(data.data.stats))
  , [projectId])

  const loadRequests = useCallback(() =>
    requestsApi.getPending(projectId).then(({ data }) => setRequests(data.data.requests || []))
  , [projectId])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadProject(), loadMembers(), loadTasks(), loadStats()])
      .catch(err => {
        console.error('%c[PROJECT DETAIL] load error', 'color:#f87171', err)
        if (err.response?.status === 403 || err.response?.status === 404) {
          toast.error('Project not found or access denied')
          navigate('/projects')
        }
      })
      .finally(() => setLoading(false))
  }, [projectId]) // eslint-disable-line

  useEffect(() => {
    if (isAdmin && tab === 'requests') loadRequests()
  }, [tab, isAdmin]) // eslint-disable-line

  if (loading) return <AppShell><PageLoader /></AppShell>
  if (!project) return null

  const tabs = [
    { id: 'tasks',    label: 'Tasks',   count: tasks.length },
    { id: 'members',  label: 'Members', count: members.length },
    ...(isAdmin ? [{ id: 'requests', label: 'Requests', count: requests.length }] : []),
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <AppShell>
      <TopHeader
        title={project.name}
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Badge
              label={project.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
              color={project.visibility === 'public' ? 'var(--success)' : 'var(--text-muted)'}
              bg={project.visibility === 'public' ? 'var(--success-dim)' : 'var(--bg-elevated)'}
            />
            <Badge
              label={isAdmin ? '★ Admin' : '✓ Member'}
              color={isAdmin ? 'var(--warning)' : 'var(--accent)'}
              bg={isAdmin ? 'var(--warning-dim)' : 'var(--accent-dim)'}
            />
          </div>
        }
      />

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div style={{ padding: '28px', flex: 1 }}>
        {tab === 'tasks'    && <TasksTab    projectId={projectId} tasks={tasks}     stats={stats} isAdmin={isAdmin} members={members} onRefresh={() => { loadTasks(); loadStats() }} userId={user.id} />}
        {tab === 'members'  && <MembersTab  projectId={projectId} members={members} isAdmin={isAdmin} onRefresh={loadMembers} currentUserId={user.id} />}
        {tab === 'requests' && <RequestsTab projectId={projectId} requests={requests} onRefresh={loadRequests} />}
        {tab === 'settings' && <SettingsTab project={project} isAdmin={isAdmin} onRefresh={loadProject} />}
      </div>
    </AppShell>
  )
}

/* ══════════════════════════════════════════════════════════════
   TASKS TAB
══════════════════════════════════════════════════════════════ */
const TasksTab = ({ projectId, tasks, stats, isAdmin, members, onRefresh, userId }) => {
  const createModal = useModal()
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [completing, setCompleting] = useState({})
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', assigned_to: '', due_date: '',
  })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = tasks.filter(t =>
    (!filterStatus   || t.status   === filterStatus) &&
    (!filterPriority || t.priority === filterPriority)
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    console.log('%c[TASKS TAB] creating task', 'color:#34d399', form)
    setSaving(true)
    try {
      await tasksApi.create(projectId, {
        ...form,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
        due_date: form.due_date || undefined,
      })
      toast.success('Task created!')
      createModal.close()
      setForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (taskId) => {
    console.log('%c[TASKS TAB] marking complete', 'color:#34d399', taskId)
    setCompleting(c => ({ ...c, [taskId]: true }))
    try {
      await tasksApi.markComplete(projectId, taskId)
      toast.success('Task marked as complete!')
      onRefresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCompleting(c => ({ ...c, [taskId]: false }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
          <StatCard label="Total"       value={stats.total}       />
          <StatCard label="Pending"     value={stats.pending}     color="var(--text-muted)" />
          <StatCard label="In Progress" value={stats.in_progress} color="var(--warning)"    />
          <StatCard label="Completed"   value={stats.completed}   color="var(--success)"    />
          <StatCard label="Overdue"     value={stats.overdue}     color="var(--danger)"     />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text-secondary)', padding: '6px 10px',
            fontSize: '13px', cursor: 'pointer' }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text-secondary)', padding: '6px 10px',
            fontSize: '13px', cursor: 'pointer' }}>
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {isAdmin && (
          <Button size="sm" onClick={createModal.open} style={{ marginLeft: 'auto' }}>
            + Create Task
          </Button>
        )}
      </div>

      {/* Task list */}
      {filtered.length === 0
        ? <EmptyState icon="◉" title="No tasks" description={isAdmin ? 'Create your first task above' : 'No tasks assigned yet'} />
        : (
          <Card style={{ overflow: 'hidden' }}>
            {filtered.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                isAdmin={isAdmin}
                userId={userId}
                projectId={projectId}
                members={members}
                completing={completing[t.id]}
                onComplete={() => handleComplete(t.id)}
                onRefresh={onRefresh}
                isLast={i === filtered.length - 1}
              />
            ))}
          </Card>
        )
      }

      {/* Create Task Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Create Task" width={500}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Title" value={form.title} onChange={set('title')} placeholder="Task title" required />
          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Optional details…" rows={2} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select label="Priority" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input label="Due date" type="date" value={form.due_date} onChange={set('due_date')} />
          </div>
          <Select label="Assign to" value={form.assigned_to} onChange={set('assigned_to')}>
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
            ))}
          </Select>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" type="button" onClick={createModal.close}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ── Task Row ─────────────────────────────────────────────────── */
const TaskRow = ({ task: t, isAdmin, userId, projectId, members, completing, onComplete, onRefresh, isLast }) => {
  const editModal   = useModal()
  const assignModal = useModal()
  const deleteConfirm = useModal()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ title: t.title, description: t.description || '', priority: t.priority, status: t.status, due_date: t.due_date || '' })
  const [assignTo, setAssignTo] = useState(t.assigned_to || '')

  const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
  const sc = STATUS_CONFIG[t.status]     || STATUS_CONFIG.pending
  const overdue = isOverdue(t.due_date, t.status)
  const isMyTask = t.assigned_to === userId

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await tasksApi.update(projectId, t.id, form)
      toast.success('Task updated')
      editModal.close()
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  const handleAssign = async () => {
    setSaving(true)
    try {
      await tasksApi.assign(projectId, t.id, Number(assignTo))
      toast.success('Task assigned!')
      assignModal.close()
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await tasksApi.delete(projectId, t.id)
      toast.success('Task deleted')
      deleteConfirm.close()
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '13px 18px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        {/* Priority bar */}
        <div style={{ width: 3, height: 40, borderRadius: 2, background: overdue ? 'var(--danger)' : pc.color, flexShrink: 0 }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{
              fontSize: '13.5px', fontWeight: 500,
              color: t.status === 'completed' ? 'var(--text-muted)' : overdue ? 'var(--danger)' : 'var(--text-primary)',
              textDecoration: t.status === 'completed' ? 'line-through' : 'none',
            }}>{t.title}</span>
            <Badge label={sc.label} color={sc.color} bg={sc.bg} />
            <Badge label={pc.label} color={pc.color} bg={pc.bg} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {t.assignee_first_name
              ? `→ ${t.assignee_first_name} ${t.assignee_last_name}`
              : 'Unassigned'}
            {t.due_date ? ` · Due ${formatDate(t.due_date)}` : ''}
            {overdue ? ' ⚠ Overdue' : ''}
            {t.completed_at ? ` · Completed ${timeAgo(t.completed_at)}` : ''}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {isMyTask && t.status !== 'completed' && (
            <Button size="sm" variant="success" loading={completing} onClick={onComplete}>✓ Done</Button>
          )}
          {isAdmin && (
            <>
              <Button size="sm" variant="ghost" onClick={assignModal.open}>Assign</Button>
              <Button size="sm" variant="ghost" onClick={editModal.open}>Edit</Button>
              <Button size="sm" variant="danger" onClick={deleteConfirm.open}>Del</Button>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit Task" width={480}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Select label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="urgent">Urgent</option>
            </Select>
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pending">Pending</option><option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
            <Input label="Due date" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" type="button" onClick={editModal.close}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModal.isOpen} onClose={assignModal.close} title="Assign Task" width={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select label="Assign to member" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
          </Select>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={assignModal.close}>Cancel</Button>
            <Button onClick={handleAssign} loading={saving}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen} onClose={deleteConfirm.close}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Task"
        message={`Delete "${t.title}"? This cannot be undone.`}
      />
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   MEMBERS TAB
══════════════════════════════════════════════════════════════ */
const MembersTab = ({ projectId, members, isAdmin, onRefresh, currentUserId }) => {
  const inviteModal = useModal()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState({})
  const [removing, setRemoving] = useState({})
  const [promoting, setPromoting] = useState({})

  const handleSearch = async (q) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await projectsApi.searchUsers(projectId, q)
      setResults(data.data.users || [])
      console.log('%c[MEMBERS TAB] search results', 'color:#4f8ef7', data.data.users?.length)
    } catch (err) {
      console.error('%c[MEMBERS TAB] search error', 'color:#f87171', err)
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async (userId, name) => {
    console.log('%c[MEMBERS TAB] inviting user', 'color:#fbbf24', userId)
    setInviting(i => ({ ...i, [userId]: true }))
    try {
      await requestsApi.invite(projectId, { user_id: userId })
      toast.success(`Invite sent to ${name}!`)
      setResults(r => r.filter(u => u.id !== userId))
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setInviting(i => ({ ...i, [userId]: false })) }
  }

  const handleRemove = async (memberId, name) => {
    if (!confirm(`Remove ${name} from project?`)) return
    setRemoving(r => ({ ...r, [memberId]: true }))
    try {
      await projectsApi.removeMember(projectId, memberId)
      toast.success(`${name} removed`)
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setRemoving(r => ({ ...r, [memberId]: false })) }
  }

  const handlePromote = async (memberId, name) => {
    if (!confirm(`Promote ${name} to Admin?`)) return
    setPromoting(p => ({ ...p, [memberId]: true }))
    try {
      await projectsApi.promoteMember(projectId, memberId)
      toast.success(`${name} promoted to admin!`)
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setPromoting(p => ({ ...p, [memberId]: false })) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="sm" onClick={inviteModal.open}>+ Invite Member</Button>
        </div>
      )}

      <Card style={{ overflow: 'hidden' }}>
        {members.length === 0
          ? <EmptyState icon="👥" title="No members yet" />
          : members.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '13px',
              padding: '13px 20px',
              borderBottom: i === members.length - 1 ? 'none' : '1px solid var(--border)',
            }}>
              <Avatar firstName={m.first_name} lastName={m.last_name} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {m.first_name} {m.last_name}
                  {m.id === currentUserId && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>(you)</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {m.email} · Joined {timeAgo(m.joined_at)}
                </div>
              </div>
              <Badge
                label={m.role === 'admin' ? '★ Admin' : 'Member'}
                color={m.role === 'admin' ? 'var(--warning)' : 'var(--text-muted)'}
                bg={m.role === 'admin' ? 'var(--warning-dim)' : 'var(--bg-elevated)'}
              />
              {isAdmin && m.id !== currentUserId && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {m.role !== 'admin' && (
                    <Button size="sm" variant="ghost" loading={promoting[m.id]}
                      onClick={() => handlePromote(m.id, m.first_name)}>
                      Promote
                    </Button>
                  )}
                  <Button size="sm" variant="danger" loading={removing[m.id]}
                    onClick={() => handleRemove(m.id, m.first_name)}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))
        }
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={inviteModal.isOpen} onClose={inviteModal.close} title="Invite Member" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Search users by name or email"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Type at least 2 characters…"
          />
          {searching && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Searching…</div>}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {results.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: 'var(--radius)',
                  background: 'var(--bg-elevated)',
                }}>
                  <Avatar firstName={u.first_name} lastName={u.last_name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <Button size="sm" loading={inviting[u.id]}
                    onClick={() => handleInvite(u.id, u.first_name)}>
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          )}
          {search.length >= 2 && !searching && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No users found</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   REQUESTS TAB (admin only)
══════════════════════════════════════════════════════════════ */
const RequestsTab = ({ projectId, requests, onRefresh }) => {
  const [resolving, setResolving] = useState({})

  const handleResolve = async (requestId, action) => {
    console.log('%c[REQUESTS TAB] resolving', 'color:#fbbf24', { requestId, action })
    setResolving(r => ({ ...r, [requestId]: action }))
    try {
      await requestsApi.resolve(projectId, requestId, action)
      toast.success(`Request ${action}`)
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setResolving(r => ({ ...r, [requestId]: false })) }
  }

  return (
    <Card style={{ overflow: 'hidden' }}>
      {requests.length === 0
        ? <EmptyState icon="◌" title="No pending requests" description="All caught up!" />
        : requests.map((r, i) => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: '13px',
            padding: '14px 20px',
            borderBottom: i === requests.length - 1 ? 'none' : '1px solid var(--border)',
          }}>
            <Avatar firstName={r.requester_first_name} lastName={r.requester_last_name} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {r.requester_first_name} {r.requester_last_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {r.requester_email} · {r.type === 'admin_invite' ? 'Admin invite' : 'Member request'} · {timeAgo(r.created_at)}
              </div>
              {r.message && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px',
                  fontStyle: 'italic' }}>"{r.message}"</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" variant="success"
                loading={resolving[r.id] === 'accepted'}
                disabled={!!resolving[r.id]}
                onClick={() => handleResolve(r.id, 'accepted')}>
                ✓ Accept
              </Button>
              <Button size="sm" variant="danger"
                loading={resolving[r.id] === 'rejected'}
                disabled={!!resolving[r.id]}
                onClick={() => handleResolve(r.id, 'rejected')}>
                ✕ Reject
              </Button>
            </div>
          </div>
        ))
      }
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS TAB
══════════════════════════════════════════════════════════════ */
const SettingsTab = ({ project, isAdmin, onRefresh }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: project.name, description: project.description || '', visibility: project.visibility })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deleteConfirm = useModal()

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await projectsApi.update(project.id, form)
      toast.success('Project updated!')
      onRefresh()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await projectsApi.delete(project.id)
      toast.success('Project deleted')
      navigate('/projects/mine')
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setDeleting(false) }
  }

  if (!isAdmin) return (
    <Card style={{ padding: '24px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
        Only project admins can edit settings.
      </p>
    </Card>
  )

  return (
    <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '18px' }}>Project Settings</h3>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Project name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Textarea label="Description" value={form.description} rows={3}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Select label="Visibility" value={form.visibility}
            onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
            <option value="public">🌐 Public</option>
            <option value="private">🔒 Private</option>
          </Select>
          <Button type="submit" loading={saving} style={{ alignSelf: 'flex-end' }}>Save Changes</Button>
        </form>
      </Card>

      <Card style={{ padding: '24px', borderColor: 'rgba(248,113,113,0.25)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Deleting a project is permanent. All tasks and members will be removed.
        </p>
        <Button variant="danger" onClick={deleteConfirm.open}>Delete Project</Button>
      </Card>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen} onClose={deleteConfirm.close}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This cannot be undone.`}
      />
    </div>
  )
}

export default ProjectDetailPage
