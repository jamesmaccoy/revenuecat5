import { adminOrSelf } from '@/access/adminOrSelf'
import { adminOrSelfField } from '@/access/adminOrSelfField'
import { isAdmin } from '@/access/isAdmin'
import { isAdminField } from '@/access/isAdminField'
import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'
import { adminOrSelfOrGuests } from './access/adminOrSelfOrGuests'

export const Booking: CollectionConfig = {
  slug: 'bookings',
  labels: {
    singular: 'Booking',
    plural: 'Bookings',
  },
  typescript: {
    interface: 'Booking',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['customer', 'post', 'fromDate', 'toDate', 'guests'],
  },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false;
      const roles = user.role || [];
      return roles.includes('admin') || roles.includes('customer');
    },
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role?.includes('admin')) return true;
      if (user.role?.includes('customer')) {
        return { customer: { equals: user.id } };
      }
      return false;
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role?.includes('admin')) return true;
      if (user.role?.includes('customer')) {
        return { customer: { equals: user.id } };
      }
      return false;
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role?.includes('admin')) return true;
      if (user.role?.includes('customer')) {
        return { customer: { equals: user.id } };
      }
      return false;
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: {
        role: {
          equals: 'customer',
        },
      },
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'guests',
      type: 'relationship',
      hasMany: true,
      relationTo: 'users',
      access: {
        update: adminOrSelfField('customer'),
      },
      admin: {
        isSortable: true,
      },
    },
    ...slugField('title', {
      checkboxOverrides: {
        access: {
          update: isAdminField,
        },
      },
      slugOverrides: {
        access: {
          update: isAdminField,
        },
      },
    }),
    {
      name: 'post',
      relationTo: 'posts',
      type: 'relationship',
      required: true,
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Unpaid',
          value: 'unpaid',
        },
      ],
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'fromDate',
      type: 'date',
      required: true,
      index: true,
      label: 'Check-in Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'toDate',
      type: 'date',
      required: true,
      label: 'Check-out Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      access: {
        update: isAdminField,
      },
    },
  ],
}
