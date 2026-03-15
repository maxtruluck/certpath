import CreatorSidebar from './components/CreatorSidebar'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CreatorSidebar />
      <main className="flex-1 ml-[220px]">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
