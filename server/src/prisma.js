BigInt.prototype.toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
export { prisma };
