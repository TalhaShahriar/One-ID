import { prisma } from '../prisma.js';

async function main() {
  console.log('⚡ Running raw PostgreSQL ledger guard trigger migration...');
  try {
    // Drop existing triggers if they exist to prevent duplication errors
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS block_ledger_update ON "LedgerRecord";
    `);
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS block_ledger_delete ON "LedgerRecord";
    `);

    // Create or replace function
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION prevent_ledger_mutation() RETURNS TRIGGER AS $$
      BEGIN 
        RAISE EXCEPTION 'LedgerRecord is append-only. UPDATE/DELETE forbidden.'; 
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach update trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER block_ledger_update 
      BEFORE UPDATE ON "LedgerRecord" 
      FOR EACH ROW 
      EXECUTE FUNCTION prevent_ledger_mutation();
    `);

    // Attach delete trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER block_ledger_delete 
      BEFORE DELETE ON "LedgerRecord" 
      FOR EACH ROW 
      EXECUTE FUNCTION prevent_ledger_mutation();
    `);

    console.log('✅ Ledger append-only trigger installed perfectly.');
  } catch (error) {
    console.error('❌ Failed to run raw trigger migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
