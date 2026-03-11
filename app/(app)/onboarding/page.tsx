'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format';

interface CareerPath {
  id: string;
  name: string;
  starting_role: string;
  target_role: string;
  starting_salary_usd: number;
  target_salary_usd: number;
  estimated_months: number;
  description: string;
}

const salaryRanges = [
  { label: 'Under $30K', value: 2500000 },
  { label: '$30–50K', value: 4000000 },
  { label: '$50–70K', value: 6000000 },
  { label: '$70–100K', value: 8500000 },
  { label: '$100K+', value: 12000000 },
  { label: 'Prefer not to say', value: 0 },
];

const experienceLevels = ['Just starting out', '1–3 years', '3–5 years', '5+ years'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [currentRole, setCurrentRole] = useState('');
  const [currentSalary, setCurrentSalary] = useState(0);
  const [experience, setExperience] = useState('');

  // Step 2
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [firstCertId, setFirstCertId] = useState<string>('');
  const [firstCertName, setFirstCertName] = useState<string>('');

  // Step 3
  const [sprintType, setSprintType] = useState<'sprint_30' | 'sprint_60' | 'sprint_90'>('sprint_60');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('career_paths')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setCareerPaths(data);
      });
  }, []);

  useEffect(() => {
    if (selectedPath) {
      const supabase = createClient();
      supabase
        .from('career_path_milestones')
        .select('certification_id, certifications(short_name)')
        .eq('career_path_id', selectedPath)
        .order('milestone_order')
        .limit(1)
        .then(({ data }) => {
          if (data && data[0]) {
            setFirstCertId(data[0].certification_id);
            const cert = data[0].certifications as unknown as { short_name: string } | null;
            setFirstCertName(cert?.short_name ?? '');
          }
        });
    }
  }, [selectedPath]);

  async function handleComplete() {
    setLoading(true);
    const res = await fetch('/api/user/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_role: currentRole,
        current_salary: currentSalary,
        target_role: careerPaths.find((p) => p.id === selectedPath)?.target_role ?? '',
        career_path_id: selectedPath,
        certification_id: firstCertId,
        sprint_type: sprintType,
      }),
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress indicators */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-10 bg-cp-green'
                  : s < step
                  ? 'w-10 bg-cp-success'
                  : 'w-10 bg-cp-bg-secondary'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Where are you now?</h2>
              <p className="text-cp-text-muted mt-1 text-sm">Tell us about your current position</p>
            </div>

            <div>
              <label className="block text-[10px] text-cp-text-muted uppercase tracking-widest font-bold mb-2">Current Job Title</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-cp-border rounded-xl text-cp-text focus:outline-none focus:border-cp-green transition-colors"
                placeholder="e.g., Help Desk Analyst"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cp-text-muted uppercase tracking-widest font-bold mb-2">Current Salary Range</label>
              <div className="grid grid-cols-2 gap-2">
                {salaryRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setCurrentSalary(range.value)}
                    className={`px-3 py-2.5 text-sm rounded-xl border-2 transition-all font-medium ${
                      currentSalary === range.value
                        ? 'border-cp-green bg-cp-green/15 text-cp-green'
                        : 'border-cp-border bg-white text-cp-text-muted hover:border-cp-green/30'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-cp-text-muted uppercase tracking-widest font-bold mb-2">Experience Level</label>
              <div className="grid grid-cols-2 gap-2">
                {experienceLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setExperience(level)}
                    className={`px-3 py-2.5 text-sm rounded-xl border-2 transition-all font-medium ${
                      experience === level
                        ? 'border-cp-green bg-cp-green/15 text-cp-green'
                        : 'border-cp-border bg-white text-cp-text-muted hover:border-cp-green/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!currentRole} className="btn-primary w-full py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Where do you want to go?</h2>
              <p className="text-cp-text-muted mt-1 text-sm">Choose your career path</p>
            </div>

            <div className="space-y-3 stagger">
              {careerPaths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all animate-fade-up ${
                    selectedPath === path.id
                      ? 'border-cp-green bg-cp-green/10'
                      : 'border-cp-border bg-white hover:border-cp-green/30'
                  }`}
                >
                  <p className="font-bold">{path.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-cp-text-muted">
                    <span>{path.starting_role}</span>
                    <span className="text-cp-green">&rarr;</span>
                    <span className="text-cp-success font-medium">{path.target_role}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-cp-text-muted">
                    <span className="font-mono font-bold text-cp-success">{formatCurrency(path.target_salary_usd)}</span>
                    <span>{path.estimated_months} months</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3.5 text-sm">Back</button>
              <button onClick={() => setStep(3)} disabled={!selectedPath} className="btn-primary flex-1 py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Let&apos;s start!</h2>
              <p className="text-cp-text-muted mt-1 text-sm">Choose your study pace</p>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-cp-green/10 to-cp-accent/10 border border-cp-green/20 p-4 text-center">
              <p className="text-[10px] text-cp-text-muted uppercase tracking-widest font-bold">Your first certification</p>
              <p className="text-lg font-bold mt-1">🔒 {firstCertName || 'Loading...'}</p>
            </div>

            <div className="space-y-3 stagger">
              {[
                { type: 'sprint_30' as const, label: '30-Day Sprint', desc: '~15 min/day', badge: 'Aggressive', color: 'text-cp-danger' },
                { type: 'sprint_60' as const, label: '60-Day Sprint', desc: '~10 min/day', badge: 'Balanced', color: 'text-cp-green' },
                { type: 'sprint_90' as const, label: '90-Day Sprint', desc: '~5 min/day', badge: 'Casual', color: 'text-cp-success' },
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSprintType(option.type)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all animate-fade-up ${
                    sprintType === option.type
                      ? 'border-cp-green bg-cp-green/10'
                      : 'border-cp-border bg-white hover:border-cp-green/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{option.label}</p>
                      <p className="text-sm text-cp-text-muted">{option.desc}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full bg-cp-bg-secondary font-bold ${option.color}`}>
                      {option.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1 py-3.5 text-sm">Back</button>
              <button onClick={handleComplete} disabled={loading} className="btn-primary flex-1 py-3.5 text-sm disabled:opacity-60">
                {loading ? 'Setting up...' : 'Start Your Sprint'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
