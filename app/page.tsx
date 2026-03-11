import Link from 'next/link';
import { CertPathCard } from '@/components/home/CertPathCard';

// Static certification data for the homepage (no auth required)
const certifications = [
  {
    slug: 'comptia-security-plus-sy0-701',
    name: 'CompTIA Security+ SY0-701',
    shortName: 'Security+',
    icon: '🔒',
    color: 'cp-green',
    totalQuestions: 500,
    progress: 0,
    domains: [
      { name: 'General Security Concepts', weight: 12, completed: false, active: true },
      { name: 'Threats, Vulnerabilities & Mitigations', weight: 22, completed: false, active: false },
      { name: 'Security Architecture', weight: 18, completed: false, active: false },
      { name: 'Security Operations', weight: 28, completed: false, active: false },
      { name: 'Security Program Management', weight: 20, completed: false, active: false },
    ],
  },
  {
    slug: 'comptia-network-plus-n10-009',
    name: 'CompTIA Network+ N10-009',
    shortName: 'Network+',
    icon: '🌐',
    color: 'cp-blue',
    totalQuestions: 450,
    progress: 0,
    domains: [
      { name: 'Networking Fundamentals', weight: 24, completed: false, active: true },
      { name: 'Network Implementation', weight: 19, completed: false, active: false },
      { name: 'Network Operations', weight: 16, completed: false, active: false },
      { name: 'Network Security', weight: 19, completed: false, active: false },
      { name: 'Network Troubleshooting', weight: 22, completed: false, active: false },
    ],
  },
  {
    slug: 'comptia-a-plus-core-1',
    name: 'CompTIA A+ Core 1 (220-1101)',
    shortName: 'A+ Core 1',
    icon: '🖥️',
    color: 'cp-accent',
    totalQuestions: 400,
    progress: 0,
    domains: [
      { name: 'Mobile Devices', weight: 15, completed: false, active: true },
      { name: 'Networking', weight: 20, completed: false, active: false },
      { name: 'Hardware', weight: 25, completed: false, active: false },
      { name: 'Virtualization & Cloud', weight: 11, completed: false, active: false },
      { name: 'Troubleshooting', weight: 29, completed: false, active: false },
    ],
  },
  {
    slug: 'aws-cloud-practitioner',
    name: 'AWS Certified Cloud Practitioner',
    shortName: 'AWS CCP',
    icon: '☁️',
    color: 'cp-orange',
    totalQuestions: 350,
    progress: 0,
    domains: [
      { name: 'Cloud Concepts', weight: 24, completed: false, active: true },
      { name: 'Security & Compliance', weight: 30, completed: false, active: false },
      { name: 'Cloud Technology & Services', weight: 34, completed: false, active: false },
      { name: 'Billing, Pricing & Support', weight: 12, completed: false, active: false },
    ],
  },
  {
    slug: 'cisco-ccna',
    name: 'Cisco CCNA (200-301)',
    shortName: 'CCNA',
    icon: '🔌',
    color: 'cp-purple',
    totalQuestions: 400,
    progress: 0,
    domains: [
      { name: 'Network Fundamentals', weight: 20, completed: false, active: true },
      { name: 'Network Access', weight: 20, completed: false, active: false },
      { name: 'IP Connectivity', weight: 25, completed: false, active: false },
      { name: 'IP Services', weight: 10, completed: false, active: false },
      { name: 'Security Fundamentals', weight: 15, completed: false, active: false },
      { name: 'Automation & Programmability', weight: 10, completed: false, active: false },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cp-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b-2 border-cp-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
          <span className="text-xl font-black gradient-text tracking-tight">CertPath</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-cp-text-muted hover:text-cp-text transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="btn-primary px-5 py-2 text-xs">
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-8">
        <div className="text-center space-y-4">
          <div className="animate-bounce-in inline-flex items-center gap-2 px-4 py-1.5 bg-cp-green/10 border-2 border-cp-green/20 rounded-full text-cp-green font-bold text-xs">
            <span className="animate-flame inline-block">🔥</span> Spaced repetition + career growth
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight animate-fade-up">
            Pick a cert.
            <br />
            <span className="gradient-text">Follow the path.</span>
          </h1>
          <p className="text-base md:text-lg text-cp-text-secondary max-w-xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '100ms' }}>
            Each certification is a learning path with domains to master.
            Track your progress visually as you prep for exam day.
          </p>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="max-w-6xl mx-auto px-5 pb-8">
        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="rounded-xl bg-white border-2 border-cp-border p-3 text-center">
            <p className="text-xl font-black font-mono text-cp-green">5</p>
            <p className="text-[10px] text-cp-text-muted font-bold uppercase tracking-wider">Cert Paths</p>
          </div>
          <div className="rounded-xl bg-white border-2 border-cp-border p-3 text-center">
            <p className="text-xl font-black font-mono text-cp-accent">2,100+</p>
            <p className="text-[10px] text-cp-text-muted font-bold uppercase tracking-wider">Questions</p>
          </div>
          <div className="rounded-xl bg-white border-2 border-cp-border p-3 text-center">
            <p className="text-xl font-black font-mono text-cp-warning">$73K</p>
            <p className="text-[10px] text-cp-text-muted font-bold uppercase tracking-wider">Avg Salary Boost</p>
          </div>
        </div>
      </section>

      {/* Certification Paths */}
      <section className="max-w-6xl mx-auto px-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold">Certification Paths</h2>
          <span className="text-xs text-cp-text-muted font-bold uppercase tracking-wider">Choose your path</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert, i) => (
            <CertPathCard
              key={cert.slug}
              slug={cert.slug}
              name={cert.name}
              shortName={cert.shortName}
              icon={cert.icon}
              domains={cert.domains}
              progress={cert.progress}
              totalQuestions={cert.totalQuestions}
              color={cert.color}
              delay={i * 80}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-5 pb-12">
        <h2 className="text-lg font-extrabold mb-5">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4 stagger">
          {[
            {
              step: '1',
              emoji: '🎯',
              bg: 'bg-cp-green/10',
              title: 'Choose a Certification',
              desc: 'Pick from popular IT certs. Each one maps out the exam domains you need to master.',
            },
            {
              step: '2',
              emoji: '🧠',
              bg: 'bg-cp-accent/10',
              title: 'Follow the Path',
              desc: 'Work through domains in order. Our SM-2 algorithm schedules reviews at the perfect time.',
            },
            {
              step: '3',
              emoji: '🏆',
              bg: 'bg-cp-warning/10',
              title: 'Pass with Confidence',
              desc: 'Your readiness score tells you when you\'re ready. Earn XP and achievements along the way.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="animate-fade-up rounded-2xl bg-white border-2 border-cp-border border-b-4 p-5 space-y-3 hover:border-cp-green/30 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center text-xl`}>
                  {item.emoji}
                </div>
                <span className="text-xs font-mono font-extrabold text-cp-text-muted uppercase tracking-widest">Step {item.step}</span>
              </div>
              <h3 className="font-extrabold text-sm">{item.title}</h3>
              <p className="text-cp-text-muted text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-cp-green to-cp-accent p-8 text-center text-white space-y-4 animate-fade-up">
          <h2 className="text-2xl font-black">Ready to start your path?</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto">
            Join thousands of IT professionals leveling up their careers with science-backed study methods.
          </p>
          <Link href="/signup" className="inline-block bg-white text-cp-green font-extrabold uppercase tracking-wider text-sm px-8 py-3.5 rounded-xl border-b-4 border-black/10 hover:brightness-95 transition-all active:border-b-2 active:translate-y-0.5">
            Start Learning Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-cp-border py-6 px-5 bg-cp-bg-secondary">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-cp-text-muted">
          <p className="font-bold">CertPath &copy; {new Date().getFullYear()}</p>
          <p>Built for career growth</p>
        </div>
      </footer>
    </div>
  );
}
