import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types';

import { adminOrCreateRoleCustomer } from './access/adminOrCreateRoleCustomer'
import { isAdmin } from '@/access/isAdmin'
import { adminOrSelf } from '@/access/adminOrSelf'
import { validateRole } from './hooks/validateRole'
import { adminSelfOrAdded } from './access/adminSelfOrAdded'
import { fillAddedByField } from './hooks/fillAddedByField'
import { adminSelfOrGuest } from './access/adminSelfOrGuest'

export const Users: CollectionConfig = {
  slug: 'users',
  typescript: {
    interface: 'User',
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: adminOrCreateRoleCustomer,
    delete: isAdmin,
    unlock: isAdmin,
    read: adminSelfOrGuest,
    update: adminOrSelf('id'),
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },

  hooks: {
    beforeValidate: [fillAddedByField, validateRole],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      // Revert to static options to prevent frontend runtime error
      // This means the Admin UI will show all options to all users,
      // but the validateRole hook will enforce actual permissions.
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Customer', value: 'customer' },
        { label: 'Guest', value: 'guest' },
      ],
      // Removed the dynamic function and 'as any' to ensure options is an array
      hasMany: true,
      defaultValue: ['guest'],
    },
    {
      name: 'addedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
}
