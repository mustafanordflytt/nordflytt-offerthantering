import { NextRequest, NextResponse } from 'next/server'

// Mock performance data for all employees
const allEmployeesPerformance = [
  {
    id: 'staff-001',
    name: 'Anna Svensson',
    position: 'Flyttpersonal med körkort',
    employment_start_date: '2023-08-10',
    status: 'aktiv',
    provision_per_hour: 160,
    total_jobs_completed: 52,
    total_provision_earned: 8320,
    avg_efficiency: 88,
    avg_customer_rating: 4.8,
    five_star_count: 38,
    poor_ratings_count: 1,
    attendance_rate: 98,
    performance_score: 205.2,
    provision_trend: 'up',
    rating_trend: 'stable'
  },
  {
    id: 'staff-007',
    name: 'Mustafa Abdulkarim',
    position: 'Flyttpersonal utan körkort',
    employment_start_date: '2024-01-15',
    status: 'aktiv',
    provision_per_hour: 145,
    total_jobs_completed: 47,
    total_provision_earned: 6815,
    avg_efficiency: 92,
    avg_customer_rating: 4.7,
    five_star_count: 31,
    poor_ratings_count: 2,
    attendance_rate: 96,
    performance_score: 194.1,
    provision_trend: 'up',
    rating_trend: 'up'
  },
  {
    id: 'staff-002',
    name: 'Erik Johansson',
    position: 'Flyttpersonal med körkort',
    employment_start_date: '2023-11-20',
    status: 'aktiv',
    provision_per_hour: 125,
    total_jobs_completed: 38,
    total_provision_earned: 4750,
    avg_efficiency: 85,
    avg_customer_rating: 4.2,
    five_star_count: 22,
    poor_ratings_count: 3,
    attendance_rate: 92,
    performance_score: 165.8,
    provision_trend: 'stable',
    rating_trend: 'up'
  },
  {
    id: 'staff-003',
    name: 'Maria Andersson',
    position: 'Flyttpersonal utan körkort',
    employment_start_date: '2024-02-01',
    status: 'aktiv',
    provision_per_hour: 110,
    total_jobs_completed: 35,
    total_provision_earned: 3850,
    avg_efficiency: 90,
    avg_customer_rating: 4.1,
    five_star_count: 18,
    poor_ratings_count: 4,
    attendance_rate: 89,
    performance_score: 142.5,
    provision_trend: 'down',
    rating_trend: 'stable'
  },
  {
    id: 'staff-004',
    name: 'Johan Petersson',
    position: 'Flyttpersonal utan körkort',
    employment_start_date: '2024-03-15',
    status: 'aktiv',
    provision_per_hour: 85,
    total_jobs_completed: 28,
    total_provision_earned: 2380,
    avg_efficiency: 78,
    avg_customer_rating: 3.8,
    five_star_count: 12,
    poor_ratings_count: 6,
    attendance_rate: 84,
    performance_score: 98.2,
    provision_trend: 'down',
    rating_trend: 'down'
  },
  {
    id: 'staff-005',
    name: 'Lisa Nilsson',
    position: 'Flyttpersonal utan körkort',
    employment_start_date: '2024-04-10',
    status: 'aktiv',
    provision_per_hour: 75,
    total_jobs_completed: 22,
    total_provision_earned: 1650,
    avg_efficiency: 82,
    avg_customer_rating: 3.6,
    five_star_count: 8,
    poor_ratings_count: 8,
    attendance_rate: 81,
    performance_score: 87.4,
    provision_trend: 'down',
    rating_trend: 'down'
  },
  {
    id: 'staff-006',
    name: 'David Larsson',
    position: 'Flyttpersonal utan körkort',
    employment_start_date: '2024-05-01',
    status: 'aktiv',
    provision_per_hour: 55,
    total_jobs_completed: 18,
    total_provision_earned: 990,
    avg_efficiency: 72,
    avg_customer_rating: 3.2,
    five_star_count: 4,
    poor_ratings_count: 12,
    attendance_rate: 76,
    performance_score: 65.3,
    provision_trend: 'down',
    rating_trend: 'down'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Sort by performance score (highest first)
    const ranking = [...allEmployeesPerformance].sort((a, b) => b.performance_score - a.performance_score)

    // Categorize performance
    const topPerformers = ranking.filter(emp => emp.performance_score >= 180)
    const goodPerformers = ranking.filter(emp => emp.performance_score >= 120 && emp.performance_score < 180)
    const needsTraining = ranking.filter(emp => emp.performance_score >= 80 && emp.performance_score < 120)
    const considerTermination = ranking.filter(emp => emp.performance_score < 80)

    // Calculate team statistics
    const stats = {
      averageScore: ranking.reduce((sum, emp) => sum + emp.performance_score, 0) / ranking.length,
      averageProvisionPerHour: ranking.reduce((sum, emp) => sum + emp.provision_per_hour, 0) / ranking.length,
      averageRating: ranking.reduce((sum, emp) => sum + emp.avg_customer_rating, 0) / ranking.length,
      totalEmployees: ranking.length,
      totalJobsCompleted: ranking.reduce((sum, emp) => sum + emp.total_jobs_completed, 0),
      totalProvisionEarned: ranking.reduce((sum, emp) => sum + emp.total_provision_earned, 0)
    }

    return NextResponse.json({
      ranking,
      categories: {
        topPerformers,
        goodPerformers,
        needsTraining,
        considerTermination
      },
      stats,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Ranking API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance ranking' },
      { status: 500 }
    )
  }
}