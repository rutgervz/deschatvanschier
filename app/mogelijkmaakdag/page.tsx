'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { TIERS } from '@/lib/plans';
import type { Plan } from '@/lib/plans';

export default function MogelijkmaakdagPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/plans').then(r => r.json());
      if (res.plans) setPlans(res.plans);
    } catch {
      console.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const activePlans = plans
    .filter(p => p.status === 'door_naar_slotdag')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {/* HERO */}
      <section style={{
        minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '2rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 30% 60%, rgba(29,122,138,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(196,136,14,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(29,158,117,0.05) 0%, transparent 40%)',
        }} />
        <h1 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(42px, 7vw, 80px)',
          fontWeight: 400, lineHeight: 1.1, marginBottom: '1rem', position: 'relative',
        }}>De <span style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, color: 'var(--sea)', fontSize: '1.15em' }}>Schat</span> van Schier</h1>
        <p style={{
          fontSize: 'clamp(16px, 2.2vw, 20px)', color: 'var(--ink-l)', maxWidth: 560,
          lineHeight: 1.6, marginBottom: '2rem', position: 'relative',
        }}>
          Dit zijn de 16 plannen waarop kan worden gestemd door de kinderen van Schiermonnikoog, zodat ruim €&nbsp;50.000 euro vanuit de Buitenkans Junior kan worden toegekend. Het stemmen gebeurt op 15 april op De Viermaster.
        </p>
        <div style={{
          textAlign: 'left', maxWidth: 480, fontSize: 'clamp(14px, 1.8vw, 16px)', color: 'var(--ink-l)',
          lineHeight: 1.7, marginBottom: '1.5rem', position: 'relative',
        }}>
          <div style={{ marginBottom: 4 }}>🕘 9:00 – 9:45 groep 5678 op hun leerplein</div>
          <div style={{ marginBottom: 4 }}>🕘 9:45 – 10:30 alle klassen VO (locatie volgt)</div>
          <div style={{ marginBottom: 12 }}>🕘 vanaf 10:30 groep 1234 op hun eigen leerplein</div>
          <div style={{ fontSize: 'clamp(13px, 1.6vw, 15px)', color: 'var(--ink-m)' }}>Wie niet aanwezig kan zijn kan op deze website digitaal stemmen tussen 9:00 en 11:00 uur.</div>
        </div>
        <a href="#plannen" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--sea)',
          color: '#fff', padding: '14px 32px', borderRadius: 50, fontSize: 15, fontWeight: 500,
          textDecoration: 'none', position: 'relative',
        }}>Bekijk alle plannen ↓</a>
      </section>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 2rem',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center',
          gap: '2rem', height: 56, overflowX: 'auto',
        }}>
          <a href="#" style={{ fontFamily: "'Caveat', cursive", fontSize: 20, fontWeight: 700, color: 'var(--sea)', whiteSpace: 'nowrap', textDecoration: 'none' }}>De Schat van Schier</a>
          <a href="#plannen" style={{ fontSize: 13, color: 'var(--ink-m)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Alle plannen</a>
          <a href="#budget" style={{ fontSize: 13, color: 'var(--ink-m)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Budgetschaal</a>
        </div>
      </nav>

      {/* PLANNEN */}
      <section id="plannen" style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem 4rem' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, marginBottom: '0.5rem' }}>Alle plannen</div>
        <p style={{ fontSize: 15, color: 'var(--ink-l)', maxWidth: 600, lineHeight: 1.6, marginBottom: '2rem' }}>
          {activePlans.length} plannen die door gaan naar de stemronde.
        </p>

        {loading ? (
          <p style={{ fontSize: 14, color: 'var(--ink-m)' }}>Plannen laden...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {activePlans.map(p => (
              <div key={p.id} style={{
                background: 'var(--wh)', border: '1px solid var(--border)', borderRadius: 12,
                overflow: 'hidden', transition: 'transform 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; }}
              >
                <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: 'var(--sand)', position: 'relative' }}>
                  {p.poster_url && <Image src={p.poster_url} alt={p.name} fill sizes="(max-width: 600px) 100vw, 300px" style={{ objectFit: 'contain' }} />}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 18, color: 'var(--sea)', fontWeight: 700 }}>{p.budget}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BUDGET SCALE */}
      <section id="budget" style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, marginBottom: '0.5rem' }}>Budgetschaal</div>
        <p style={{ fontSize: 15, color: 'var(--ink-l)', maxWidth: 600, lineHeight: 1.6, marginBottom: '2rem' }}>Van vrijwel gratis tot megaproject.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {TIERS.map(tier => {
            const items = activePlans.filter(p => p.tier === tier.n);
            if (!items.length) return null;
            return (
              <div key={tier.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 6, minHeight: 40, borderRadius: 3, flexShrink: 0, alignSelf: 'stretch', background: tier.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{tier.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-m)' }}>{tier.range}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {items.map(p => (
                      <div key={p.id} style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 8,
                        background: tier.bg, color: tier.fg,
                      }}>{p.name}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', fontSize: 13, color: 'var(--ink-h)', borderTop: '1px solid var(--border)' }}>
        De Schat van Schier · <a href="https://deschatvanschier.nl" style={{ color: 'var(--sea)', textDecoration: 'none' }}>deschatvanschier.nl</a> · Mogelijkmaakdag 1 april 2026
        <br />Een initiatief van en voor de kinderen van Schiermonnikoog
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
          <img src="/buitenkans.jpg" alt="Buitenkans voor het eiland" style={{ height: 50, objectFit: 'contain' }} />
          <img src="/eu-rijksoverheid.png" alt="Medegefinancierd door de Europese Unie / Rijksoverheid" style={{ height: 45, objectFit: 'contain' }} />
        </div>
      </footer>
    </>
  );
}
