'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Plan } from '@/lib/plans';

const TOTAL_KEYS = 10;

const keySvg = (c: string) => `<svg viewBox="0 0 24 28" fill="${c}"><circle cx="12" cy="8" r="6" stroke="${c}" stroke-width="1" fill="none"/><circle cx="12" cy="8" r="3.5" fill="${c}" opacity=".25"/><rect x="10.5" y="14" width="3" height="12" rx="1.5"/><rect x="13.5" y="19" width="4" height="2.5" rx="1"/><rect x="13.5" y="23" width="3" height="2.5" rx="1"/></svg>`;

export default function SleutelsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'reg' | 'vote' | 'done'>('reg');

  // Registration
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [group, setGroup] = useState('');

  // Voting
  const [myKeys, setMyKeys] = useState<{ [id: number]: number }>({});

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
        const init: { [id: number]: number } = {};
        data.plans.forEach((p: Plan) => { init[p.id] = 0; });
        setMyKeys(init);
      }
    } catch { console.error('Failed to load plans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const keysUsed = Object.values(myKeys).reduce((a, b) => a + b, 0);
  const keysLeft = TOTAL_KEYS - keysUsed;
  const formValid = firstName.trim() && lastName.trim() && dob && group;

  const changeKey = (id: number, delta: number) => {
    const newVal = (myKeys[id] || 0) + delta;
    if (newVal < 0 || newVal > TOTAL_KEYS) return;
    if (delta > 0 && keysLeft <= 0) return;
    setMyKeys(prev => ({ ...prev, [id]: newVal }));
  };

  const doSubmit = async () => {
    const chosen = Object.entries(myKeys).filter(([, v]) => v > 0).map(([k, v]) => ({ plan_id: Number(k), keys: v }));
    if (chosen.length === 0) return;
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, dob, group, votes: chosen }),
      });
      setPhase('done');
    } catch { alert('Er ging iets mis. Probeer het opnieuw.'); }
  };

  // Plans ordered for "mine" tab: with keys first, then alphabetical
  const withKeys = plans.filter(p => (myKeys[p.id] || 0) > 0).sort((a, b) => (myKeys[b.id] || 0) - (myKeys[a.id] || 0));
  const withoutKeys = plans.filter(p => (myKeys[p.id] || 0) === 0).sort((a, b) => a.name.localeCompare(b.name));
  const orderedMine = [...withKeys, ...withoutKeys];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--border-h)',
    borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 14,
    background: 'var(--sand)', color: 'var(--ink)', outline: 'none',
  };

  const groups = ['0-4 jaar', 'Groep 1-2', 'Groep 3-4', 'Groep 5-6', 'Groep 7-8', 'Klas 1-2', 'Klas 3-4', 'Klas 5-6 / MBO / HBO'];

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-h)' }}>Laden...</div>;

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '0 1rem 2rem', fontFamily: "'Outfit', sans-serif" }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
        <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🗝️</span>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: 'var(--sea)', marginBottom: 6 }}>Deel jouw sleutels uit</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-m)', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Jij hebt {TOTAL_KEYS} sleutels. Verdeel ze over de plannen die jij het belangrijkst vindt!
        </p>
      </div>

      {/* REGISTRATION */}
      {phase === 'reg' && (
        <div style={{ background: 'var(--wh)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-m)', marginBottom: 4, fontWeight: 500 }}>Voornaam</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jouw naam" style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-m)', marginBottom: 4, fontWeight: 500 }}>Achternaam</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Achternaam" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-m)', marginBottom: 4, fontWeight: 500 }}>Geboortedatum</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-m)', marginBottom: 4, fontWeight: 500 }}>Groep / Klas</label>
              <select value={group} onChange={e => setGroup(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
                <option value="">Kies je groep...</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setPhase('vote')} disabled={!formValid} style={{
            width: '100%', padding: 14, background: formValid ? 'var(--sea)' : 'var(--ink-h)', color: '#fff',
            border: 'none', borderRadius: 12, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600,
            cursor: formValid ? 'pointer' : 'default', marginTop: 6,
          }}>Laat de plannen zien! 🗝️</button>
        </div>
      )}

      {/* VOTING */}
      {phase === 'vote' && (
        <>
          {/* Keys strip */}
              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--wh)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 0, padding: '12px 16px', marginBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, marginLeft: '-1rem', marginRight: '-1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, color: 'var(--dune)', fontWeight: 600, lineHeight: 1, minWidth: 28, textAlign: 'center' }}>{keysLeft}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-m)', flex: 1 }}>sleutels over</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: TOTAL_KEYS }, (_, i) => (
                    <div key={i} style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: i < keysLeft ? 'var(--dune-light, #F0D78C)' : 'var(--border)',
                      opacity: i < keysLeft ? 1 : 0.3, transform: i < keysLeft ? '' : 'scale(0.75)',
                      transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} dangerouslySetInnerHTML={{ __html: keySvg(i < keysLeft ? '#C4880E' : '#bbb') }} />
                  ))}
                </div>
              </div>

              {/* Plan cards */}
              {orderedMine.map(p => {
                const hk = (myKeys[p.id] || 0) > 0;
                return (
                  <div key={p.id} style={{
                    background: 'var(--wh)', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
                    border: hk ? '1.5px solid var(--dune)' : '1.5px solid var(--border)',
                    display: 'flex', minHeight: 150, transition: 'all 0.3s',
                  }}>
                    {/* Poster */}
                    <div style={{ width: 130, minWidth: 130, background: 'var(--sand)', position: 'relative', overflow: 'hidden' }}>
                      {p.poster_url ? (
                        <Image src={p.poster_url} alt={p.name} fill sizes="130px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🗝️</div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-m)', marginBottom: 5 }}>{p.team.join(', ')}</div>
                      {/* Keys controls */}
                      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => changeKey(p.id, -1)} disabled={(myKeys[p.id] || 0) === 0} style={{
                          width: 42, height: 42, borderRadius: 12, border: '2px solid var(--border)', background: 'var(--wh)',
                          cursor: (myKeys[p.id] || 0) === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#C0392B', opacity: (myKeys[p.id] || 0) === 0 ? 0.2 : 1, fontSize: 20, fontWeight: 700, fontFamily: 'inherit',
                        }}>−</button>
                        <div style={{ flex: 1, display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', minHeight: 30, flexWrap: 'wrap' }}>
                          {(myKeys[p.id] || 0) > 0 ? (
                            Array.from({ length: myKeys[p.id] || 0 }, (_, i) => (
                              <div key={i} style={{ width: 24, height: 24 }} dangerouslySetInnerHTML={{ __html: keySvg('#C4880E') }} />
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--ink-h)' }}>geen sleutels</span>
                          )}
                        </div>
                        <button onClick={() => changeKey(p.id, 1)} disabled={keysLeft === 0} style={{
                          width: 42, height: 42, borderRadius: 12, border: '2px solid var(--border)', background: 'var(--wh)',
                          cursor: keysLeft === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--sea)', opacity: keysLeft === 0 ? 0.2 : 1, fontSize: 20, fontWeight: 700, fontFamily: 'inherit',
                        }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={doSubmit} disabled={keysUsed === 0} style={{
                width: '100%', padding: 20, background: keysUsed > 0 ? 'var(--dune)' : 'var(--ink-h)', color: '#fff',
                border: 'none', borderRadius: 16, fontFamily: "'DM Serif Display', serif", fontSize: 30,
                cursor: keysUsed > 0 ? 'pointer' : 'not-allowed', margin: '1rem 0',
              }}>Dit is &apos;m! 🗝️</button>
        </>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D5F5E3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, color: '#27AE60', fontWeight: 700 }}>✓</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: 'var(--sea)', marginBottom: 10 }}>Jouw sleutels zijn uitgedeeld!</h2>
          <p style={{ color: 'var(--ink-m)', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
            Bedankt <strong>{firstName}</strong>! Je hebt jouw sleutels verdeeld.
          </p>
          <div style={{ textAlign: 'left', maxWidth: 380, margin: '1.5rem auto' }}>
            {plans.filter(p => (myKeys[p.id] || 0) > 0).sort((a, b) => (myKeys[b.id] || 0) - (myKeys[a.id] || 0)).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--ink)' }}>{p.name}</span>
                <span style={{ color: 'var(--dune)', fontWeight: 600, whiteSpace: 'nowrap' }}>{myKeys[p.id]} sleutel{(myKeys[p.id] || 0) > 1 ? 's' : ''} 🗝️</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
