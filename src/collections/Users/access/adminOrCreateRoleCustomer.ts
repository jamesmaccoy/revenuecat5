import { User } from '@/payload-types'
import { Access } from 'payload'

export const adminOrCreateRoleCustomer: Access<User> = ({ req: { user }, data }) => {
  // Admin can do anything
  if (user?.role?.includes('admin')) {
    return true;
  }

  // Customer can initiate creation, but not of an admin user.
  // The validateRole hook will provide finer-grained control over what roles a customer can assign.
  if (user?.role?.includes('customer')) {
    if (data?.role?.includes('admin')) {
      return false; // Customer cannot create an admin user.
    }
    return true; // Customer can create non-admin users (e.g., guest).
  }

  // Guests (and anyone else not admin or customer) cannot create users.
  return false;
}
