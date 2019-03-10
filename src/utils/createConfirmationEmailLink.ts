import * as uuidv4 from "uuid/v4";
import { Redis } from "ioredis";

export const createConfirmationEmailLink = (
  url: string,
  userId: string,
  redis: Redis
) => {
  const id = uuidv4();

  redis.set(id, userId, "ex", 60 * 60 * 24);

  return `${url}/confirm/${id}`;
};
