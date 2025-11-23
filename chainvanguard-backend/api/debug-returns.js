import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/test').then(async () => {
  const Return = mongoose.model('Return', new mongoose.Schema({}, { strict: false }));

  console.log('=== CHECKING RETURNS IN DATABASE ===\n');

  // Get all returns
  const allReturns = await Return.find({}).select('returnNumber vendorId customerId status refundAmount createdAt').lean();
  console.log('Total returns in DB:', allReturns.length);

  if (allReturns.length > 0) {
    console.log('\n=== ALL RETURNS ===');
    allReturns.forEach(r => {
      console.log({
        returnNumber: r.returnNumber,
        vendorId: r.vendorId ? r.vendorId.toString() : null,
        customerId: r.customerId ? r.customerId.toString() : null,
        status: r.status,
        refundAmount: r.refundAmount,
        createdAt: r.createdAt
      });
    });

    // Group by vendorId
    console.log('\n=== RETURNS BY VENDOR ===');
    const byVendor = {};
    allReturns.forEach(r => {
      const vid = r.vendorId ? r.vendorId.toString() : 'null';
      if (!byVendor[vid]) byVendor[vid] = [];
      byVendor[vid].push(r);
    });

    Object.entries(byVendor).forEach(([vendorId, returns]) => {
      console.log('\nVendor ID:', vendorId);
      console.log('  Total:', returns.length);
      console.log('  Statuses:', returns.map(r => r.status).join(', '));
      const refunded = returns.filter(r => r.status === 'refunded');
      console.log('  Refunded:', refunded.length);
      console.log('  Total Refunded Amount:', refunded.reduce((sum, r) => sum + (r.refundAmount || 0), 0));
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
