'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS, TIERS } from '@/lib/plans';
import type { Plan } from '@/lib/plans';
import PlanModal from '@/components/PlanModal';

const CAT_STYLES: Record<string, { bg: string; fg: string }> = {
  sport: { bg: 'var(--cat-sport-bg)', fg: 'var(--cat-sport-fg)' },
  avontuur: { bg: 'var(--cat-avontuur-bg)', fg: 'var(--cat-avontuur-fg)' },
  natuur: { bg: 'var(--cat-natuur-bg)', fg: 'var(--cat-natuur-fg)' },
  creatief: { bg: 'var(--cat-creatief-bg)', fg: 'var(--cat-creatief-fg)' },
  spel: { bg: 'var(--cat-spel-bg)', fg: 'var(--cat-spel-fg)' },
  sociaal: { bg: 'var(--cat-sociaal-bg)', fg: 'var(--cat-sociaal-fg)' },
};

function generateCloudWords(plans: Plan[]): { t: string; w: number; id: number }[] {
  return plans.map(p => {
    const teamSize = p.team.filter(t => t !== '(nog geen team)' && t !== 'Bijna alle kinderen').length;
    const w = Math.max(2, Math.min(10, teamSize + 2));
    const label = p.cloud_label || p.name.split(' ')[0];
    return { t: label, w, id: p.id };
  }).sort((a, b) => b.w - a.w);
}

export default function MogelijkmaakdagPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('alpha');
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCosts, setShowCosts] = useState(false);
  const cloudRef = useRef<HTMLDivElement>(null);

  // Fetch plans and settings from database
  const fetchPlans = useCallback(async () => {
    try {
      const [plansRes, settingsRes] = await Promise.all([
        fetch('/api/plans').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);
      if (plansRes.plans) setPlans(plansRes.plans);
      if (settingsRes.settings) setShowCosts(settingsRes.settings.show_costs === 'true');
    } catch {
      console.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const cloudWords = generateCloudWords(plans);

  const layoutCloud = useCallback(() => {
    const c = cloudRef.current;
    if (!c || plans.length === 0) return;
    c.innerHTML = '';
    const W = c.offsetWidth, H = c.offsetHeight, cx = W / 2, cy = H / 2;
    if (W < 10) return;
    const count = cloudWords.length;
    const mn = Math.max(11, W * 0.013), mx = Math.max(24, W * 0.042);
    const maxW = Math.max(...cloudWords.map(w => w.w)), minW = Math.min(...cloudWords.map(w => w.w));
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const pad = 10; // minimum gap between words

    cloudWords.forEach((word) => {
      const idea = plans.find(i => i.id === word.id);
      if (!idea) return;
      const t = minW === maxW ? 1 : (word.w - minW) / (maxW - minW);
      const fs = mn + t * (mx - mn);
      const fw = t > 0.6 ? 800 : t > 0.3 ? 600 : 400;
      const el = document.createElement('div');
      el.textContent = word.t;
      Object.assign(el.style, {
        position: 'absolute', cursor: 'pointer', whiteSpace: 'nowrap',
        fontFamily: "'Outfit', sans-serif", fontSize: fs + 'px', fontWeight: String(fw),
        color: CATEGORY_COLORS[idea.category], padding: '2px 6px', borderRadius: '6px',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', userSelect: 'none',
      });
      el.onmouseenter = () => { el.style.transform = 'scale(1.15)'; el.style.zIndex = '10'; };
      el.onmouseleave = () => { el.style.transform = ''; el.style.zIndex = ''; };
      el.onclick = () => setSelectedPlan(idea);
      c.appendChild(el);
      const eW = el.offsetWidth, eH = el.offsetHeight;
      let bx = cx - eW / 2, by = cy - eH / 2, found = false;

      for (let s = 0; s < 1200 && !found; s++) {
        const a = s * 0.3;
        const r = s * 0.45;
        const tx = cx + Math.cos(a) * r * ((W - eW) / (W * 1.1)) - eW / 2;
        const ty = cy + Math.sin(a) * r * ((H - eH) / (H * 1.4)) - eH / 2;
        if (tx < 2 || ty < 2 || tx + eW > W - 2 || ty + eH > H - 2) continue;
        let ov = false;
        for (const p of placed) {
          if (tx < p.x + p.w + pad && tx + eW + pad > p.x && ty < p.y + p.h + pad && ty + eH + pad > p.y) { ov = true; break; }
        }
        if (!ov) { bx = tx; by = ty; found = true; }
      }

      if (!found) {
        // If spiral failed, don't show this word (better than overlapping)
        el.style.display = 'none';
        return;
      }

      el.style.left = bx + 'px';
      el.style.top = by + 'px';
      placed.push({ x: bx, y: by, w: eW, h: eH });
    });
  }, [plans, cloudWords]);

  useEffect(() => {
    if (plans.length > 0) layoutCloud();
    let timer: ReturnType<typeof setTimeout>;
    const handleResize = () => { clearTimeout(timer); timer = setTimeout(layoutCloud, 200); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutCloud, plans]);

  useEffect(() => {
    document.body.style.overflow = selectedPlan ? 'hidden' : '';
  }, [selectedPlan]);

  const searchLower = search.toLowerCase().trim();
  const filteredPlans = plans
    .filter(p => filter === 'all' || p.category === filter)
    .filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.team.some(t => t.toLowerCase().includes(searchLower)) || (p.for_whom || '').toLowerCase().includes(searchLower))
    .sort((a, b) => {
      if (sort === 'alpha') return a.name.localeCompare(b.name);
      if (sort === 'budget') return (a.active_tier || a.tier) - (b.active_tier || b.tier);
      if (sort === 'team') return b.team.length - a.team.length;
      return 0;
    });

  const cats = [{ k: 'all', l: 'Alles' }, ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ k, l: v }))];
  const sortOpts = [{ k: 'alpha', l: 'A → Z' }, { k: 'budget', l: 'Budget' }, { k: 'team', l: 'Teamgrootte' }];
  const planCount = plans.length;

  return (
    <>
      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
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
          {planCount > 0 ? `${planCount} plannen` : 'Plannen'} van de kinderen van Schiermonnikoog. Op de Mogelijkmaakdag op 1 april 2026 in De Stag (16.00–20.00 uur, inclusief eten) brengen we ze samen met de mensen die ze kunnen helpen realiseren.
        </p>
        <a href="#plannen" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--sea)',
          color: '#fff', padding: '14px 32px', borderRadius: 50, fontSize: 15, fontWeight: 500,
          textDecoration: 'none', position: 'relative',
        }}>Bekijk alle plannen ↓</a>
        <div style={{
          position: 'absolute', bottom: '2rem', fontSize: 12, color: 'var(--ink-h)',
          animation: 'bounce 2s infinite',
        }}>scroll naar beneden</div>
        <style>{`@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }`}</style>
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
          <a href="#wordcloud" style={{ fontSize: 13, color: 'var(--ink-m)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Wordcloud</a>
          <a href="#plannen" style={{ fontSize: 13, color: 'var(--ink-m)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Alle plannen</a>
          {showCosts && <a href="#budget" style={{ fontSize: 13, color: 'var(--ink-m)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Budgetschaal</a>}
        </div>
      </nav>

      {/* WORDCLOUD */}
      <section id="wordcloud" style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sea)', marginBottom: '0.5rem' }}>Overzicht</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, marginBottom: '0.5rem' }}>Wat leeft er op het eiland?</div>
        <p style={{ fontSize: 15, color: 'var(--ink-l)', maxWidth: 600, lineHeight: 1.6, marginBottom: '1.5rem' }}>Hoe groter het woord, hoe meer kinderen erbij betrokken zijn. Klik op een woord voor details.</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-m)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[k] }} />{v}
            </div>
          ))}
        </div>
        <div ref={cloudRef} style={{ position: 'relative', width: '100%', height: 520 }} />
      </section>

      {/* ALL PLANS */}
      <section id="plannen" style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sea)', marginBottom: '0.5rem' }}>{planCount} plannen</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, marginBottom: '0.5rem' }}>Alle plannen</div>
        <p style={{ fontSize: 15, color: 'var(--ink-l)', maxWidth: 600, lineHeight: 1.6, marginBottom: '1.5rem' }}>Klik op een plan voor het volledige canvas met concept kostenberekening.</p>

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op plan, naam of team..."
            style={{
              width: '100%', maxWidth: 400, padding: '10px 16px', borderRadius: 50,
              border: '1px solid var(--border-h)', background: 'var(--wh)', color: 'var(--ink)',
              fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: 'none',
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-h)', fontSize: 14 }}>Plannen laden...</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {cats.map(c => (
                <button key={c.k} onClick={() => setFilter(c.k)} style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: 13, padding: '7px 16px', borderRadius: 20,
                  border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer',
                  background: filter === c.k ? 'var(--ink)' : 'transparent',
                  color: filter === c.k ? 'var(--sand)' : 'var(--ink-m)',
                  borderColor: filter === c.k ? 'var(--ink)' : undefined,
                }}>
                  {c.l} ({c.k === 'all'
                    ? plans.filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.team.some(t => t.toLowerCase().includes(searchLower)) || (p.for_whom || '').toLowerCase().includes(searchLower)).length
                    : plans.filter(p => p.category === c.k).filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.team.some(t => t.toLowerCase().includes(searchLower)) || (p.for_whom || '').toLowerCase().includes(searchLower)).length
                  })
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-m)' }}>Sorteer:</span>
              {sortOpts.map(s => (
                <button key={s.k} onClick={() => setSort(s.k)} style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: 13, padding: '7px 16px', borderRadius: 20,
                  border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer',
                  background: sort === s.k ? 'var(--ink)' : 'transparent',
                  color: sort === s.k ? 'var(--sand)' : 'var(--ink-m)',
                  borderColor: sort === s.k ? 'var(--ink)' : undefined,
                }}>{s.l}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {filteredPlans.map(p => {
                const cs = CAT_STYLES[p.category] || { bg: '#eee', fg: '#333' };
                const displayBudget = p.active_budget || p.budget;
                return (
                  <div key={p.id} onClick={() => setSelectedPlan(p)} style={{
                    background: 'var(--wh)', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '18px 22px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-h)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{p.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 12, whiteSpace: 'nowrap', background: cs.bg, color: cs.fg, textTransform: 'uppercase', letterSpacing: 0.3 }}>{CATEGORY_LABELS[p.category]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-m)', marginBottom: 4 }}>{p.team.join(', ')}</div>
                    {showCosts && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--sea)', fontWeight: 500 }}>{displayBudget}</span>
                      {p.active_costs_label && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: 'var(--sea-l)', color: 'var(--sea)', fontWeight: 600 }}>{p.active_costs_label}</span>}
                    </div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* BUDGET SCALE */}
      {showCosts && (
      <section id="budget" style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sea)', marginBottom: '0.5rem' }}>Haalbaarheid</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, marginBottom: '0.5rem' }}>Budgetschaal</div>
        <p style={{ fontSize: 15, color: 'var(--ink-l)', maxWidth: 600, lineHeight: 1.6, marginBottom: '2rem' }}>Van vrijwel gratis tot megaproject. Klik voor onderbouwing.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {TIERS.map(tier => {
            const items = plans.filter(p => (p.active_tier || p.tier) === tier.n);
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
                      <div key={p.id} onClick={() => setSelectedPlan(p)} style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                        background: tier.bg, color: tier.fg, transition: 'transform 0.12s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = ''; }}
                      >{p.name}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', fontSize: 13, color: 'var(--ink-h)', borderTop: '1px solid var(--border)' }}>
        De Schat van Schier · <a href="https://deschatvanschier.nl" style={{ color: 'var(--sea)', textDecoration: 'none' }}>deschatvanschier.nl</a> · Mogelijkmaakdag 1 april 2026
        <br />Een initiatief van en voor de kinderen van Schiermonnikoog
      </footer>

      {/* MODAL */}
      {selectedPlan && (
        <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} onBudgetChange={() => fetchPlans()} showCosts={showCosts} />
      )}
    </>
  );
}
