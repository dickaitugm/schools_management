const pool = require('../lib/db');

async function updateCashFlowForEvidence() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating cash flow table for evidence support...');

    // Update cash_flow table to make attachment_url more suitable for evidence
    await client.query(`
      ALTER TABLE cash_flow 
      ALTER COLUMN attachment_url TYPE TEXT;
    `);

    // Add evidence metadata column if not exists
    await client.query(`
      ALTER TABLE cash_flow 
      ADD COLUMN IF NOT EXISTS evidence_filename VARCHAR(255),
      ADD COLUMN IF NOT EXISTS evidence_size INTEGER,
      ADD COLUMN IF NOT EXISTS evidence_type VARCHAR(100);
    `);

    // Create uploads directory structure info
    console.log('📁 Evidence upload structure:');
    console.log('   - Upload path: /public/uploads/cash-flow/');
    console.log('   - Supported types: JPG, PNG, PDF');
    console.log('   - Max file size: 5MB');
    console.log('   - Required for all transactions');

    console.log('✅ Cash flow evidence support updated successfully!');

  } catch (error) {
    console.error('❌ Error updating cash flow for evidence:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the update
if (require.main === module) {
  updateCashFlowForEvidence()
    .then(() => {
      console.log('🎉 Evidence support update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}

module.exports = updateCashFlowForEvidence;
