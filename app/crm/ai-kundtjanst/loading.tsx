import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AIKundtjanstLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat interface skeleton */}
      <Card className="h-[600px]">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)]">
          <div className="flex h-full gap-4">
            {/* Conversations list */}
            <div className="w-1/3 border-r pr-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 border rounded">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
            
            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                    <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-3/4'} rounded-lg`} />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}