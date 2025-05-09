import { User } from '@/payload-types';
import { CollectionBeforeValidateHook } from 'payload';

export const validateRole: CollectionBeforeValidateHook<User> = async ({
  data,
  req: { user },
  operation,
  originalDoc, // originalDoc is available in 'update' operations
}) => {
  // If no authenticated user is performing the operation (e.g. public registration)
  if (!user) {
    if (operation === 'create') {
      // Ensure data object exists for anonymous creation to assign a role
      if (!data) {
        data = {}; // Initialize data if it's undefined
      }
      const newRoles = data.role || ['guest'];
      if (newRoles.length === 1 && newRoles[0] === 'guest') {
        data.role = ['guest']; // Ensure it's set
        return data;
      } else {
        throw new Error('Anonymous users can only be created with the "guest" role.');
      }
    }
    // For updates or other operations, an authenticated user is required.
    throw new Error('You must be logged in to perform this operation.');
  }

  // CASE 1: The acting user is an ADMIN.
  // Admins can set any roles on any user.
  if (user.role?.includes('admin')) {
    return data;
  }

  // CASE 2: The acting user is NOT an ADMIN (i.e., they are 'customer' or 'guest').

  // Rule 2a: Non-admins cannot grant 'admin' role.
  if (data?.role?.includes('admin')) {
    throw new Error('You do not have permission to assign the "admin" role.');
  }

  // Rule 2b: Non-admins cannot grant 'customer' role unless they are already a customer simply maintaining their role.
  const isTryingToSetCustomerRole = data?.role?.includes('customer');

  if (isTryingToSetCustomerRole) {
    if (operation === 'create') {
      // Non-admins cannot create new users as 'customer'.
      throw new Error('You do not have permission to create users with the "customer" role.');
    }
    // For 'update' operations:
    // If the user wasn't a customer before, a non-admin cannot make them one.
    if (operation === 'update' && !originalDoc?.role?.includes('customer')) {
      throw new Error('You do not have permission to grant the "customer" role.');
    }
    // If originalDoc?.role?.includes('customer') is true, then a customer is updating themselves
    // and keeping 'customer' in their roles. This is fine, provided they don't add 'admin'.
  }

  // Rule 2c: Final check on allowed roles for non-admins.
  // Permitted roles in `data.role` depend on the current user's roles.
  const allowedRolesForNonAdmin = new Set<string>();
  if (user.role?.includes('guest')) {
    allowedRolesForNonAdmin.add('guest');
  }
  // If the current user is a customer, they can be 'customer' or 'guest'.
  if (user.role?.includes('customer')) {
    allowedRolesForNonAdmin.add('customer');
    allowedRolesForNonAdmin.add('guest');
  }

  if (data?.role) {
    for (const r of data.role) {
      if (!allowedRolesForNonAdmin.has(r)) {
        let message = `You do not have permission to set the role "${r}".`;
        if (user.role?.includes('guest') && !user.role?.includes('customer') && !user.role?.includes('admin')) {
            message = 'As a guest, you can only assign or maintain the "guest" role.';
        } else if (user.role?.includes('customer') && !user.role?.includes('admin')) {
            message = 'As a customer, you can only assign or maintain "customer" or "guest" roles.';
        }
        throw new Error(message);
      }
    }
  } else {
    // If data.role is not provided (e.g. undefined), it might default to ['guest'] due to field definition.
    // This hook primarily validates if roles *are* being set.
    // If roles aren't in `data`, they aren't being changed by this part of the payload.
  }
  
  // Ensure a guest cannot make themselves a customer, even if 'customer' was in allowedRolesForNonAdmin
  // because the acting user was (for some reason) both guest and customer.
  if (user.role?.includes('guest') && !user.role?.includes('admin') && !user.role?.includes('customer')) {
      if (data?.role?.includes('customer')) {
          throw new Error('Guest users cannot assign the "customer" role to themselves or others.');
      }
  }


  return data;
};
