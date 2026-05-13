import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { projectsApi, requestsApi } from '../../api'
import { AppShell, TopHeader } from '../../components/layout'
import { Card, Badge, Button, Input, PageLoader, EmptyState, Spinner } from '../../components/ui'
import { useDebounce } from '../../hooks'
import { timeAgo, getErrorMessage } from '../../utils'

const ExplorePage = () => {
  const [search,   setSearch]   = useState('')
  const [projects, setProjects] = useState([])
  const [meta,     setMeta]     = useState(null)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [joining,  setJoining]  = useState({}) // { [projectId]: true }

  const q = useDebounce(search, 400)

  useEffect(() => {
    console.log('%c[EXPLORE] fetching public projects', 'color:#4f8ef7', { q, page })
    setLoading(true)
    projectsApi.getPublic({ q, page, limit: 12 })
      .then(({ data }) => {
        setProjects(data.data)
        setMeta(data.meta)
        console.log('%c[EXPLORE] loaded', 'color:#34d399', data.meta)
      })
      .catch(err => console.error('%c[EXPLORE] error', 'color:#f87171', err))
      .finally(() => setLoading(false))
  }, [q, page])

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [q])

  const handleJoin = async (projectId, projectName) => {
    console.log('%c[EXPLORE] requesting to join project', 'color:#fbbf24', projectId)
    setJoining(j => ({ ...j, [projectId]: true }))
    try {
      await requestsApi.requestJoin(projectId)
      toast.success(`Join request sent for "${projectName}"!`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setJoining(j => ({ ...j, [projectId]: false }))
    }
  }

  return (
    <AppShell>
      <TopHeader
        title="Explore Projects"
        actions={
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search public projects…"
            style={{ width: '260px', height: '34px', fontSize: '13px' }}
          />
        }
      />

      <div style={{ padding: '28px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <Spinner size={32} />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon="🔍" title="No projects found"
            description={q ? `No results for "${q}"` : 'No public projects yet'} />
        ) : (
          <>
            <div style={{ marginBottom: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {meta?.total ?? 0} public project{meta?.total !== 1 ? 's' : ''}
              {q ? ` matching "${q}"` : ''}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {projects.map(p => (
                <Card key={p.id} style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.15s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Link to={`/projects/${p.id}`} style={{
                      fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)',
                      textDecoration: 'none', flex: 1, marginRight: '8px',
                    }}>
                      {p.name}
                    </Link>
                    <Badge label="Public" color="var(--success)" bg="var(--success-dim)" />
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '13px', color: 'var(--text-muted)',
                    lineHeight: 1.5, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      👥 {p.member_count} members · {timeAgo(p.created_at)}
                    </span>
                    {p.my_role ? (
                      <Badge
                        label={p.my_role === 'admin' ? '★ Admin' : '✓ Member'}
                        color={p.my_role === 'admin' ? 'var(--warning)' : 'var(--success)'}
                        bg={p.my_role === 'admin' ? 'var(--warning-dim)' : 'var(--success-dim)'}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={joining[p.id]}
                        onClick={() => handleJoin(p.id, p.name)}
                      >
                        Request to Join
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  ← Prev
                </Button>
                <span style={{ padding: '5px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Page {page} of {meta.pages}
                </span>
                <Button variant="ghost" size="sm" disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)}>
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default ExplorePage
