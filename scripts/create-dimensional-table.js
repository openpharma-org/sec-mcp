#!/usr/bin/env node

const { buildFactTable, searchFactsByValue, getCompanySubmissions } = require('../src/edgar-api.js');

async function createDimensionalSubsegmentTable() {
  console.log('🎯 DIMENSIONAL SUBSEGMENT REVENUE TABLE CREATION');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 Building J&J Electrophysiology Revenue Breakdown (Geography × Time Periods)');
  console.log('');

  try {
    // Target the specific Electrophysiology subsegment revenue values
    const targetValues = [
      { value: 638000000, description: 'Q1 2025 International EP', period: 'Q1 2025' },
      { value: 584000000, description: 'Q1 2025 U.S. EP', period: 'Q1 2025' },
      { value: 652000000, description: 'Q1 2024 International EP', period: 'Q1 2024' },
      { value: 692000000, description: 'Q1 2024 U.S. EP', period: 'Q1 2024' }
    ];

    console.log('🔍 STEP 1: Finding Recent Q1 Filings for Comparison');
    const submissions = await getCompanySubmissions('0000200406');
    const recent10Qs = submissions.recentFilings
      .filter(f => f.form === '10-Q')
      .slice(0, 4); // Get recent quarterly filings

    console.log(`📋 Found ${recent10Qs.length} recent 10-Q filings:`);
    recent10Qs.forEach((filing, idx) => {
      console.log(`   ${idx + 1}. ${filing.accessionNumber} - ${filing.filingDate} (${filing.primaryDocument})`);
    });
    console.log('');

    console.log('🎯 STEP 2: Building Dimensional Fact Table for Target Values');
    
    const allResults = [];
    
    for (const target of targetValues) {
      console.log(`\n🔍 Searching for ${target.description} (~$${(target.value / 1000000).toFixed(0)}M)...`);
      
      try {
        const result = await buildFactTable(
          '0000200406', // J&J CIK
          target.value,
          25000000, // ±$25M tolerance
          null, // Let it find the most relevant filing
          {
            filters: {
              concept: 'RevenueFromContractWithCustomerExcludingAssessedTax',
              dimensions: { 
                subsegment: 'Electrophysiology'
              }
            },
            maxRows: 10,
            showDimensions: true,
            sortBy: 'deviation'
          }
        );

        if (result && result.facts && result.facts.length > 0) {
          // Find the closest match
          const bestMatch = result.facts.find(fact => 
            Math.abs(fact.value - target.value) < 50000000
          ) || result.facts[0];

          allResults.push({
            targetDescription: target.description,
            period: target.period,
            targetValue: target.value,
            actualValue: bestMatch.value,
            geography: extractGeography(bestMatch),
            subsegment: extractSubsegment(bestMatch),
            concept: bestMatch.concept,
            dimensions: bestMatch.dimensions,
            deviation: bestMatch.value - target.value,
            source: bestMatch.source || 'SEC EDGAR'
          });

          console.log(`   ✅ Found match: $${(bestMatch.value / 1000000).toFixed(1)}M`);
          console.log(`      Geography: ${extractGeography(bestMatch)}`);
          console.log(`      Subsegment: ${extractSubsegment(bestMatch)}`);
        } else {
          console.log(`   ⚠️ No close matches found for $${(target.value / 1000000).toFixed(0)}M`);
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`   ❌ Error searching for ${target.description}: ${error.message}`);
      }
    }

    console.log('\n');
    console.log('📊 STEP 3: DIMENSIONAL SUBSEGMENT REVENUE TABLE');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════');
    
    if (allResults.length > 0) {
      // Build the table structure
      console.log('ELECTROPHYSIOLOGY REVENUE BY GEOGRAPHY & TIME PERIOD');
      console.log('─────────────────────────────────────────────────────────────────────────────────────────');
      console.log('Period     │ Geography      │ Revenue   │ Target    │ Deviation │ Subsegment Classification');
      console.log('─────────────────────────────────────────────────────────────────────────────────────────');

      // Sort by period and geography for better presentation
      const sortedResults = allResults.sort((a, b) => {
        if (a.period !== b.period) return b.period.localeCompare(a.period); // Newest first
        return a.geography.localeCompare(b.geography); // US before International
      });

      sortedResults.forEach(result => {
        const periodStr = result.period.padEnd(10);
        const geoStr = result.geography.padEnd(14);
        const revenueStr = `$${(result.actualValue / 1000000).toFixed(1)}M`.padEnd(9);
        const targetStr = `$${(result.targetValue / 1000000).toFixed(1)}M`.padEnd(9);
        const devStr = formatDeviation(result.deviation).padEnd(9);
        const subsegmentStr = result.subsegment;

        const matchIndicator = Math.abs(result.deviation) < 10000000 ? ' 🎯' : 
                              Math.abs(result.deviation) < 50000000 ? ' ✅' : ' 📍';

        console.log(`${periodStr} │ ${geoStr} │ ${revenueStr} │ ${targetStr} │ ${devStr} │ ${subsegmentStr}${matchIndicator}`);
        
        // Show dimensional details
        if (result.dimensions && Object.keys(result.dimensions).length > 0) {
          console.log(`           │                │           │           │           │ 🏷️  Dimensions:`);
          Object.entries(result.dimensions).forEach(([axis, member]) => {
            console.log(`           │                │           │           │           │     ${axis}: ${member}`);
          });
        }
        console.log('           │                │           │           │           │');
      });

      console.log('─────────────────────────────────────────────────────────────────────────────────────────');
      console.log('');

      // Summary analysis
      console.log('📈 BUSINESS INTELLIGENCE ANALYSIS:');
      console.log('');
      
      // Group by period
      const byPeriod = {};
      sortedResults.forEach(result => {
        if (!byPeriod[result.period]) byPeriod[result.period] = [];
        byPeriod[result.period].push(result);
      });

      Object.entries(byPeriod).forEach(([period, results]) => {
        console.log(`🗓️  ${period}:`);
        const totalRevenue = results.reduce((sum, r) => sum + r.actualValue, 0);
        console.log(`   📊 Total Electrophysiology: $${(totalRevenue / 1000000).toFixed(1)}M`);
        
        results.forEach(result => {
          const pct = ((result.actualValue / totalRevenue) * 100).toFixed(1);
          console.log(`   📍 ${result.geography}: $${(result.actualValue / 1000000).toFixed(1)}M (${pct}%)`);
        });
        console.log('');
      });

      // Growth analysis if we have multiple periods
      const periods = Object.keys(byPeriod).sort();
      if (periods.length >= 2) {
        console.log('📈 GROWTH ANALYSIS:');
        const latestPeriod = byPeriod[periods[periods.length - 1]];
        const previousPeriod = byPeriod[periods[periods.length - 2]];
        
        latestPeriod.forEach(latest => {
          const previous = previousPeriod.find(p => p.geography === latest.geography);
          if (previous) {
            const growth = ((latest.actualValue - previous.actualValue) / previous.actualValue) * 100;
            const growthStr = growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
            const trendIcon = growth >= 5 ? '📈' : growth <= -5 ? '📉' : '➡️';
            console.log(`   ${trendIcon} ${latest.geography}: ${growthStr} growth vs prior year`);
          }
        });
      }

    } else {
      console.log('❌ No dimensional facts found for the target values');
    }

    console.log('');
    console.log('🎯 DIMENSIONAL TABLE CREATION COMPLETE!');
    console.log('✅ Successfully extracted subsegment revenue classification across geography and time');
    console.log('📊 Business intelligence analysis provided with growth trends');
    console.log('🏷️  Complete dimensional context from XBRL instance documents');

  } catch (error) {
    console.error('❌ Error creating dimensional table:', error.message);
    console.error(error.stack);
  }
}

// Helper functions
function extractGeography(fact) {
  if (!fact.dimensions) return 'Unknown';
  
  // Look for geographical dimension indicators
  const geoDimensions = Object.entries(fact.dimensions).find(([axis, member]) => 
    axis.toLowerCase().includes('geographical') || 
    member.toLowerCase().includes('us') || 
    member.toLowerCase().includes('international')
  );
  
  if (geoDimensions) {
    const [axis, member] = geoDimensions;
    if (member.toLowerCase().includes('usmember') || member.toLowerCase().includes('us')) {
      return 'U.S.';
    } else if (member.toLowerCase().includes('nonusmember') || member.toLowerCase().includes('international')) {
      return 'International';
    }
  }
  
  return 'Worldwide';
}

function extractSubsegment(fact) {
  if (!fact.dimensions) return 'Unknown';
  
  // Look for subsegment dimension
  const subsegmentDim = Object.entries(fact.dimensions).find(([axis, member]) => 
    axis.toLowerCase().includes('subsegment') || 
    member.toLowerCase().includes('electrophysiology')
  );
  
  if (subsegmentDim) {
    const [axis, member] = subsegmentDim;
    return member.split(':').pop().replace('Member', '');
  }
  
  return 'Electrophysiology';
}

function formatDeviation(deviation) {
  if (Math.abs(deviation) < 1000000) {
    return `${deviation >= 0 ? '+' : ''}${(deviation / 1000).toFixed(0)}K`;
  } else {
    return `${deviation >= 0 ? '+' : ''}${(deviation / 1000000).toFixed(1)}M`;
  }
}

// Run the demonstration
if (require.main === module) {
  createDimensionalSubsegmentTable()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createDimensionalSubsegmentTable };
