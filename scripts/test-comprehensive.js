#!/usr/bin/env node

// Comprehensive test script for SEC EDGAR MCP Server
const { 
  getCompanyCik, 
  searchCompanies, 
  getCompanySubmissions, 
  getCompanyFacts, 
  getCompanyConcept, 
  filterFilings 
} = require('../src/edgar-api.js');

async function runComprehensiveTests() {
  console.log('🧪 Running comprehensive SEC EDGAR API tests...\n');
  
  try {
    // Test 1: Company Search
    console.log('1️⃣ Testing company search...');
    const searchResult = await searchCompanies('Apple');
    console.log(`✅ Found ${searchResult.companies.length} companies matching "Apple"`);
    if (searchResult.companies.length > 0) {
      console.log(`   First result: ${searchResult.companies[0].title} (${searchResult.companies[0].ticker})`);
    }
    console.log('');
    
    // Test 2: CIK Lookup
    console.log('2️⃣ Testing CIK lookup...');
    const cik = await getCompanyCik('AAPL');
    console.log(`✅ AAPL CIK: ${cik}`);
    console.log('');
    
    // Test 3: Company Submissions
    console.log('3️⃣ Testing company submissions...');
    const submissions = await getCompanySubmissions('AAPL');
    console.log(`✅ Retrieved submissions for: ${submissions.name}`);
    console.log(`   Total recent filings: ${submissions.recentFilings.length}`);
    console.log(`   Latest filing: ${submissions.recentFilings[0].form} on ${submissions.recentFilings[0].filingDate}`);
    console.log('');
    
    // Test 4: Filing Filter
    console.log('4️⃣ Testing filing filter...');
    const filtered10K = filterFilings(submissions.recentFilings, { formType: '10-K', limit: 3 });
    console.log(`✅ Found ${filtered10K.length} 10-K filings`);
    if (filtered10K.length > 0) {
      console.log(`   Most recent 10-K: ${filtered10K[0].filingDate}`);
    }
    console.log('');
    
    // Test 5: Company Facts (smaller test due to large response)
    console.log('5️⃣ Testing company facts...');
    const facts = await getCompanyFacts('AAPL');
    console.log(`✅ Retrieved facts for: ${facts.entityName}`);
    const taxonomies = Object.keys(facts.facts);
    console.log(`   Available taxonomies: ${taxonomies.join(', ')}`);
    console.log('');
    
    // Test 6: Company Concept
    console.log('6️⃣ Testing company concept...');
    const concept = await getCompanyConcept('AAPL', 'us-gaap', 'Assets');
    console.log(`✅ Retrieved concept data for: ${concept.entityName}`);
    console.log(`   Concept: ${concept.label}`);
    const units = Object.keys(concept.units);
    console.log(`   Available units: ${units.join(', ')}`);
    if (concept.units.USD && concept.units.USD.length > 0) {
      const latestAssets = concept.units.USD[concept.units.USD.length - 1];
      console.log(`   Latest assets value: $${(latestAssets.val / 1000000).toFixed(0)}M (${latestAssets.end})`);
    }
    console.log('');
    
    console.log('🎉 All comprehensive tests completed successfully!');
    console.log('📝 The SEC EDGAR MCP server is fully functional with:');
    console.log('   ✓ Company search and CIK lookup');
    console.log('   ✓ Filing history retrieval');
    console.log('   ✓ Filing filtering capabilities');
    console.log('   ✓ XBRL financial data access');
    console.log('   ✓ Specific financial concept queries');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

runComprehensiveTests();
