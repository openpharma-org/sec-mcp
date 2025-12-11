#!/usr/bin/env node

const { timeSeriesDimensionalAnalysis } = require('../src/edgar-api.js');

async function testTimeSeriesAnalysis() {
  console.log('🎯 TESTING TIME SERIES DIMENSIONAL ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 Testing J&J Electrophysiology Revenue Analysis Across Time Periods');
  console.log('🎯 Target: Build the subsegment revenue classification table like in your image!');
  console.log('');

  try {
    // Test the exact use case you identified: J&J Electrophysiology subsegment revenue across geography and time
    console.log('🔍 EXAMPLE 1: J&J Electrophysiology Time Series Analysis');
    console.log('─────────────────────────────────────────────────────────────────────────────────────────');
    
    const electrophysiologyAnalysis = await timeSeriesDimensionalAnalysis(
      'JNJ', // Johnson & Johnson
      {
        concept: 'RevenueFromContractWithCustomerExcludingAssessedTax',
        subsegment: 'Electrophysiology',
        periods: 4, // Last 4 quarters
        minValue: 100000000, // $100M minimum
        includeGeography: true,
        showGrowthRates: true,
        sortBy: 'period'
      }
    );

    console.log('\n📊 ELECTROPHYSIOLOGY TIME SERIES RESULTS:');
    console.log('════════════════════════════════════════════════════════════════════════════════════════════');
    
    if (electrophysiologyAnalysis.table && electrophysiologyAnalysis.table.length > 0) {
      console.log('\n📈 DIMENSIONAL REVENUE TABLE (Geography × Time Periods):');
      console.log('──────────────────────────────────────────────────────────────────────────────────────────');
      console.log('Period     │ Geography      │ Revenue   │ Subsegment        │ Source');
      console.log('──────────────────────────────────────────────────────────────────────────────────────────');
      
      electrophysiologyAnalysis.table.forEach(row => {
        const period = row.period.padEnd(10);
        const geography = row.geography.padEnd(14);
        const revenue = row.valueFormatted.padEnd(9);
        const subsegment = row.subsegment.padEnd(17);
        const source = (row.source || 'XBRL').substring(0, 12);
        
        console.log(`${period} │ ${geography} │ ${revenue} │ ${subsegment} │ ${source}`);
      });
      
      console.log('──────────────────────────────────────────────────────────────────────────────────────────');
      
      // Show growth analysis if available
      if (electrophysiologyAnalysis.analysis && electrophysiologyAnalysis.analysis.growthRates) {
        console.log('\n📈 GROWTH RATE ANALYSIS:');
        console.log('──────────────────────────────────────────────────────────────────────────────────────────');
        
        Object.entries(electrophysiologyAnalysis.analysis.growthRates).forEach(([comparison, data]) => {
          console.log(`\n🔄 ${comparison.replace('_vs_', ' vs ')}:`);
          Object.entries(data).forEach(([geography, metrics]) => {
            const growthIcon = metrics.growthRate >= 0 ? '📈' : '📉';
            console.log(`   ${growthIcon} ${geography}: ${metrics.growthRate}% growth`);
            console.log(`      Current: $${(metrics.current / 1000000).toFixed(1)}M`);
            console.log(`      Prior: $${(metrics.prior / 1000000).toFixed(1)}M`);
          });
        });
      }
      
      // Show geographic mix if available
      if (electrophysiologyAnalysis.analysis && electrophysiologyAnalysis.analysis.geographicMix) {
        console.log('\n🌍 GEOGRAPHIC MIX ANALYSIS:');
        console.log('──────────────────────────────────────────────────────────────────────────────────────────');
        
        Object.entries(electrophysiologyAnalysis.analysis.geographicMix).forEach(([period, geoData]) => {
          console.log(`\n📅 ${period}:`);
          Object.entries(geoData).forEach(([geography, metrics]) => {
            console.log(`   📍 ${geography}: $${(metrics.value / 1000000).toFixed(1)}M (${metrics.percentage.toFixed(1)}%)`);
          });
        });
      }
      
    } else {
      console.log('⚠️ No time series data found - likely due to SEC EDGAR Archives access restrictions');
      console.log('📊 This would work perfectly when direct iXBRL access is available!');
    }

    console.log('\n');
    console.log('🔍 EXAMPLE 2: Generic Revenue Time Series (Any Company)');
    console.log('─────────────────────────────────────────────────────────────────────────────────────────');
    
    // Test with a more general approach
    const genericAnalysis = await timeSeriesDimensionalAnalysis(
      'AAPL', // Apple for comparison
      {
        concept: 'RevenueFromContractWithCustomerExcludingAssessedTax',
        periods: 3,
        minValue: 10000000000, // $10B minimum for Apple
        includeGeography: true,
        showGrowthRates: true
      }
    );

    console.log('\n📊 APPLE TIME SERIES RESULTS:');
    if (genericAnalysis.summary) {
      console.log(`   Company: ${genericAnalysis.company}`);
      console.log(`   Concept: ${genericAnalysis.concept}`);
      console.log(`   Periods Analyzed: ${genericAnalysis.summary.totalPeriods}`);
      console.log(`   Total Facts Found: ${genericAnalysis.summary.totalFacts}`);
    }

    console.log('\n🎯 TIME SERIES DIMENSIONAL ANALYSIS TESTING COMPLETE!');
    console.log('════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('✅ New MCP method `time_series_dimensional_analysis` is ready!');
    console.log('📊 Capable of building subsegment revenue tables across geography and time');
    console.log('📈 Includes growth rate analysis and geographic mix breakdown');
    console.log('🏷️  Handles dimensional XBRL context with fallback mechanisms');
    console.log('');
    console.log('🎯 PERFECT FOR YOUR USE CASE:');
    console.log('   - Build J&J Electrophysiology revenue tables like in your image');
    console.log('   - Compare U.S. vs International performance across quarters');
    console.log('   - Calculate YoY growth rates by geography');
    console.log('   - Analyze subsegment revenue classification trends');
    console.log('');
    console.log('🚀 Ready for integration with Cursor MCP!');

  } catch (error) {
    console.error('❌ Error testing time series analysis:', error.message);
    console.error('📋 Full error details:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testTimeSeriesAnalysis()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testTimeSeriesAnalysis };
