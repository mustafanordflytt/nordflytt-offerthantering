"use client"

import { useState } from "react"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

moment.locale("sv")
const localizer = momentLocalizer(moment)

interface Event {
  id: string
  title: string
  start: Date
  end: Date
  resourceId: string
}

interface Resource {
  id: string
  title: string
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Flytthjälp - John Doe",
    start: new Date(2023, 4, 1, 9, 0),
    end: new Date(2023, 4, 1, 13, 0),
    resourceId: "team1",
  },
  {
    id: "2",
    title: "Flyttstädning - Jane Smith",
    start: new Date(2023, 4, 2, 10, 0),
    end: new Date(2023, 4, 2, 14, 0),
    resourceId: "team2",
  },
]

const resources: Resource[] = [
  { id: "team1", title: "Team 1" },
  { id: "team2", title: "Team 2" },
  { id: "team3", title: "Team 3" },
]

export function Schedule() {
  const [view, setView] = useState("week")
  const [events, setEvents] = useState<Event[]>(mockEvents)

  const handleEventDrop = ({ event, start, end, resourceId }: any) => {
    const updatedEvents = events.map((e) => (e.id === event.id ? { ...e, start, end, resourceId } : e))
    setEvents(updatedEvents)
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Schemaläggning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={view} onValueChange={(value) => setView(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Välj vy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Vecka</SelectItem>
              <SelectItem value="month">Månad</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ height: "500px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view as any}
            onView={(newView) => setView(newView)}
            resources={resources}
            resourceIdAccessor="id"
            resourceTitleAccessor="title"
            onEventDrop={handleEventDrop}
            resizable
            selectable
            popup
          />
        </div>
      </CardContent>
    </Card>
  )
}
