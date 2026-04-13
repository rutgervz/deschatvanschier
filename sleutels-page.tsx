'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Plan } from '@/lib/plans';

const SLOT_KEYS = [3, 2, 1];
const SLOT_LABELS = ['Nummer 1', 'Nummer 2', 'Nummer 3'];
const GROUPS = ['0-4 jaar', 'Groep 1-2', 'Groep 3-4', 'Groep 5-6', 'Groep 7-8', 'Klas 1-2', 'Klas 3-4', 'Klas 5-6 / MBO / HBO'];

function KeyIcon({ color = '#C4880E', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 28" width={size} height={size * 28 / 24} fill={color}>
      <circle cx="12" cy="8" r="6" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="12" cy="8" r="3.5" fill={color} opacity={0.3} />
      <rect x="10.5" y="14" width="3" height="12" rx="1.5" />
      <rect x="13.5" y="19" width="4" height="2.5" rx="1" />
      <rect x="13.5" y="23" width="3" height="2.5" rx="1" />
    </svg>
  );
}

function VisualKeys({ count, color = '#C4880E', size = 22 }: { count: number; color?: string; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: count }, (_, i) => (
        <KeyIcon key={i} color={color} size={size} />
      ))}
    </span>
  );
}

export default function SleutelsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'reg' | 'vote' | 'done'>('reg');
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [group, setGroup] = useState('');

  // choices[0] = plan_id for 3 keys, [1] for 2 keys, [2] for 1 key
  const [choices, setChoices] = useState<(number | null)[]>([null, null, null]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans.filter((p: Plan) => p.status === 'door_naar_slotdag'));
      }
    } catch { console.error('Failed to load plans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const formValid = firstName.trim() && lastName.trim() && dob && group;
  const nextSlot = choices.findIndex(c => c === null);
  const allChosen = !choices.includes(null);

  const selectPlan = (planId: number) => {
    if (nextSlot < 0 || choices.includes(planId)) return;
    const next = [...choices];
    next[nextSlot] = planId;
    setChoices(next);
  };

  const clearSlot = (idx: number) => {
    const next = [...choices];
    next[idx] = null;
    setChoices(next);
  };

  const doSubmit = async () => {
    if (!allChosen || submitting) return;
    setSubmitting(true);
    const votes = choices.map((planId, i) => ({ plan_id: planId!, keys: SLOT_KEYS[i] }));
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, dob, group, votes }),
      });
      if (res.ok) setPhase('done');
      else alert('Er ging iets mis. Probeer het opnieuw.');
    } catch { alert('Er ging iets mis. Controleer je internetverbinding.'); }
    finally { setSubmitting(false); }
  };

  const getPlan = (id: number | null) => id !== null ? plans.find(p => p.id === id) : null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--border-h)',
    borderRadius: 10, fontFamily: 'inherit', fontSize: 14,
    background: 'var(--sand)', color: 'var(--ink)', outline: 'none',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-m)' }}>Laden...</div>;

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '0 1rem 2rem', fontFamily: "'Outfit', sans-serif" }}>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
        <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🗝️</span>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: 'var(--sea)', marginBottom: 6 }}>
          Deel jouw sleutels uit
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-m)', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Kies 3 plannen. Je favoriet krijgt 3 sleutels, je nummer twee 2 sleutels, en je nummer drie 1 sleutel.
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
              <select value={group} onChange={e => setGroup(e.target.value)} style={{ ...inputStyle, appearance: 'auto' as const }}>
                <option value="">Kies je groep...</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setPhase('vote')} disabled={!formValid} style={{
            width: '100%', padding: 14, background: formValid ? 'var(--sea)' : 'var(--ink-h)',
            color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: 16,
            fontWeight: 600, cursor: formValid ? 'pointer' : 'not-allowed', marginTop: 6,
          }}>Laat de plannen zien! 🗝️</button>
        </div>
      )}

      {/* VOTING */}
      {phase === 'vote' && (
        <>
          {/* Three slots with posters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[0, 1, 2].map(i => {
              const plan = getPlan(choices[i]);
              const filled = !!plan;
              const isNext = i === nextSlot;

              return (
                <div key={i} onClick={() => filled && clearSlot(i)} style={{
                  flex: 1, background: 'var(--wh)', borderRadius: 16, overflow: 'hidden',
                  border: filled ? '2.5px solid var(--dune)' : isNext ? '2.5px dashed var(--sea)' : '2.5px dashed var(--border-h)',
                  cursor: filled ? 'pointer' : 'default', position: 'relative',
                  display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s',
                  animation: isNext ? 'pulse 1.2s ease infinite' : undefined,
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '3/4', background: 'var(--sand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {filled && plan!.poster_url ? (
                      <Image src={plan!.poster_url} alt={plan!.name} fill sizes="200px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 32, color: 'var(--border-h)', fontWeight: 600 }}>?</span>
                    )}
                  </div>
                  <div style={{ padding: '8px 6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: 'var(--ink-m)' }}>{SLOT_LABELS[i]}</div>
                    <VisualKeys count={SLOT_KEYS[i]} size={20} />
                    {filled ? (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                        {plan!.name}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--ink-h)', fontStyle: 'italic' }}>{isNext ? '← kies hieronder' : '—'}</div>
                    )}
                  </div>
                  {filled && (
                    <button onClick={e => { e.stopPropagation(); clearSlot(i); }} style={{
                      position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(192,57,43,0.9)', color: '#fff', border: 'none', cursor: 'pointer',
                      fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}>×</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prompt */}
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-m)', marginBottom: 14, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {nextSlot >= 0 ? (
              <>Kies je <strong>{SLOT_LABELS[nextSlot].toLowerCase()}</strong> — dit plan krijgt <VisualKeys count={SLOT_KEYS[nextSlot]} size={16} /></>
            ) : (
              'Je hebt al je sleutels verdeeld! Klik op een vak hierboven om te wijzigen.'
            )}
          </div>

          {/* Plan grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
            {plans.map(p => {
              const isChosen = choices.includes(p.id);
              const slotIdx = choices.indexOf(p.id);
              const isDisabled = !isChosen && nextSlot < 0;

              return (
                <div key={p.id} onClick={() => {
                  if (isChosen) clearSlot(slotIdx);
                  else if (!isDisabled) selectPlan(p.id);
                }} style={{
                  background: 'var(--wh)', borderRadius: 14, overflow: 'hidden',
                  border: isChosen ? '1.5px solid var(--dune)' : '1.5px solid var(--border)',
                  boxShadow: isChosen ? '0 0 0 2px var(--dune-light, #F0D78C)' : 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.35 : 1, transition: 'all 0.25s', position: 'relative',
                }}>
                  <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--sand)', overflow: 'hidden', position: 'relative' }}>
                    {p.poster_url ? (
                      <Image src={p.poster_url} alt={p.name} fill sizes="(max-width:500px) 50vw, 200px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🗝️</div>
                    )}
                    {isChosen && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,168,67,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'var(--dune)', color: '#fff', fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 600, padding: '6px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          #{slotIdx + 1}
                          <VisualKeys count={SLOT_KEYS[slotIdx]} color="#fff" size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '6px 10px 2px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>{p.name}</div>
                  <div style={{ padding: '0 10px 8px', fontSize: 11, color: 'var(--ink-m)', textAlign: 'center' }}>{p.budget}</div>
                </div>
              );
            })}
          </div>

          <button onClick={doSubmit} disabled={!allChosen || submitting} style={{
            width: '100%', padding: 20, background: allChosen ? 'var(--dune)' : 'var(--ink-h)',
            color: '#fff', border: 'none', borderRadius: 16, fontFamily: "'DM Serif Display', serif",
            fontSize: 30, cursor: allChosen && !submitting ? 'pointer' : 'not-allowed',
            margin: '1rem 0', opacity: submitting ? 0.7 : 1,
          }}>{submitting ? 'Even geduld...' : "Dit is 'm! 🗝️"}</button>
        </>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D5F5E3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, color: '#27AE60', fontWeight: 700 }}>✓</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: 'var(--sea)', marginBottom: 10 }}>Jouw stem is uitgebracht!</h2>
          <p style={{ color: 'var(--ink-m)', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>Bedankt <strong>{firstName}</strong>!</p>
          <div style={{ textAlign: 'left', maxWidth: 420, margin: '1.5rem auto' }}>
            {choices.map((planId, i) => {
              const plan = getPlan(planId);
              if (!plan) return null;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 48, height: 64, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--sand)' }}>
                    {plan.poster_url && <Image src={plan.poster_url} alt={plan.name} fill sizes="48px" style={{ objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-m)' }}>{SLOT_LABELS[i]}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{plan.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-m)' }}>{plan.budget}</div>
                  </div>
                  <VisualKeys count={SLOT_KEYS[i]} size={18} />
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: '1.5rem', color: 'var(--ink-m)', fontSize: 15 }}>Straks maken we de uitslag bekend! 🎉</p>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{border-color:var(--sea)} 50%{border-color:var(--sea-l,#3AAFA9)} }`}</style>
    </div>
  );
}
