import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { requestsApi } from '../api'
import { AppShell, TopHeader } from '../components/layout'
import { Card, Badge, Button, PageLoader, EmptyState } from '../components/ui'
import { timeAgo, REQUEST_STATUS_CONFIG, getErrorMessage } from '../utils'

const RequestsPage = () => {
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [cancelling, setCancelling] = useState({})
  const [responding, setResponding] = useState({})
  const navigate = useNavigate()

  const load = () => {
    console.log('%c[REQUESTS PAGE] loading my requests', 'color:#fbbf24')
    setLoading(true)
    requestsApi.getMine()
      .then(({ data }) => {
        setRequests(data.data.requests || [])
        console.log('%c[REQUESTS PAGE] loaded', 'color:#34d399', data.data.requests?.length)
      })
      .catch(err => console.error('%c[REQUESTS PAGE] error', 'color:#f87171', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (requestId) => {
    console.log('%c[REQUESTS PAGE] cancelling request', 'color:#f87171', requestId)
    setCancelling(c => ({ ...c, [requestId]: true }))
    try {
      await requestsApi.cancel(requestId)
      toast.success('Request cancelled')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCancelling(c => ({ ...c, [requestId]: false }))
    }
  }

  const handleRespond = async (requestId, action, projectId) => {
    console.log('%c[REQUESTS PAGE] responding to admin invite', 'color:#a78bfa', { requestId, action })
    setResponding(r => ({ ...r, [requestId]: action }))
    try {
      await requestsApi.respondToInvite(requestId, action)
      if (action === 'accepted') {
        toast.success('Invite accepted! Welcome to the project 🎉')
        navigate(`/projects/${projectId}`)
      } else {
        toast.success('Invite declined')
        load()
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
      setResponding(r => ({ ...r, [requestId]: null }))
    }
  }

  const invites  = requests.filter(r => r.type === 'admin_invite')
  const outgoing = requests.filter(r => r.type === 'member_request')
  const pendingInvites  = invites.filter(r => r.status?.toLowerCase() === 'pending')
  const resolvedInvites = invites.filter(r => r.status?.toLowerCase() !== 'pending')
  const pendingOut      = outgoing.filter(r => r.status?.toLowerCase() === 'pending')
  const resolvedOut     = outgoing.filter(r => r.status?.toLowerCase() !== 'pending')

  return (
    <AppShell>
      <TopHeader title="Join Requests" />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {loading ? <PageLoader /> : requests.length === 0 ? (
          <EmptyState icon="◌" title="No join requests"
            description="Browse public projects and send a request to join."
            action={<Link to="/projects"><Button size="sm">Explore Projects</Button></Link>}
          />
        ) : (
          <>
            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Pending Invites ({pendingInvites.length})
                </h2>
                <Card style={{ overflow: 'hidden' }}>
                  {pendingInvites.map((r, i) => (
                    <RequestRow
                      key={r.id} request={r}
                      isLast={i === pendingInvites.length - 1}
                      onAccept={() => handleRespond(r.id, 'accepted', r.project_id)}
                      onReject={() => handleRespond(r.id, 'rejected', r.project_id)}
                      responding={responding[r.id]}
                    />
                  ))}
                </Card>
              </section>
            )}

            {/* Pending Outgoing */}
            {pendingOut.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Pending Requests ({pendingOut.length})
                </h2>
                <Card style={{ overflow: 'hidden' }}>
                  {pendingOut.map((r, i) => (
                    <RequestRow
                      key={r.id} request={r}
                      isLast={i === pendingOut.length - 1}
                      onCancel={() => handleCancel(r.id)}
                      cancelling={cancelling[r.id]}
                    />
                  ))}
                </Card>
              </section>
            )}

            {/* Resolved Invites */}
            {resolvedInvites.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Resolved Invites ({resolvedInvites.length})
                </h2>
                <Card style={{ overflow: 'hidden' }}>
                  {resolvedInvites.map((r, i) => (
                    <RequestRow
                      key={r.id} request={r}
                      isLast={i === resolvedInvites.length - 1}
                    />
                  ))}
                </Card>
              </section>
            )}

            {/* Resolved Outgoing */}
            {resolvedOut.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Resolved Requests ({resolvedOut.length})
                </h2>
                <Card style={{ overflow: 'hidden' }}>
                  {resolvedOut.map((r, i) => (
                    <RequestRow
                      key={r.id} request={r}
                      isLast={i === resolvedOut.length - 1}
                    />
                  ))}
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

const RequestRow = ({ request: r, isLast, onCancel, onAccept, onReject, cancelling, responding }) => {
  const sc = REQUEST_STATUS_CONFIG[r.status?.toLowerCase()] || REQUEST_STATUS_CONFIG.pending

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius)',
        background: r.type === 'admin_invite' ? 'var(--purple-dim)' : 'var(--accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>
        {r.type === 'admin_invite' ? '✉' : '◌'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>
          <Link to={`/projects/${r.project_id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
            {r.project_name}
          </Link>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {r.type === 'admin_invite' ? '📨 Admin invited you' : '🙋 You requested to join'}
          {' · '}
          {r.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
          {' · '}
          {timeAgo(r.created_at)}
        </div>
        {r.message && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
            "{r.message}"
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Badge label={sc.label} color={sc.color} bg={sc.bg} />
        {r.status?.toLowerCase() === 'pending' && r.type === 'admin_invite' && onAccept && (
          <>
            <Button size="sm" variant="success"
              loading={responding === 'accepted'} disabled={!!responding}
              onClick={onAccept}>
              ✓ Accept
            </Button>
            <Button size="sm" variant="danger"
              loading={responding === 'rejected'} disabled={!!responding}
              onClick={onReject}>
              ✕ Decline
            </Button>
          </>
        )}
        {r.status?.toLowerCase() === 'pending' && r.type === 'member_request' && onCancel && (
          <Button size="sm" variant="danger" loading={cancelling} onClick={onCancel}>
            Cancel
          </Button>
        )}
        {r.status?.toLowerCase() === 'accepted' && (
          <Link to={`/projects/${r.project_id}`}>
            <Button size="sm" variant="ghost">View Project →</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default RequestsPage
