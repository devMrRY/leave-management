import { logger } from '@myorg/shared';

export const handleUserCreated = async (event: any) => {
  const { employeeId, email, role, name } = event;

  logger.info({ employeeId, email, role, name }, 'New user is created');
};