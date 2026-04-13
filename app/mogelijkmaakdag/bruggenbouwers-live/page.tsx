'use client';

import { useState, useEffect, useCallback } from 'react';

interface PlanResult {
  id: number;
  name: string;
  budget: string;
  totalKeys: number;
}

interface VoterDetail {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  group_name: string;
  created_at: string;
  votes: { plan_id: number; plan_name: string; keys: number }[];
}

export default function LiveResultsPage() {
  const [plans, setPlans] = useState<PlanResult[]>([]);
  const [voters, setVoters] = useState<VoterDetail[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [showVoters, setShowVoters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/votes/details');
      const data = await res.json();

      if (data.plans && data.totals) {
        const ranked: PlanResult[] = data.plans
          .map((p: { id: number; name: string; budget: string }) => ({
            id: p.id,
            name: p.name,
            budget: p.budget,
            totalKeys: data.totals[p.id] || 0,
          }))
          .sort((a: PlanResult, b: PlanResult) => b.totalKeys - a.totalKeys);

        setPlans(ranked);
        setVoters(data.voters || []);
        setVoterCount(data.voter_count || 0);
      }

      setLastUpdate(new Date().toLocaleTimeString('nl-NL'));
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const maxKeys = Math.max(...plans.map(p => p.totalKeys), 1);

  // Calculate budget cutoff
  let cumBudget = 0;
  let cutoffIdx = -1;
  const BUDGET = 50000;
  plans.forEach((p, i) => {
    // Parse budget string like "€ 8.500" to number
    const budgetNum = parseInt(p.budget.replace(/[^0-9]/g, '')) || 0;
    cumBudget += budgetNum;
    if (cumBudget > BUDGET && cutoffIdx < 0) cutoffIdx = i;
  });

  // Group voters by group_name
  const votersByGroup: Record<string, number> = {};
  voters.forEach(v => {
    votersByGroup[v.group_name] = (votersByGroup[v.group_name] || 0) + 1;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-m)' }}>Laden...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 1rem 3rem', fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
        <div style={{ fontSize: 14, color: 'var(--ink-h, #bbb)', marginBottom: 4 }}>🔒 Alleen voor Bruggenbouwers</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: 'var(--sea, #2B7A78)', marginBottom: 4 }}>
          Live uitslagen
        </h1>
        <div style={{ fontSize: 13, color: 'var(--ink-m, #8B7355)' }}>
          Ververst automatisch elke 5 seconden · Laatst bijgewerkt: {lastUpdate}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: 120, background: 'var(--wh, #fff)', borderRadius: 14,
          padding: '14px 18px', border: '1px solid var(--border, #E8E0D2)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--sea, #2B7A78)' }}>{voterCount}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-m, #8B7355)' }}>stemmen uitgebracht</div>
        </div>
        <div style={{
          flex: 1, minWidth: 120, background: 'var(--wh, #fff)', borderRadius: 14,
          padding: '14px 18px', border: '1px solid var(--border, #E8E0D2)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--dune, #D4A843)' }}>{voterCount * 6}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-m, #8B7355)' }}>sleutels verdeeld</div>
        </div>
        <div style={{
          flex: 1, minWidth: 120, background: 'var(--wh, #fff)', borderRadius: 14,
          padding: '14px 18px', border: '1px solid var(--border, #E8E0D2)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink, #5C4A3A)' }}>{plans.length}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-m, #8B7355)' }}>plannen</div>
        </div>
      </div>

      {/* Voters by group */}
      {Object.keys(votersByGroup).length > 0 && (
        <div style={{
          background: 'var(--wh, #fff)', borderRadius: 14, padding: '12px 18px',
          border: '1px solid var(--border, #E8E0D2)', marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--ink-m, #8B7355)', fontWeight: 500 }}>Per groep:</span>
          {Object.entries(votersByGroup).sort((a, b) => a[0].localeCompare(b[0])).map(([g, n]) => (
            <span key={g} style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 6,
              background: 'var(--sand, #F5F0E8)', color: 'var(--ink, #5C4A3A)',
            }}>
              {g}: <strong>{n}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Ranking */}
      <div style={{ marginBottom: 24 }}>
        {plans.map((p, i) => {
          const below = cutoffIdx >= 0 && i >= cutoffIdx;
          const pct = maxKeys > 0 ? Math.round(p.totalKeys / maxKeys * 100) : 0;

          return (
            <div key={p.id}>
              {i === cutoffIdx && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 16px',
                }}>
                  <div style={{ flex: 1, height: 2.5, background: '#C0392B', borderRadius: 1 }} />
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#C0392B', whiteSpace: 'nowrap',
                    background: '#FADBD8', padding: '5px 14px', borderRadius: 8,
                  }}>€50.000 grens</div>
                  <div style={{ flex: 1, height: 2.5, background: '#C0392B', borderRadius: 1 }} />
                </div>
              )}
              <div style={{
                background: 'var(--wh, #fff)', borderRadius: 12, marginBottom: 8,
                padding: '12px 16px', border: '1px solid var(--border, #E8E0D2)',
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: below ? 0.45 : 1, transition: 'all 0.3s',
              }}>
                <div style={{
                  fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 600,
                  color: below ? '#C0392B' : 'var(--dune, #D4A843)',
                  minWidth: 36, textAlign: 'center',
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink, #5C4A3A)', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-m, #8B7355)', marginBottom: 6 }}>{p.budget}</div>
                  <div style={{ height: 16, background: 'var(--sand, #F5F0E8)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 8,
                      background: below ? '#E74C3C' : 'var(--sea, #2B7A78)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 700,
                  color: below ? '#C0392B' : 'var(--dune, #D4A843)',
                  minWidth: 50, textAlign: 'right',
                }}>
                  {p.totalKeys}
                  <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink-m, #8B7355)' }}>sleutels</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle individual votes */}
      <button onClick={() => setShowVoters(!showVoters)} style={{
        width: '100%', padding: 14, background: 'var(--wh, #fff)', color: 'var(--ink, #5C4A3A)',
        border: '1px solid var(--border, #E8E0D2)', borderRadius: 12,
        fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        marginBottom: 16,
      }}>
        {showVoters ? '▲ Verberg individuele stemmen' : '▼ Toon individuele stemmen'}
      </button>

      {/* Individual votes table */}
      {showVoters && (
        <div style={{
          background: 'var(--wh, #fff)', borderRadius: 14,
          border: '1px solid var(--border, #E8E0D2)', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--sand, #F5F0E8)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-m)' }}>Naam</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-m)' }}>Groep</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-m)' }}>Nr 1 (3🗝️)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-m)' }}>Nr 2 (2🗝️)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-m)' }}>Nr 3 (1🗝️)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-m)' }}>Tijd</th>
                </tr>
              </thead>
              <tbody>
                {voters.map(v => (
                  <tr key={v.id} style={{ borderTop: '1px solid var(--border, #E8E0D2)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{v.first_name} {v.last_name}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-m)' }}>{v.group_name}</td>
                    <td style={{ padding: '8px 12px' }}>{v.votes.find(x => x.keys === 3)?.plan_name || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{v.votes.find(x => x.keys === 2)?.plan_name || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{v.votes.find(x => x.keys === 1)?.plan_name || '—'}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--ink-m)', fontSize: 11 }}>
                      {new Date(v.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {voters.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-m)' }}>Nog geen stemmen uitgebracht.</div>
          )}
        </div>
      )}
    </div>
  );
}
