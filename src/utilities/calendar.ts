import ICAL from 'ical.js';

export interface CalendarEvent {
  start: Date;
  end: Date;
}

export async function fetchCalendarEvents(url: string): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(url);
    const icsData = await response.text();
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const events: CalendarEvent[] = vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
      };
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export function isDateInEvents(date: Date, events: CalendarEvent[]): boolean {
  return events.some(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return date >= eventStart && date <= eventEnd;
  });
} 