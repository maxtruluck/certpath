'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [sprintType, setSprintType] = useState<string>('');
  const [activeCertId, setActiveCertId] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const { data: profile } = await supabase
        .from('users')
        .select('display_name, current_role')
        .limit(1)
        .single();

      if (profile) {
        setDisplayName(profile.display_name ?? '');
        setCurrentRole(profile.current_role ?? '');
      }

      const { data: activeCert } = await supabase
        .from('user_certifications')
        .select('certification_id, sprint_type')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (activeCert) {
        setSprintType(activeCert.sprint_type ?? '');
        setActiveCertId(activeCert.certification_id);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  async function handleSave() {
    setSaving(true);

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        current_role: currentRole,
        sprint_type: sprintType,
        certification_id: activeCertId,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-cp-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Settings</h1>
        <button onClick={() => router.back()} className="text-sm font-bold text-cp-text-muted hover:text-cp-text transition-colors">
          Done
        </button>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 space-y-4 animate-fade-up">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-cp-text-muted">Profile</h3>

        <div>
          <label className="block text-xs font-bold text-cp-text-secondary mb-1.5">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 bg-cp-bg-secondary border-2 border-cp-border rounded-xl text-cp-text font-medium focus:outline-none focus:border-cp-green transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-cp-text-secondary mb-1.5">Current Role</label>
          <input
            type="text"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="w-full px-4 py-3 bg-cp-bg-secondary border-2 border-cp-border rounded-xl text-cp-text font-medium focus:outline-none focus:border-cp-green transition-colors"
            placeholder="e.g., Help Desk Analyst"
          />
        </div>
      </div>

      {/* Study Pace */}
      {activeCertId && (
        <div className="rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 space-y-4 animate-fade-up">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-cp-text-muted">Study Pace</h3>
          <div className="space-y-2">
            {[
              { type: 'sprint_30', label: '30-Day Sprint', desc: '~15 min/day', badge: 'Aggressive', color: 'text-cp-danger' },
              { type: 'sprint_60', label: '60-Day Sprint', desc: '~10 min/day', badge: 'Balanced', color: 'text-cp-green' },
              { type: 'sprint_90', label: '90-Day Sprint', desc: '~5 min/day', badge: 'Casual', color: 'text-cp-success' },
            ].map((option) => (
              <button
                key={option.type}
                onClick={() => setSprintType(option.type)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  sprintType === option.type
                    ? 'border-cp-green bg-cp-green/10'
                    : 'border-cp-border bg-cp-bg-secondary hover:border-cp-green/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{option.label}</p>
                    <p className="text-xs text-cp-text-muted">{option.desc}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full bg-cp-bg-secondary font-extrabold ${option.color}`}>
                    {option.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        loading={saving}
        variant={saved ? 'success' : 'primary'}
        className="w-full"
        size="lg"
      >
        {saved ? 'Saved!' : 'Save Changes'}
      </Button>

      {/* Account */}
      <div className="rounded-2xl bg-white border-2 border-cp-border p-5 space-y-3 animate-fade-up">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-cp-text-muted">Account</h3>
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-cp-bg-secondary border-2 border-cp-border hover:border-cp-danger/40 text-cp-text-muted hover:text-cp-danger text-sm font-bold transition-all"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
