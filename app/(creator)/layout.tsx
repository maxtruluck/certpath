import CreatorSidebar from './components/CreatorSidebar'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-[960px] bg-[#FAFAF8]">
      <CreatorSidebar />
      <main className="flex-1 ml-[240px]">
        <div className="max-w-6xl mx-auto px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
