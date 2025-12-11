const { getCompanyFacts, getCompanyConcept } = require('../src/edgar-api.js');

async function findCurrentJNJBreakdown() {
  try {
    console.log('🔍 Searching for current J&J business segment data...');
    console.log('');
    
    // Let's look for more recent revenue concepts that might include segment info
    const revenueSearchTerms = [
      'Revenue',
      'RevenueFromContractWithCustomerExcludingAssessedTax', // We know this one works
      'SalesRevenueNet',
      'Revenues'
    ];
    
    console.log('💡 Strategy: Look for revenue concepts with different breakdowns');
    console.log('');
    
    for (const term of revenueSearchTerms) {
      try {
        console.log(`📊 Analyzing: ${term}`);
        const concept = await getCompanyConcept('0000200406', 'us-gaap', term);
        
        if (concept.units && concept.units.USD) {
          const recentData = concept.units.USD.filter(item => 
            item.end && item.end.includes('2024') || item.end.includes('2025')
          );
          
          console.log(`✅ Found ${recentData.length} recent data points for ${concept.label}`);
          
          // Group by fiscal period to see if there are multiple entries (indicating segments)
          const periods = {};
          recentData.forEach(item => {
            const key = `${item.fy}-${item.fp}`;
            if (!periods[key]) periods[key] = [];
            periods[key].push(item);
          });
          
          console.log('📅 Recent periods with data:');
          Object.entries(periods).forEach(([period, data]) => {
            console.log(`   ${period}: ${data.length} entries`);
            data.forEach(item => {
              const valueB = (item.val / 1000000000).toFixed(2);
              console.log(`     $${valueB}B (${item.end}) [${item.form}]`);
              if (item.start) console.log(`     Period: ${item.start} to ${item.end}`);
            });
          });
          console.log('');
        }
      } catch (err) {
        console.log(`❌ ${term} not found`);
      }
    }
    
    console.log('');
    console.log('🏥 ELECTROPHYSIOLOGY CONTEXT:');
    console.log('Johnson & Johnson MedTech segment typically includes:');
    console.log('• Biosense Webster (Electrophysiology) - ~$1.5-2B annually');
    console.log('• DePuy Synthes (Orthopedics) - ~$7-8B annually'); 
    console.log('• Ethicon (Surgery) - ~$5-6B annually');
    console.log('• Vision (Contact lenses/eye care) - ~$4B annually');
    console.log('');
    console.log('📈 Electrophysiology Market Intel:');
    console.log('• Global EP market: ~$6B (2024)');
    console.log('• J&J/Biosense Webster market share: ~25-30%');
    console.log('• Key competitors: Abbott, Medtronic, Boston Scientific');
    console.log('• Growth rate: ~8-12% annually');
    console.log('');
    console.log('💡 For precise EP revenue:');
    console.log('1. Check 10-Q narrative sections for "Biosense Webster"');
    console.log('2. Look for MedTech sub-segment breakdowns');
    console.log('3. Review earnings call transcripts');
    console.log('4. Check investor presentations for granular data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findCurrentJNJBreakdown();
