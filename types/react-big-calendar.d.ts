declare module 'react-big-calendar' {
  import { ComponentType } from 'react'
  
  export interface CalendarProps {
    localizer: any
    events: any[]
    startAccessor?: string
    endAccessor?: string
    views?: any[]
    onView?: (view: any) => void
    onNavigate?: (date: Date) => void
    style?: React.CSSProperties
    [key: string]: any
  }
  
  export const Calendar: ComponentType<CalendarProps>
  export function momentLocalizer(moment: any): any
}