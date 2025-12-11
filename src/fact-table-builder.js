const { getDimensionalFacts, getCompanySubmissions } = require('./edgar-api.js');

/**
 * Build a comprehensive table of facts around a specific value level
 * @param {string} cikOrTicker - Company CIK or ticker
 * @param {number} targetValue - Target value to search around (e.g., 638000000)
 * @param {number} tolerance - Tolerance range (±) for matching values
 * @param {string} [accessionNumber] - Specific filing accession number
 * @returns {Promise<Object>} Structured table of dimensional facts
 */
async function buildFactTable(cikOrTicker, targetValue, tolerance = 50000000, accessionNumber = null) {
  // console.log(`🔍 Building fact table for ${cikOrTicker} around $${(targetValue / 1000000).toFixed(0)}M`);
  // console.log(`   Tolerance: ±$${(tolerance / 1000000).toFixed(0)}M`);
  
  try {
    let targetAccession = accessionNumber;
    
    // If no specific accession, find the most recent Q1 2025 filing
    if (!targetAccession) {
      const submissions = await getCompanySubmissions(cikOrTicker);
      const recentFiling = submissions.recentFilings.find(filing => 
        filing.form === '10-Q' && 
        filing.reportDate && 
        (filing.reportDate.includes('2025-03') || filing.reportDate.includes('2025-06'))
      ) || submissions.recentFilings[0]; // Fallback to most recent
      
      if (!recentFiling) {
        throw new Error('Could not find suitable filing');
      }
      
      targetAccession = recentFiling.accessionNumber;
      // console.log(`📋 Using filing: ${recentFiling.form} (${recentFiling.filingDate})`);
      // console.log(`   Accession: ${targetAccession}`);
    }
    
    // Search for facts within the tolerance range
    const searchCriteria = {
      concept: 'Revenue', // Broad search for revenue-related concepts
      valueRange: {
        min: targetValue - tolerance,
        max: targetValue + tolerance
      }
    };
    
    // Get dimensional facts
    const factResults = await getDimensionalFacts(cikOrTicker, targetAccession, searchCriteria);
    
    // Process and structure the results into a table
    const tableData = processFactsIntoTable(factResults, targetValue, tolerance);
    
    return {
      company: factResults.cik,
      filing: targetAccession,
      targetValue: targetValue,
      tolerance: tolerance,
      searchRange: {
        min: targetValue - tolerance,
        max: targetValue + tolerance
      },
      table: tableData,
      summary: generateTableSummary(tableData),
      source: 'SEC EDGAR XBRL Instance Document Analysis'
    };
    
  } catch (error) {
    // console.error('Error building fact table:', error.message);
    throw new Error(`Failed to build fact table: ${error.message}`);
  }
}

/**
 * Process XBRL facts into a structured table format
 * @param {Object} factResults - Results from getDimensionalFacts
 * @param {number} targetValue - Target value for highlighting
 * @param {number} tolerance - Tolerance range
 * @returns {Array} Structured table data
 */
function processFactsIntoTable(factResults, targetValue, tolerance) {
  const table = [];
  
  if (!factResults.matchingFacts || factResults.matchingFacts.length === 0) {
    return table;
  }
  
  factResults.matchingFacts.forEach((fact, index) => {
    const numericValue = parseFloat(fact.value) || 0;
    const isInRange = Math.abs(numericValue - targetValue) <= tolerance;
    const isExactMatch = Math.abs(numericValue - targetValue) < 1000000; // Within $1M
    
    if (isInRange) {
      const tableRow = {
        rowNumber: index + 1,
        concept: fact.concept,
        namespace: fact.namespace,
        value: numericValue,
        valueFormatted: `$${(numericValue / 1000000).toFixed(1)}M`,
        exactMatch: isExactMatch,
        deviationFromTarget: numericValue - targetValue,
        deviationFormatted: `${numericValue > targetValue ? '+' : ''}$${((numericValue - targetValue) / 1000000).toFixed(1)}M`,
        
        // Period information
        periodType: fact.period?.type || 'unknown',
        periodStart: fact.period?.startDate || fact.period?.instant || 'N/A',
        periodEnd: fact.period?.endDate || fact.period?.instant || 'N/A',
        
        // Dimensional breakdown
        dimensions: fact.dimensions || {},
        dimensionCount: Object.keys(fact.dimensions || {}).length,
        
        // Context and technical details
        contextRef: fact.contextRef,
        unitRef: fact.unitRef,
        decimals: fact.decimals,
        scale: fact.scale,
        
        // Dimensional analysis
        hasGeographicDimension: hasGeographicDimension(fact.dimensions),
        hasSegmentDimension: hasSegmentDimension(fact.dimensions),
        hasSubsegmentDimension: hasSubsegmentDimension(fact.dimensions),
        
        // Business classification
        businessClassification: classifyBusinessFact(fact)
      };
      
      table.push(tableRow);
    }
  });
  
  // Sort by deviation from target (closest first)
  table.sort((a, b) => Math.abs(a.deviationFromTarget) - Math.abs(b.deviationFromTarget));
  
  return table;
}

/**
 * Generate a summary of the fact table
 * @param {Array} tableData - Processed table data
 * @returns {Object} Table summary statistics
 */
function generateTableSummary(tableData) {
  const summary = {
    totalFacts: tableData.length,
    exactMatches: tableData.filter(row => row.exactMatch).length,
    conceptTypes: [...new Set(tableData.map(row => row.concept))],
    
    // Dimensional analysis
    factsWithGeography: tableData.filter(row => row.hasGeographicDimension).length,
    factsWithSegments: tableData.filter(row => row.hasSegmentDimension).length,
    factsWithSubsegments: tableData.filter(row => row.hasSubsegmentDimension).length,
    
    // Value analysis
    valueRange: {
      min: Math.min(...tableData.map(row => row.value)),
      max: Math.max(...tableData.map(row => row.value)),
      minFormatted: `$${(Math.min(...tableData.map(row => row.value)) / 1000000).toFixed(1)}M`,
      maxFormatted: `$${(Math.max(...tableData.map(row => row.value)) / 1000000).toFixed(1)}M`
    },
    
    // Business classifications
    businessTypes: tableData.reduce((acc, row) => {
      acc[row.businessClassification] = (acc[row.businessClassification] || 0) + 1;
      return acc;
    }, {}),
    
    // Period analysis
    periodTypes: [...new Set(tableData.map(row => row.periodType))],
    uniquePeriods: [...new Set(tableData.map(row => `${row.periodStart} to ${row.periodEnd}`))]
  };
  
  return summary;
}

/**
 * Check if fact has geographic dimensional data
 * @param {Object} dimensions - Dimensional data
 * @returns {boolean} True if geographic dimension exists
 */
function hasGeographicDimension(dimensions) {
  if (!dimensions) return false;
  
  const geoKeywords = ['geography', 'geographic', 'country', 'region', 'nonus', 'us', 'international'];
  
  return Object.keys(dimensions).some(key => 
    geoKeywords.some(keyword => key.toLowerCase().includes(keyword))
  ) || Object.values(dimensions).some(value => 
    geoKeywords.some(keyword => value.toLowerCase().includes(keyword))
  );
}

/**
 * Check if fact has business segment dimensional data
 * @param {Object} dimensions - Dimensional data
 * @returns {boolean} True if segment dimension exists
 */
function hasSegmentDimension(dimensions) {
  if (!dimensions) return false;
  
  const segmentKeywords = ['segment', 'business', 'division', 'medtech', 'pharmaceutical', 'consumer'];
  
  return Object.keys(dimensions).some(key => 
    segmentKeywords.some(keyword => key.toLowerCase().includes(keyword))
  ) || Object.values(dimensions).some(value => 
    segmentKeywords.some(keyword => value.toLowerCase().includes(keyword))
  );
}

/**
 * Check if fact has subsegment dimensional data
 * @param {Object} dimensions - Dimensional data
 * @returns {boolean} True if subsegment dimension exists
 */
function hasSubsegmentDimension(dimensions) {
  if (!dimensions) return false;
  
  const subsegmentKeywords = ['subsegment', 'electrophysiology', 'orthopedics', 'surgery', 'vision'];
  
  return Object.keys(dimensions).some(key => 
    subsegmentKeywords.some(keyword => key.toLowerCase().includes(keyword))
  ) || Object.values(dimensions).some(value => 
    subsegmentKeywords.some(keyword => value.toLowerCase().includes(keyword))
  );
}

/**
 * Classify the business nature of a fact
 * @param {Object} fact - XBRL fact object
 * @returns {string} Business classification
 */
function classifyBusinessFact(fact) {
  const concept = fact.concept.toLowerCase();
  const dimensions = fact.dimensions || {};
  
  // Check for revenue concepts
  if (concept.includes('revenue') || concept.includes('sales')) {
    if (hasSubsegmentDimension(dimensions)) {
      return 'Subsegment Revenue';
    } else if (hasSegmentDimension(dimensions)) {
      return 'Segment Revenue';
    } else if (hasGeographicDimension(dimensions)) {
      return 'Geographic Revenue';
    } else {
      return 'Total Revenue';
    }
  }
  
  // Check for other financial concepts
  if (concept.includes('asset')) return 'Assets';
  if (concept.includes('liability')) return 'Liabilities';
  if (concept.includes('equity')) return 'Equity';
  if (concept.includes('expense')) return 'Expenses';
  if (concept.includes('income')) return 'Income';
  
  return 'Other Financial Metric';
}

/**
 * Format the fact table for display
 * @param {Array} tableData - Processed table data
 * @param {Object} options - Formatting options
 * @returns {string} Formatted table string
 */
function formatFactTable(tableData, options = {}) {
  const { maxRows = 20, showDimensions = true, highlightExact = true } = options;
  
  let output = '';
  
  // Table header
  output += '📊 DIMENSIONAL FACT TABLE\n';
  output += '═'.repeat(120) + '\n';
  output += sprintf('%-3s %-30s %-12s %-8s %-20s %-15s %-25s\n', 
    '#', 'Concept', 'Value', 'Match', 'Period', 'Dimensions', 'Classification');
  output += '─'.repeat(120) + '\n';
  
  // Table rows
  const displayRows = tableData.slice(0, maxRows);
  
  displayRows.forEach(row => {
    const matchIndicator = row.exactMatch ? '🎯' : (Math.abs(row.deviationFromTarget) < 10000000 ? '📍' : '○');
    const dimensionSummary = Object.keys(row.dimensions).length > 0 ? 
      `${Object.keys(row.dimensions).length} dims` : 'No dims';
    
    output += sprintf('%-3s %-30s %-12s %-8s %-20s %-15s %-25s\n',
      row.rowNumber,
      row.concept.substring(0, 28),
      row.valueFormatted,
      matchIndicator,
      `${row.periodStart} to ${row.periodEnd}`.substring(0, 18),
      dimensionSummary,
      row.businessClassification.substring(0, 23)
    );
    
    if (showDimensions && Object.keys(row.dimensions).length > 0) {
      Object.entries(row.dimensions).forEach(([dim, member]) => {
        output += sprintf('    🏷️  %-20s: %s\n', dim.substring(0, 18), member.substring(0, 40));
      });
      output += '\n';
    }
  });
  
  return output;
}

// Simple sprintf implementation for formatting
function sprintf(format, ...args) {
  let i = 0;
  return format.replace(/%[-+0-9.]*[sd]/g, (match) => {
    const arg = args[i++];
    if (match.includes('s')) return String(arg);
    if (match.includes('d')) return Number(arg);
    return arg;
  });
}

module.exports = {
  buildFactTable,
  processFactsIntoTable,
  generateTableSummary,
  formatFactTable,
  hasGeographicDimension,
  hasSegmentDimension,
  hasSubsegmentDimension,
  classifyBusinessFact
};
