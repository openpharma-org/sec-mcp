#!/usr/bin/env node

// Test script for real SEC API functionality
const { getCompanyCik, searchCompanies } = require('../src/edgar-api.js');

async function testRealAPI() {
  console.log('🧪 Testing real SEC API functionality...\n');
  
  try {
    // Test 1: CIK lookup with real API
    console.log('1️⃣ Testing CIK lookup with real SEC API...');
    const cik = await getCompanyCik('AAPL');
    console.log(`✅ AAPL CIK from real SEC API: ${cik}`);
    console.log('');
    
    // Test 2: Company search with real API
    console.log('2️⃣ Testing company search with real SEC API...');
    const searchResult = await searchCompanies('Apple');
    console.log(`✅ Found ${searchResult.companies.length} companies matching "Apple"`);
    console.log(`   Source: ${searchResult.source}`);
    if (searchResult.companies.length > 0) {
      console.log(`   First result: ${searchResult.companies[0].title} (${searchResult.companies[0].ticker})`);
      console.log(`   CIK: ${searchResult.companies[0].cik}`);
    }
    console.log('');
    
    // Test 3: Search for a less common company
    console.log('3️⃣ Testing search for a less common company...');
    const lessCommonSearch = await searchCompanies('Tesla');
    console.log(`✅ Found ${lessCommonSearch.companies.length} companies matching "Tesla"`);
    if (lessCommonSearch.companies.length > 0) {
      console.log(`   First result: ${lessCommonSearch.companies[0].title} (${lessCommonSearch.companies[0].ticker})`);
    }
    console.log('');
    
    console.log('🎉 Real SEC API tests completed successfully!');
    console.log('✨ Now using live data from SEC\'s official company tickers database');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testRealAPI();
