import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ErrorBoundary>
  )
}