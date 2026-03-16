import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-baseline gap-0.5">
            <span className="text-xl font-semibold text-[#2C2825] tracking-tight">open</span>
            <span className="text-xl font-extrabold text-[#2C2825] tracking-tight">ED</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] transition-colors">Log in</Link>
            <Link href="/signup" className="bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-24 pb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C2825] leading-tight tracking-tight mb-5 animate-fade-up">
          Learn anything.<br />
          Teach anything.<br />
          <span className="text-[#A39B90]">Remember everything.</span>
        </h1>
        <p className="text-lg text-[#6B635A] max-w-xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '80ms' }}>
          An open learning platform powered by spaced repetition.<br />
          Study, create, or share courses on any subject.
        </p>
        <div className="flex items-center justify-center gap-3 mb-10 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <Link href="/signup" className="bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] font-semibold px-6 py-3 rounded-xl transition-colors">Start Learning Free</Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-up" style={{ animationDelay: '240ms' }}>
          {['Certifications', 'Languages', 'Software', 'Compliance', 'Academics', 'Vocabulary', 'Skills'].map(tag => (
            <span key={tag} className="text-[13px] font-medium text-[#A39B90] bg-[#F5F3EF] border border-[#E8E4DD] px-3.5 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 pt-10 pb-20">
        <div className="rounded-2xl bg-[#2C2825] p-10 text-center">
          <h2 className="text-2xl font-extrabold text-[#F5F3EF] tracking-tight mb-2">Learn it. Teach it. Own it.</h2>
          <p className="text-[#A39B90] mb-6 max-w-md mx-auto text-sm">Create courses for free. Learn courses for free. Built on science.</p>
          <Link href="/signup" className="inline-block bg-white text-[#2C2825] font-semibold px-6 py-3 rounded-xl hover:bg-[#F5F3EF] transition-colors">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DD] py-6 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[#A39B90]">
          <div className="flex items-baseline gap-0.5">
            <span className="font-semibold text-[#2C2825]">open</span>
            <span className="font-extrabold text-[#2C2825]">ED</span>
            <span className="ml-2">&copy; {new Date().getFullYear()}</span>
          </div>
          <p>Learning that sticks</p>
        </div>
      </footer>
    </div>
  );
}
