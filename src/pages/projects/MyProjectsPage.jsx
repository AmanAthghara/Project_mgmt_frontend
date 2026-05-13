import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { projectsApi } from '../../api'
import { AppShell, TopHeader } from '../../components/layout'
import { Card, Badge, Button, Input, Textarea, Select, Modal, PageLoader, EmptyState } from '../../components/ui'
import { useModal } from '../../hooks'
import { timeAgo, getErrorMessage } from '../../utils'

const MyProjectsPage = () => {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const createModal = useModal()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', visibility: 'public' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = () => {
    console.log('%c[MY PROJECTS] loading', 'color:#4f8ef7')
    setLoading(true)
    projectsApi.getMine()
      .then(({ data }) => {
        setProjects(data.data.projects || [])
        console.log('%c[MY PROJECTS] loaded', 'color:#34d399', data.data.projects?.length)
      })
      .catch(err => console.error('%c[MY PROJECTS] error', 'color:#f87171', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    console.log('%c[MY PROJECTS] creating project', 'color:#4f8ef7', form)
    setSaving(true)
    try {
      await projectsApi.create(form)
      toast.success(`Project "${form.name}" created!`)
      createModal.close()
      setForm({ name: '', description: '', visibility: 'public' })
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const admins  = projects.filter(p => p.my_role === 'admin')
  const members = projects.filter(p => p.my_role === 'member')

  return (
    <AppShell>
      <TopHeader
        title="My Projects"
        actions={<Button onClick={createModal.open} size="sm">+ New Project</Button>}
      />

      <div style={{ padding: '28px' }}>
        {loading ? <PageLoader /> : projects.length === 0 ? (
          <EmptyState icon="◫" title="No projects yet"
            description="Create your first project or join a public one."
            action={<Button onClick={createModal.open}>+ Create Project</Button>}
          />
        ) : (
          <>
            {admins.length > 0 && (
              <Section title="Admin" projects={admins} />
            )}
            {members.length > 0 && (
              <Section title="Member" projects={members} />
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Create New Project">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Project name" value={form.name} onChange={set('name')}
            placeholder="e.g. Q3 Product Launch" required />
          <Textarea label="Description (optional)" value={form.description}
            onChange={set('description')} placeholder="What is this project about?" rows={3} />
          <Select label="Visibility" value={form.visibility} onChange={set('visibility')}>
            <option value="public">🌐 Public — anyone can find and request to join</option>
            <option value="private">🔒 Private — invite only</option>
          </Select>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button variant="ghost" type="button" onClick={createModal.close}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}

const Section = ({ title, projects }) => (
  <div style={{ marginBottom: '32px' }}>
    <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
      {title} ({projects.length})
    </h2>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '14px',
    }}>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  </div>
)

const ProjectCard = ({ project: p }) => (
  <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
    <Card style={{
      padding: '18px 20px',
      transition: 'border-color 0.15s, transform 0.1s',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-light)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = ''
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
        <Badge
          label={p.visibility === 'public' ? 'Public' : 'Private'}
          color={p.visibility === 'public' ? 'var(--success)' : 'var(--text-muted)'}
          bg={p.visibility === 'public' ? 'var(--success-dim)' : 'var(--bg-elevated)'}
        />
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {p.description || 'No description.'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>👥 {p.member_count} members</span>
        <span>{timeAgo(p.created_at)}</span>
      </div>
    </Card>
  </Link>
)

export default MyProjectsPage
