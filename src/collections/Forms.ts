import type { CollectionConfig } from 'payload'

const CalendarForms: CollectionConfig = {
  slug: 'calendar-forms',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'calendarUrl',
      type: 'text',
      label: 'Calendar URL (.ics)',
      admin: {
        description: 'Enter your Google Calendar .ics URL to display your availability',
      },
      validate: (value) => {
        if (value && !value.startsWith('https://calendar.google.com/calendar/ical/')) {
          return 'Please enter a valid Google Calendar .ics URL';
        }
        return true;
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
  ],
};

export default CalendarForms;