'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Plan, Enrichment, EnrichedCanvas, CostVersion, CostItem, Tip, Helper } from '@/lib/plans';
import { CATEGORY_LABELS, TIERS } from '@/lib/plans';
import ChatInterface from './ChatInterface';

const CAT_STYLES: Record<string, { bg: string; fg: string }> = {
  sport: { bg: 'var(--cat-sport-bg)', fg: 'var(--cat-sport-fg)' },
  avontuur: { bg: 'var(--cat-avontuur-bg)', fg: 'var(--cat-avontuur-fg)' },
  natuur: { bg: 'var(--cat-natuur-bg)', fg: 'var(--cat-natuur-fg)' },
  creatief: { bg: 'var(--cat-creatief-bg)', fg: 'var(--cat-creatief-fg)' },
  spel: { bg: 'var(--cat-spel-bg)', fg: 'var(--cat-spel-fg)' },
  sociaal: { bg: 'var(--cat-sociaal-bg)', fg: 'var(--cat-sociaal-fg)' },
};

const CANVAS_FIELDS: [keyof EnrichedCanvas, string][] = [
  ['for_whom', 'Voor wie?'], ['why', 'Waarom goed voor het eiland?'],
  ['need', 'Wat is er nodig?'], ['challenge', 'Grootste uitdaging'],
  ['frameworks', 'Voldoet aan kaders?'], ['enablers', 'Mogelijkmakers'],
  ['steps', 'Stappen om te realiseren'],
];

type TabKey = 'original' | 'enriched' | 'costs' | 'tips' | 'helpers' | 'chat' | 'tip-form' | 'helper-form';

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sea)', marginBottom: 4 }}>{children}</div>
);
const Value = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-l)' }}>{children}</div>
);
const Divider = () => <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />;

const ClaudeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M16.604 2.072c-.523-.27-1.162-.054-1.432.47L8.236 15.39a1.07 1.07 0 0 0 .47 1.432c.523.27 1.162.054 1.432-.47L17.074 3.504a1.07 1.07 0 0 0-.47-1.432ZM6.843 7.16c-.548-.22-1.17.046-1.39.594L2.08 16.387c-.22.548.046 1.17.594 1.39.548.22 1.17-.046 1.39-.594l3.373-8.633c.22-.548-.046-1.17-.594-1.39ZM20.354 7.16c-.548-.22-1.17.046-1.39.594l-3.373 8.633c-.22.548.046 1.17.594 1.39.548.22 1.17-.046 1.39-.594l3.373-8.633c.22-.548-.046-1.17-.594-1.39Z" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-h)',
  background: 'var(--sand)', color: 'var(--ink)', fontSize: 14, fontFamily: "'Outfit', sans-serif",
  outline: 'none', transition: 'border-color 0.15s',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' as const };

interface PlanModalProps {
  plan: Plan | null;
  onClose: () => void;
  onBudgetChange?: () => void;
  showCosts?: boolean;
}

export default function PlanModal({ plan, onClose, onBudgetChange, showCosts = true }: PlanModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('original');
  const [enrichments, setEnrichments] = useState<Enrichment[]>([]);
  const [enrichedCanvas, setEnrichedCanvas] = useState<EnrichedCanvas | null>(null);
  const [costVersions, setCostVersions] = useState<CostVersion[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activeBudgetLabel, setActiveBudgetLabel] = useState<string>('');
  const [tips, setTips] = useState<Tip[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);

  // Tip form
  const [tipName, setTipName] = useState('');
  const [tipReason, setTipReason] = useState('');
  const [tipTip, setTipTip] = useState('');
  const [tipSubmitting, setTipSubmitting] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  // Helper form
  const [helperRole, setHelperRole] = useState<'kind' | 'mogelijkmaker'>('kind');
  const [helperName, setHelperName] = useState('');
  const [helperMotivation, setHelperMotivation] = useState('');
  const [helperContribution, setHelperContribution] = useState('');
  const [helperSubmitting, setHelperSubmitting] = useState(false);
  const [helperSuccess, setHelperSuccess] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!plan) return;
    const [enrRes, canvasRes, costsRes, tipsRes, helpersRes] = await Promise.all([
      fetch(`/api/enrichments?planId=${plan.id}`).then(r => r.json()),
      fetch(`/api/canvas?planId=${plan.id}`).then(r => r.json()),
      fetch(`/api/costs?planId=${plan.id}`).then(r => r.json()),
      fetch(`/api/tips?planId=${plan.id}`).then(r => r.json()),
      fetch(`/api/helpers?planId=${plan.id}`).then(r => r.json()),
    ]);
    if (enrRes.enrichments) setEnrichments(enrRes.enrichments);
    if (canvasRes.canvas) setEnrichedCanvas(canvasRes.canvas);
    if (costsRes.versions) setCostVersions(costsRes.versions);
    if (costsRes.items) setCostItems(costsRes.items);
    if (tipsRes.tips) setTips(tipsRes.tips);
    if (helpersRes.helpers) setHelpers(helpersRes.helpers);
    const active = costsRes.versions?.find((v: CostVersion) => v.is_active);
    setSelectedVersionId(active?.id || 'original');
  }, [plan?.id]);

  useEffect(() => {
    if (plan) {
      setActiveTab('original'); setEnrichedCanvas(null); setCostVersions([]); setCostItems([]);
      setSelectedVersionId('original'); setEnrichments([]); setTips([]); setHelpers([]);
      setActiveBudgetLabel(plan.active_costs_label || '');
      setTipName(''); setTipReason(''); setTipTip(''); setTipSuccess(false);
      setHelperRole('kind'); setHelperName(''); setHelperMotivation(''); setHelperContribution(''); setHelperSuccess(false);
      fetchAll();
    }
  }, [plan?.id, fetchAll]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  if (!plan) return null;

  const tier = TIERS.find(t => t.n === (plan.active_tier || plan.tier));
  const displayBudget = plan.active_budget || plan.budget;
  const catStyle = CAT_STYLES[plan.category] || { bg: 'var(--sand)', fg: 'var(--ink-l)' };
  const origFields = [
    plan.for_whom ? ['Voor wie?', plan.for_whom] : null, plan.why ? ['Waarom goed?', plan.why] : null,
    plan.need ? ['Wat nodig?', plan.need] : null, plan.challenge ? ['Uitdaging', plan.challenge] : null,
    plan.frameworks ? ['Kaders?', plan.frameworks] : null, plan.enablers ? ['Mogelijkmakers', plan.enablers] : null,
    plan.steps ? ['Stappen', plan.steps] : null,
  ].filter(Boolean) as [string, string][];

  const showingOriginal = selectedVersionId === 'original';
  const selectedItems = !showingOriginal ? costItems.filter(c => c.version_id === selectedVersionId) : [];
  const selectedVersion = costVersions.find(v => v.id === selectedVersionId);
  const totalLow = selectedItems.reduce((s, c) => s + c.amount_low, 0);
  const totalHigh = selectedItems.reduce((s, c) => s + c.amount_high, 0);
  const isOriginalActive = !plan.active_budget;
  const isVersionActive = (vId: string) => { if (vId === 'original') return isOriginalActive; const v = costVersions.find(cv => cv.id === vId); return v?.is_active && !!plan.active_budget; };

  const activateBudget = async (versionId: string, type: 'original' | 'ai') => {
    if (!plan || activating) return;
    setActivating(true);
    try {
      await fetch('/api/activate-budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: plan.id, versionId, type }) });
      if (type === 'original') { plan.active_budget = ''; plan.active_tier = 0; plan.active_costs_label = ''; setActiveBudgetLabel(''); }
      else { plan.active_budget = `€${totalLow.toLocaleString('nl-NL')}–€${totalHigh.toLocaleString('nl-NL')}`; const avg = (totalLow + totalHigh) / 2; plan.active_tier = avg <= 700 ? 1 : avg <= 2500 ? 2 : avg <= 15000 ? 3 : avg <= 50000 ? 4 : avg <= 150000 ? 5 : 6; plan.active_costs_label = selectedVersion?.label || ''; setActiveBudgetLabel(selectedVersion?.label || ''); }
      if (onBudgetChange) onBudgetChange();
    } finally { setActivating(false); }
  };

  const submitTip = async () => {
    if (!tipName.trim() || !tipReason.trim() || !tipTip.trim() || tipSubmitting) return;
    setTipSubmitting(true);
    try {
      const res = await fetch('/api/tips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: plan.id, name: tipName, reason: tipReason, tip: tipTip }) });
      const data = await res.json();
      if (data.tip) { setTips(prev => [data.tip, ...prev]); setTipName(''); setTipReason(''); setTipTip(''); setTipSuccess(true); setTimeout(() => setTipSuccess(false), 3000); }
    } finally { setTipSubmitting(false); }
  };

  const submitHelper = async () => {
    if (!helperName.trim() || !helperMotivation.trim() || !helperContribution.trim() || helperSubmitting) return;
    setHelperSubmitting(true);
    try {
      const res = await fetch('/api/helpers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: plan.id, role: helperRole, name: helperName, motivation: helperMotivation, contribution: helperContribution }) });
      const data = await res.json();
      if (data.helper) { setHelpers(prev => [data.helper, ...prev]); setHelperName(''); setHelperMotivation(''); setHelperContribution(''); setHelperSuccess(true); setTimeout(() => setHelperSuccess(false), 3000); }
    } finally { setHelperSubmitting(false); }
  };

  const tipFormValid = tipName.trim() && tipReason.trim() && tipTip.trim();
  const helperFormValid = helperName.trim() && helperMotivation.trim() && helperContribution.trim();

  const leftTabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'original', label: 'Canvas' },
    { key: 'enriched', label: 'Verrijkt' },
    ...(showCosts ? [{ key: 'costs' as TabKey, label: 'Kosten', badge: costVersions.length > 0 ? costVersions.length + 1 : undefined }] : []),
    { key: 'tips', label: 'Tips', badge: tips.length || undefined },
    { key: 'helpers', label: 'Meehelpers', badge: helpers.length || undefined },
  ];

  const ActiveBadge = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'var(--tier1-bg)', color: 'var(--tier1-fg)', fontWeight: 600, marginLeft: 6 }}><CheckIcon /> actief</span>
  );

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--wh)', borderRadius: 16, maxWidth: 680, width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: '24px 28px 0', position: 'relative', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--border)', color: 'var(--ink-m)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, marginBottom: 6, paddingRight: 40 }}>{plan.name}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: 'var(--ink-m)', marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: catStyle.bg, color: catStyle.fg, textTransform: 'uppercase', letterSpacing: 0.3 }}>{CATEGORY_LABELS[plan.category]}</span>
            {showCosts && <span style={{ fontWeight: 600, color: 'var(--sea)' }}>{displayBudget}</span>}
            {showCosts && activeBudgetLabel && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'var(--sea-l)', color: 'var(--sea)' }}>{activeBudgetLabel}</span>}
            {tier && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: tier.bg, color: tier.fg }}>{tier.label}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 0, flex: 1, overflowX: 'auto' }}>
              {leftTabs.map(tab => {
                const isActive = activeTab === tab.key || (tab.key === 'tips' && activeTab === 'tip-form') || (tab.key === 'helpers' && activeTab === 'helper-form');
                return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  padding: '10px 12px', fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
                  border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
                  color: isActive ? 'var(--sea)' : 'var(--ink-m)',
                  borderBottom: isActive ? '2px solid var(--sea)' : '2px solid transparent',
                }}>
                  {tab.label}
                  {tab.badge && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, marginLeft: 3, background: 'var(--sea-l)', color: 'var(--sea)', fontWeight: 600 }}>{tab.badge}</span>}
                </button>
                );
              })}
            </div>
            <button onClick={() => setActiveTab('chat')} style={{
              padding: '8px 12px', fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
              border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              color: activeTab === 'chat' ? 'var(--chat-active)' : 'var(--ink-m)',
              borderBottom: activeTab === 'chat' ? '2px solid var(--chat-active)' : '2px solid transparent',
            }}><ClaudeIcon /><span>Chat</span></button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {/* ORIGINAL CANVAS */}
          {activeTab === 'original' && (
            <div style={{ padding: '16px 28px' }}>
              <div style={{ marginBottom: 14 }}><Label>Team</Label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{plan.team.map((m, i) => <span key={i} style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 14, background: 'var(--sand)', color: 'var(--ink-l)' }}>{m}</span>)}</div></div>
              {origFields.length > 0 ? (<><Divider />{origFields.map(([l, v], i) => <div key={i} style={{ marginBottom: 14 }}><Label>{l}</Label><Value>{v}</Value></div>)}</>) : (<><Divider /><p style={{ fontSize: 13, color: 'var(--ink-h)', fontStyle: 'italic' }}>Dit plan heeft nog weinig details.</p></>)}
              {enrichments.length > 0 && (<><Divider /><Label>Losse verrijkingen</Label>{enrichments.map((e, i) => (<div key={i} style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: 'var(--sea-l)', border: '1px solid var(--border)' }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sea)', marginBottom: 2 }}>{e.title}</div><div style={{ fontSize: 13, color: 'var(--ink-l)', lineHeight: 1.5 }}>{e.content}</div></div>))}</>)}
            </div>
          )}

          {/* ENRICHED CANVAS */}
          {activeTab === 'enriched' && (
            <div style={{ padding: '16px 28px' }}>
              {enrichedCanvas ? (<>
                <div style={{ fontSize: 13, color: 'var(--ink-m)', marginBottom: 16 }}>Laatst bijgewerkt: {new Date(enrichedCanvas.updated_at).toLocaleString('nl-NL')}.</div>
                {enrichedCanvas.summary && (<div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--sea-l)', border: '1px solid var(--border)', marginBottom: 16 }}><Label>Samenvatting</Label><Value>{enrichedCanvas.summary}</Value></div>)}
                {CANVAS_FIELDS.map(([key, label]) => { const val = enrichedCanvas[key] as string; if (!val) return null; return <div key={key} style={{ marginBottom: 14 }}><Label>{label}</Label><Value>{val}</Value></div>; })}
              </>) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}><p style={{ fontSize: 15, color: 'var(--ink-m)', marginBottom: 8 }}>Er is nog geen verrijkt canvas.</p><p style={{ fontSize: 13, color: 'var(--ink-h)', marginBottom: 16 }}>Stel vragen in de Chat tab.</p><button onClick={() => setActiveTab('chat')} style={{ padding: '10px 20px', borderRadius: 20, border: '1px solid var(--sea)', background: 'transparent', color: 'var(--sea)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Ga naar Chat</button></div>
              )}
            </div>
          )}

          {/* KOSTEN INDICATIE */}
          {activeTab === 'costs' && (
            <div style={{ padding: '16px 28px' }}>
              {costVersions.length > 0 && (<div style={{ marginBottom: 16 }}><Label>Versie</Label><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                <button onClick={() => setSelectedVersionId('original')} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer', border: showingOriginal ? '1.5px solid var(--ink)' : '1px solid var(--border-h)', background: showingOriginal ? 'var(--ink)' : 'transparent', color: showingOriginal ? 'var(--sand)' : 'var(--ink-m)', fontWeight: showingOriginal ? 600 : 400 }}>Eerste inschatting</button>
                {costVersions.map(v => { const sel = selectedVersionId === v.id; return (<button key={v.id} onClick={() => setSelectedVersionId(v.id)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer', border: sel ? '1.5px solid var(--sea)' : '1px solid var(--border-h)', background: sel ? 'var(--sea)' : 'transparent', color: sel ? '#fff' : 'var(--ink-m)', fontWeight: sel ? 600 : 400 }}>{v.label || `v${v.version_number}`}</button>); })}
              </div></div>)}
              {showingOriginal && (<div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Label>Eerste AI kosten indicatie</Label>{isOriginalActive && <ActiveBadge />}</div>
                {plan.costs.length > 0 ? (<><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><tbody>{plan.costs.map(([item, price], i) => (<tr key={i}><td style={{ padding: '4px 0', color: 'var(--ink-l)' }}>{item}</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--ink-l)' }}>{price}</td></tr>))}<tr><td style={{ padding: '8px 0 0', borderTop: '1px solid var(--border-h)', fontWeight: 600 }}>Totaal</td><td style={{ padding: '8px 0 0', borderTop: '1px solid var(--border-h)', textAlign: 'right', fontWeight: 600 }}>{plan.costs_total}</td></tr></tbody></table>
                  {!isOriginalActive && <button onClick={() => activateBudget('original', 'original')} disabled={activating} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 20, border: 'none', background: 'var(--ink)', color: 'var(--sand)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: activating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}><CheckIcon /> Dit wordt &apos;m</button>}
                </>) : <p style={{ fontSize: 13, color: 'var(--ink-h)', fontStyle: 'italic' }}>Geen kosten berekend.</p>}</div>)}
              {!showingOriginal && selectedItems.length > 0 && (<div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Label>{selectedVersion?.label || 'AI inschatting'}</Label><span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'var(--sea-l)', color: 'var(--sea)', fontWeight: 600 }}>AI</span>{isVersionActive(selectedVersionId!) && <ActiveBadge />}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><tbody>{selectedItems.map((c, i) => (<tr key={i}><td style={{ padding: '4px 0', color: 'var(--ink-l)' }}>{c.item}{c.note && <span style={{ fontSize: 11, color: 'var(--ink-h)', marginLeft: 4 }}>({c.note})</span>}</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--sea)' }}>€{c.amount_low.toLocaleString()}–€{c.amount_high.toLocaleString()}</td></tr>))}<tr><td style={{ padding: '8px 0 0', borderTop: '1px solid var(--border)', fontWeight: 600 }}>Totaal</td><td style={{ padding: '8px 0 0', borderTop: '1px solid var(--border)', textAlign: 'right', fontWeight: 600, color: 'var(--sea)' }}>€{totalLow.toLocaleString()}–€{totalHigh.toLocaleString()}</td></tr></tbody></table>
                {!isVersionActive(selectedVersionId!) && <button onClick={() => activateBudget(selectedVersionId!, 'ai')} disabled={activating} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 20, border: 'none', background: 'var(--sea)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: activating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}><CheckIcon /> Dit wordt &apos;m</button>}</div>)}
              {costVersions.length === 0 && (<><Divider /><div style={{ textAlign: 'center', padding: '20px 0' }}><p style={{ fontSize: 13, color: 'var(--ink-h)', marginBottom: 12 }}>Vraag de AI om kosten door te rekenen.</p><button onClick={() => setActiveTab('chat')} style={{ padding: '10px 20px', borderRadius: 20, border: '1px solid var(--sea)', background: 'transparent', color: 'var(--sea)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Ga naar Chat</button></div></>)}
            </div>
          )}

          {/* TIPS - list only */}
          {activeTab === 'tips' && (
            <div style={{ padding: '16px 28px' }}>
              {tips.length > 0 ? (<>{tips.map(t => (
                <div key={t.id} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--wh)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t.name}</span><span style={{ fontSize: 11, color: 'var(--ink-h)' }}>{new Date(t.created_at).toLocaleDateString('nl-NL')}</span></div>
                  <div style={{ fontSize: 13, color: 'var(--ink-l)', marginBottom: 4 }}><span style={{ fontWeight: 500 }}>Tof omdat:</span> {t.reason}</div>
                  <div style={{ fontSize: 13, color: 'var(--sea)' }}><span style={{ fontWeight: 500 }}>Gouden tip:</span> {t.tip}</div>
                </div>
              ))}</>) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: 15, color: 'var(--ink-m)', marginBottom: 8 }}>Nog geen tips voor dit plan.</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-h)', marginBottom: 16 }}>Ken je iemand die kan helpen? Deel een tip!</p>
                  <button onClick={() => setActiveTab('tip-form')} style={{ padding: '10px 20px', borderRadius: 20, border: 'none', background: 'var(--dune)', color: '#fff', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Geef een tip</button>
                </div>
              )}
            </div>
          )}

          {/* TIP FORM */}
          {activeTab === 'tip-form' && (
            <div style={{ padding: '16px 28px' }}>
              <div style={{ padding: '20px', borderRadius: 12, background: 'var(--sand)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--ink)' }}>💡 Ik heb een tip</div>
                <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Naam *</label><input value={tipName} onChange={e => setTipName(e.target.value)} maxLength={200} placeholder="Je naam" style={inputStyle} /></div>
                <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Ik vind dit een tof plan omdat *</label><textarea value={tipReason} onChange={e => setTipReason(e.target.value)} maxLength={1000} placeholder="Waarom vind je dit een goed plan?" style={textareaStyle} /></div>
                <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Mijn gouden tip is *</label><textarea value={tipTip} onChange={e => setTipTip(e.target.value)} maxLength={1000} placeholder="Jouw tip om dit plan nog beter te maken" style={textareaStyle} /></div>
                {tipSuccess && <div style={{ fontSize: 13, color: 'var(--sea)', fontWeight: 500, marginBottom: 10 }}>Bedankt voor je tip! <button onClick={() => setActiveTab('tips')} style={{ background: 'none', border: 'none', color: 'var(--sea)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Bekijk alle tips</button></div>}
                <button onClick={submitTip} disabled={!tipFormValid || tipSubmitting} style={{ padding: '10px 24px', borderRadius: 20, border: 'none', background: tipFormValid && !tipSubmitting ? 'var(--dune)' : 'var(--ink-h)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: tipFormValid && !tipSubmitting ? 'pointer' : 'default', width: '100%' }}>Verstuur tip</button>
              </div>
            </div>
          )}

          {/* MEEHELPERS - list only */}
          {activeTab === 'helpers' && (
            <div style={{ padding: '16px 28px' }}>
              {helpers.length > 0 ? (<>{helpers.map(h => (
                <div key={h.id} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--wh)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{h.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: h.role === 'kind' ? 'var(--cat-avontuur-bg)' : 'var(--cat-natuur-bg)', color: h.role === 'kind' ? 'var(--cat-avontuur-fg)' : 'var(--cat-natuur-fg)' }}>{h.role === 'kind' ? 'Kind' : 'Mogelijkmaker'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-l)', marginBottom: 4 }}><span style={{ fontWeight: 500 }}>Motivatie:</span> {h.motivation}</div>
                  <div style={{ fontSize: 13, color: 'var(--sea)' }}><span style={{ fontWeight: 500 }}>Helpt met:</span> {h.contribution}</div>
                </div>
              ))}</>) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: 15, color: 'var(--ink-m)', marginBottom: 8 }}>Nog niemand aangemeld.</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-h)', marginBottom: 16 }}>Wil jij meehelpen met dit plan?</p>
                  <button onClick={() => setActiveTab('helper-form')} style={{ padding: '10px 20px', borderRadius: 20, border: 'none', background: 'var(--sea)', color: '#fff', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Meld je aan</button>
                </div>
              )}
            </div>
          )}

          {/* HELPER FORM */}
          {activeTab === 'helper-form' && (
            <div style={{ padding: '16px 28px' }}>
              <div style={{ padding: '20px', borderRadius: 12, background: 'var(--sand)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--ink)' }}>🤝 Meehelpen</div>
                <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Ik ben een *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['kind', 'mogelijkmaker'] as const).map(r => (
                      <button key={r} onClick={() => setHelperRole(r)} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', border: helperRole === r ? '1.5px solid var(--sea)' : '1px solid var(--border-h)', background: helperRole === r ? 'var(--sea-l)' : 'transparent', color: helperRole === r ? 'var(--sea)' : 'var(--ink-m)', fontWeight: helperRole === r ? 600 : 400 }}>
                        {r === 'kind' ? 'Kind' : 'Mogelijkmaker'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Naam *</label><input value={helperName} onChange={e => setHelperName(e.target.value)} maxLength={200} placeholder="Je naam" style={inputStyle} /></div>
                <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Ik wil meedoen omdat *</label><textarea value={helperMotivation} onChange={e => setHelperMotivation(e.target.value)} maxLength={1000} placeholder="Waarom wil je meehelpen?" style={textareaStyle} /></div>
                <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-l)', display: 'block', marginBottom: 4 }}>Ik wil meehelpen met *</label><textarea value={helperContribution} onChange={e => setHelperContribution(e.target.value)} maxLength={1000} placeholder="Waarmee kun je helpen?" style={textareaStyle} /></div>
                {helperSuccess && <div style={{ fontSize: 13, color: 'var(--sea)', fontWeight: 500, marginBottom: 10 }}>Welkom aan boord! <button onClick={() => setActiveTab('helpers')} style={{ background: 'none', border: 'none', color: 'var(--sea)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Bekijk alle meehelpers</button></div>}
                <button onClick={submitHelper} disabled={!helperFormValid || helperSubmitting} style={{ padding: '10px 24px', borderRadius: 20, border: 'none', background: helperFormValid && !helperSubmitting ? 'var(--sea)' : 'var(--ink-h)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: helperFormValid && !helperSubmitting ? 'pointer' : 'default', width: '100%' }}>Aanmelden</button>
              </div>
            </div>
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <div style={{ padding: '16px 28px' }}>
              <ChatInterface plan={plan}
                onEnrichment={(n) => { setEnrichments(prev => [...prev, ...n.map(e => ({ ...e, id: crypto.randomUUID(), created_at: new Date().toISOString() })) as Enrichment[]]); }}
                onCanvasUpdate={() => { fetch(`/api/canvas?planId=${plan.id}`).then(r => r.json()).then(d => { if (d.canvas) setEnrichedCanvas(d.canvas); }); }}
                onCostsUpdate={() => { fetch(`/api/costs?planId=${plan.id}`).then(r => r.json()).then(d => { setCostVersions(d.versions || []); setCostItems(d.items || []); const active = d.versions?.find((v: CostVersion) => v.is_active); if (active) setSelectedVersionId(active.id); }); }}
              />
            </div>
          )}
        </div>

        {/* Sticky footer with two buttons */}
        <div style={{ padding: '12px 28px 16px', borderTop: '1px solid var(--border)', background: 'var(--wh)', borderRadius: '0 0 16px 16px', flexShrink: 0, display: 'flex', gap: 8 }}>
          <button onClick={() => setActiveTab('tip-form')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 50, border: 'none', cursor: 'pointer',
            background: 'var(--dune)', color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
          }}>💡 Ik heb een tip</button>
          <button onClick={() => setActiveTab('helper-form')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 50, border: 'none', cursor: 'pointer',
            background: 'var(--sea)', color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
          }}>🤝 Meehelpen</button>
        </div>
      </div>
    </div>
  );
}
