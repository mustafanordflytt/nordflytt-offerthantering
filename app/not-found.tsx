import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <div className="mt-4">
            <Search className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Sidan kunde inte hittas
        </h2>
        
        <p className="text-gray-600 mb-8">
          Vi beklagar, men sidan du letar efter verkar inte existera. 
          Den kan ha flyttats eller tagits bort.
        </p>
        
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Tillbaka till startsidan
            </Button>
          </Link>
          
          <Link href="/form" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Få offert
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Gå tillbaka
          </Button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Behöver du hjälp?</p>
          <p className="mt-2">
            Ring oss på{' '}
            <a href="tel:010-555-12-89" className="text-blue-600 hover:underline">
              010-555 12 89
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}