import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, LineChart } from "@/components/charts"
import { getAnalyticsData } from "@/lib/api"

export default async function DashboardPage() {
  const analyticsData = await getAnalyticsData()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Offerter och bokningar</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={analyticsData.offerBookingData} title="Offerter och bokningar" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kundnöjdhet över tid</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={analyticsData.customerSatisfactionData} title="Kundnöjdhet över tid" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Populära tjänster</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={analyticsData.popularServicesData} title="Populära tjänster" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intäkter per månad</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={analyticsData.revenueData} title="Intäkter per månad" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
