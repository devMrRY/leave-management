import dotenv from 'dotenv';

const envFile =
  process.env.DOCKER_ENV === 'true'
    ? '.env'
    : '.env.local';

dotenv.config({ path: envFile });