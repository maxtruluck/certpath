import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900 tracking-tight">open</span>
            <span className="text-xl font-bold text-blue-500 tracking-tight">ED</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-medium mb-6">
          Spaced repetition learning platform
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5 animate-fade-up">
          The Learning Engine That Makes
          <br />
          <span className="text-blue-500">Education Stick</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '80ms' }}>
          Master any subject with scientifically-backed spaced repetition.
          From certifications to academic courses, learn smarter not harder.
        </p>
        <div className="flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Get started for free
          </Link>
          <Link href="/browse" className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-colors">
            Browse courses
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Spaced Repetition',
              desc: 'Our SM-2 algorithm schedules reviews at the optimal time so you retain what you learn long-term.',
              icon: (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              title: 'Guided Paths',
              desc: 'Follow structured learning paths with modules and topics. Know exactly what to study next.',
              icon: (
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              ),
            },
            {
              title: 'Readiness Tracking',
              desc: 'See your readiness score for every topic, module, and course. Know when you are ready.',
              icon: (
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              ),
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-gray-50 border border-gray-100 p-6 space-y-3 animate-fade-up">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Courses for every learner</h2>
        <p className="text-gray-500 text-center mb-8">From IT certifications to academic subjects</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Certification', 'Academic', 'Professional', 'General Knowledge'].map((cat) => (
            <Link
              key={cat}
              href={`/browse?category=${cat.toLowerCase()}`}
              className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 pb-20">
        <div className="rounded-2xl bg-blue-500 p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Start learning today</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Join learners mastering new skills with spaced repetition.
          </p>
          <Link href="/signup" className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center">
            <span className="font-bold text-gray-600">open</span>
            <span className="font-bold text-blue-500">ED</span>
            <span className="ml-2">&copy; {new Date().getFullYear()}</span>
          </div>
          <p>Learning that sticks</p>
        </div>
      </footer>
    </div>
  );
}
