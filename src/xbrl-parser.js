const axios = require('axios');

/**
 * Enhanced XBRL parser for dimensional data extraction
 * This module can access XBRL instance documents to find dimensional facts
 */

/**
 * Get the URL to the primary iXBRL (Inline XBRL) document from a filing
 * Uses the official SEC EDGAR Filing API instead of blocked Archives
 * @param {string} accessionNumber - SEC accession number (e.g., "0000200406-25-000119")
 * @param {string} cik - Company CIK
 * @param {string} [primaryDocument] - Primary document filename if known
 * @returns {Promise<string>} URL to primary iXBRL HTML document
 */
async function getXbrlInstanceUrl(accessionNumber, cik, primaryDocument = null) {
  // console.log(`🔍 Finding iXBRL document for ${accessionNumber} via EDGAR Filing API`);
  
  // Try the official SEC Submissions API to get filing details first
  try {
    const paddedCik = cik.padStart(10, '0');
    const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
    // console.log(`🔗 Getting filing details from SEC Submissions API: ${submissionsUrl}`);
    
    const submissionsResponse = await axios.get(submissionsUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'SEC-Research-Tool/1.0 (contact@research.org)',
        'Accept': 'application/json'
      }
    });
    
    if (submissionsResponse.status === 200 && submissionsResponse.data) {
      // console.log(`✅ SEC Submissions API accessible for CIK ${paddedCik}`);
      
      // Find the specific filing in the submissions data
      const filings = submissionsResponse.data.filings?.recent;
      if (filings && filings.accessionNumber) {
        const filingIndex = filings.accessionNumber.findIndex(acc => acc === accessionNumber);
        if (filingIndex >= 0) {
          const primaryDoc = filings.primaryDocument?.[filingIndex];
          if (primaryDoc && primaryDoc.endsWith('.htm')) {
            // Construct the EDGAR Archives URL using the primary document
            const accessionNoDashes = accessionNumber.replace(/-/g, '');
            const archiveCik = cik.replace(/^0+/, ''); // Remove leading zeros for URL
            const documentUrl = `https://data.sec.gov/Archives/edgar/data/${archiveCik}/${accessionNoDashes}/${primaryDoc}`;
            
            // console.log(`📄 Found primary iXBRL document via Submissions API: ${primaryDoc}`);
            // console.log(`🔗 Document URL: ${documentUrl}`);
            
            // Test if the document is accessible
            try {
              const testResponse = await axios.head(documentUrl, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'SEC-Research-Tool/1.0 (contact@research.org)',
                  'Accept': 'text/html',
                  'Accept-Language': 'en-US,en;q=0.9'
                }
              });
              
              if (testResponse.status === 200) {
                // console.log(`✅ iXBRL document is accessible!`);
                return documentUrl;
              }
            } catch (testError) {
              // console.log(`⚠️ iXBRL document test failed: ${testError.response?.status || testError.message}`);
            }
          }
        }
      }
    }
  } catch (apiError) {
    // console.log(`⚠️ SEC Submissions API not available: ${apiError.response?.status || apiError.message}`);
  }
  
  // Fallback to traditional EDGAR Archives (may be blocked)
  // console.log(`🔄 Falling back to EDGAR Archives approach...`);
  
  const accessionNoDashes = accessionNumber.replace(/-/g, '');
  const paddedCik = cik.replace(/^0+/, ''); // Remove leading zeros for URL
  const baseUrl = `https://data.sec.gov/Archives/edgar/data/${paddedCik}/${accessionNoDashes}`;
  
  // If we have the primary document name, use it directly
  if (primaryDocument && primaryDocument.endsWith('.htm')) {
    const directUrl = `${baseUrl}/${primaryDocument}`;
    // console.log(`📄 Using known primary document: ${primaryDocument}`);
    
    try {
      const response = await axios.head(directUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SEC-Research-Tool/1.0 (contact@research.org)',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      if (response.status === 200) {
        // console.log(`✅ Found iXBRL document: ${primaryDocument}`);
        return directUrl;
      }
    } catch (error) {
      // console.log(`⚠️ Primary document not accessible: ${error.message}`);
    }
  }
  
  try {
    // Try to get the filing index to find the primary document
    const indexUrl = `${baseUrl}/${accessionNumber}-index.html`;
    // console.log(`📋 Checking filing index: ${indexUrl}`);
    
    const indexResponse = await axios.get(indexUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'SEC-MCP-Server/0.0.1',
        'Accept': 'text/html'
      }
    });
    
    // Parse the index to find the primary document (usually the 10-Q/10-K HTML file)
    const indexHtml = indexResponse.data;
    const primaryDocMatch = indexHtml.match(/<a[^>]*href="([^"]*\.htm)"[^>]*>.*?10-[QK]/i);
    
    if (primaryDocMatch) {
      const primaryDocFilename = primaryDocMatch[1];
      const primaryDocUrl = `${baseUrl}/${primaryDocFilename}`;
      
      // console.log(`📄 Found primary iXBRL document: ${primaryDocFilename}`);
      return primaryDocUrl;
    }
    
    // Fallback: Try patterns found in the index
    const possibleIxbrlFiles = findCompanySpecificPatterns(indexHtml);
    
    for (const filename of possibleIxbrlFiles) {
      const url = `${baseUrl}/${filename}`;
      try {
        // console.log(`🧪 Testing: ${filename}`);
        const response = await axios.head(url, {
          headers: {
            'User-Agent': 'SEC-MCP-Server/0.0.1',
            'Accept': 'text/html'
          }
        });
        if (response.status === 200) {
          // console.log(`✅ Found iXBRL document: ${filename}`);
          return url;
        }
      } catch (error) {
        // Continue to next possibility
        continue;
      }
    }
    
  } catch (error) {
    // console.log(`⚠️ Could not access filing index: ${error.message}`);
  }
  
  // Final fallback: Try common patterns without index
  const fallbackPatterns = [
    // Company-specific pattern based on ticker and date
    'jnj-*.htm',
    // Generic patterns
    `${accessionNumber}.htm`,
    `${accessionNoDashes}.htm`,
    'primary_doc.htm',
    'document.htm'
  ];
  
  // console.log(`🔄 Trying fallback patterns...`);
  for (const pattern of fallbackPatterns) {
    if (pattern.includes('*')) {
      // Skip wildcard patterns for now - would need more sophisticated matching
      continue;
    }
    
    const url = `${baseUrl}/${pattern}`;
    try {
      // console.log(`🧪 Testing fallback: ${pattern}`);
      const response = await axios.head(url, {
        headers: {
          'User-Agent': 'SEC-MCP-Server/0.0.1',
          'Accept': 'text/html'
        }
      });
      if (response.status === 200) {
        // console.log(`✅ Found iXBRL document: ${pattern}`);
        return url;
      }
    } catch (error) {
      // Continue to next possibility
      continue;
    }
  }
  
  throw new Error(`Could not find iXBRL document for accession ${accessionNumber}`);
}

/**
 * Extract company-specific document patterns from filing index
 * @param {string} indexHtml - HTML content of filing index
 * @returns {Array} Array of potential filenames
 */
function findCompanySpecificPatterns(indexHtml) {
  const patterns = [];
  
  // Look for .htm files in the index
  const htmMatches = indexHtml.match(/<a[^>]*href="([^"]*\.htm)"[^>]*>/gi) || [];
  
  htmMatches.forEach(match => {
    const filenameMatch = match.match(/href="([^"]*\.htm)"/i);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      // Skip common non-primary documents
      if (!filename.includes('ex') && !filename.includes('exhibit') && 
          !filename.includes('table') && filename.length < 50) {
        patterns.push(filename);
      }
    }
  });
  
  return patterns;
}

/**
 * Download and parse iXBRL (Inline XBRL) document for dimensional facts
 * @param {string} ixbrlUrl - URL to iXBRL HTML document
 * @returns {Promise<Object>} Parsed XBRL data with dimensional contexts
 */
async function parseXbrlInstance(ixbrlUrl) {
  try {
    // console.log(`📄 Downloading iXBRL document: ${ixbrlUrl}`);
    
    const response = await axios.get(ixbrlUrl, {
      timeout: 60000, // Increased timeout for large HTML files
      headers: {
        'User-Agent': 'SEC-MCP-Server/0.0.1',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    
    const htmlContent = response.data;
    
    // console.log(`📊 Parsing iXBRL facts from HTML (${Math.round(htmlContent.length / 1024)}KB)`);
    
    // Parse iXBRL facts and contexts from HTML
    const facts = extractFactsFromIxbrl(htmlContent);
    const contexts = extractContextsFromIxbrl(htmlContent);
    
    // console.log(`✅ Found ${facts.length} facts and ${Object.keys(contexts).length} contexts`);
    
    return {
      facts: facts,
      contexts: contexts,
      sourceUrl: ixbrlUrl,
      documentType: 'iXBRL'
    };
    
  } catch (error) {
    // console.error('Error parsing iXBRL instance:', error.message);
    throw new Error(`Failed to parse iXBRL instance: ${error.message}`);
  }
}

/**
 * Extract facts from iXBRL (Inline XBRL) HTML content
 * iXBRL embeds XBRL data in HTML using special tags and attributes
 * @param {string} htmlContent - Raw iXBRL HTML content
 * @returns {Array} Array of XBRL facts with context references
 */
function extractFactsFromIxbrl(htmlContent) {
  const facts = [];
  
  // iXBRL facts are embedded in HTML using ix: tags or data-* attributes
  // Pattern 1: <ix:nonFraction> tags (most common for monetary values)
  const nonFractionPattern = /<ix:nonFraction[^>]*name="([^"]*)"[^>]*contextRef="([^"]*)"[^>]*(?:unitRef="([^"]*)")?[^>]*(?:decimals="([^"]*)")?[^>]*(?:scale="([^"]*)")?[^>]*>([^<]*)<\/ix:nonFraction>/gi;
  
  let match;
  while ((match = nonFractionPattern.exec(htmlContent)) !== null) {
    const [fullMatch, name, contextRef, unitRef, decimals, scale, value] = match;
    
    // Parse the name to get namespace and local name
    const [namespace, localName] = parseXbrlName(name);
    
    // Convert scale and get numeric value
    const numericValue = parseNumericValue(value, scale);
    
    facts.push({
      namespace: namespace,
      concept: localName,
      value: numericValue,
      valueRaw: value,
      contextRef: contextRef,
      unitRef: unitRef || 'USD',
      decimals: decimals,
      scale: scale,
      fullTag: name,
      factType: 'nonFraction'
    });
  }
  
  // Pattern 2: <ix:fraction> tags (for ratios, percentages)
  const fractionPattern = /<ix:fraction[^>]*name="([^"]*)"[^>]*contextRef="([^"]*)"[^>]*>([^<]*)<\/ix:fraction>/gi;
  
  while ((match = fractionPattern.exec(htmlContent)) !== null) {
    const [fullMatch, name, contextRef, value] = match;
    const [namespace, localName] = parseXbrlName(name);
    
    facts.push({
      namespace: namespace,
      concept: localName,
      value: parseFloat(value) || value,
      valueRaw: value,
      contextRef: contextRef,
      unitRef: 'pure',
      fullTag: name,
      factType: 'fraction'
    });
  }
  
  // Pattern 3: <ix:nonNumeric> tags (for text/string values)
  const nonNumericPattern = /<ix:nonNumeric[^>]*name="([^"]*)"[^>]*contextRef="([^"]*)"[^>]*>([^<]*)<\/ix:nonNumeric>/gi;
  
  while ((match = nonNumericPattern.exec(htmlContent)) !== null) {
    const [fullMatch, name, contextRef, value] = match;
    const [namespace, localName] = parseXbrlName(name);
    
    facts.push({
      namespace: namespace,
      concept: localName,
      value: value.trim(),
      valueRaw: value,
      contextRef: contextRef,
      fullTag: name,
      factType: 'nonNumeric'
    });
  }
  
  return facts;
}

/**
 * Extract facts from traditional XBRL XML content (fallback)
 * @param {string} xmlContent - Raw XBRL XML content
 * @returns {Array} Array of XBRL facts with context references
 */
function extractFactsFromXml(xmlContent) {
  const facts = [];
  
  // Regex patterns to match XBRL facts
  const factPattern = /<([a-zA-Z0-9_-]+:)?([a-zA-Z0-9_-]+)([^>]*contextRef="([^"]*)"[^>]*decimals="[^"]*"[^>]*)>([^<]*)<\/([^>]+)>/g;
  
  let match;
  while ((match = factPattern.exec(xmlContent)) !== null) {
    const [fullMatch, namespace, localName, attributes, contextRef, value, closingTag] = match;
    
    // Extract additional attributes
    const unitRef = extractAttribute(attributes, 'unitRef');
    const decimals = extractAttribute(attributes, 'decimals');
    const scale = extractAttribute(attributes, 'scale');
    
    facts.push({
      namespace: namespace?.replace(':', '') || 'default',
      concept: localName,
      value: parseNumericValue(value, scale),
      valueRaw: value,
      contextRef: contextRef,
      unitRef: unitRef,
      decimals: decimals,
      scale: scale,
      fullTag: `${namespace || ''}${localName}`,
      factType: 'legacy'
    });
  }
  
  return facts;
}

/**
 * Parse XBRL name into namespace and local name
 * @param {string} name - Full XBRL name (e.g., "us-gaap:Revenue")
 * @returns {Array} [namespace, localName]
 */
function parseXbrlName(name) {
  const parts = name.split(':');
  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }
  return ['default', name];
}

/**
 * Parse numeric value with scale factor
 * @param {string} value - Raw value string
 * @param {string} scale - Scale factor (e.g., "6" for millions)
 * @returns {number} Parsed numeric value
 */
function parseNumericValue(value, scale) {
  const numValue = parseFloat(value.replace(/,/g, '')) || 0;
  if (scale) {
    const scaleNum = parseInt(scale);
    return numValue * Math.pow(10, scaleNum);
  }
  return numValue;
}

/**
 * Extract context definitions from iXBRL HTML content
 * @param {string} htmlContent - Raw iXBRL HTML content
 * @returns {Object} Context definitions with dimensional data
 */
function extractContextsFromIxbrl(htmlContent) {
  const contexts = {};
  
  // iXBRL contexts are defined in <ix:resources> sections
  // Look for context definitions in ix:context tags
  const contextPattern = /<ix:context[^>]*id="([^"]*)"[^>]*>(.*?)<\/ix:context>/gs;
  
  let match;
  while ((match = contextPattern.exec(htmlContent)) !== null) {
    const [fullMatch, contextId, contextContent] = match;
    
    contexts[contextId] = {
      id: contextId,
      period: extractPeriodFromContext(contextContent),
      entity: extractEntityFromContext(contextContent),
      dimensions: extractDimensionsFromContext(contextContent)
    };
  }
  
  // Also look for traditional XBRL contexts embedded in iXBRL
  const xbrliContextPattern = /<xbrli:context[^>]*id="([^"]*)"[^>]*>(.*?)<\/xbrli:context>/gs;
  
  while ((match = xbrliContextPattern.exec(htmlContent)) !== null) {
    const [fullMatch, contextId, contextContent] = match;
    
    contexts[contextId] = {
      id: contextId,
      period: extractPeriodFromContext(contextContent),
      entity: extractEntityFromContext(contextContent),
      dimensions: extractDimensionsFromContext(contextContent)
    };
  }
  
  return contexts;
}

/**
 * Extract context definitions from traditional XBRL XML content (fallback)
 * @param {string} xmlContent - Raw XBRL XML content
 * @returns {Object} Context definitions with dimensional data
 */
function extractContextsFromXml(xmlContent) {
  const contexts = {};
  
  // Regex to match context blocks
  const contextPattern = /<xbrli:context[^>]*id="([^"]*)"[^>]*>(.*?)<\/xbrli:context>/gs;
  
  let match;
  while ((match = contextPattern.exec(xmlContent)) !== null) {
    const [fullMatch, contextId, contextContent] = match;
    
    contexts[contextId] = {
      id: contextId,
      period: extractPeriodFromContext(contextContent),
      entity: extractEntityFromContext(contextContent),
      dimensions: extractDimensionsFromContext(contextContent)
    };
  }
  
  return contexts;
}

/**
 * Extract period information from context content
 * @param {string} contextContent - Context XML content
 * @returns {Object} Period information
 */
function extractPeriodFromContext(contextContent) {
  const instantMatch = contextContent.match(/<xbrli:instant>([^<]*)<\/xbrli:instant>/);
  const startDateMatch = contextContent.match(/<xbrli:startDate>([^<]*)<\/xbrli:startDate>/);
  const endDateMatch = contextContent.match(/<xbrli:endDate>([^<]*)<\/xbrli:endDate>/);
  
  if (instantMatch) {
    return { type: 'instant', instant: instantMatch[1] };
  } else if (startDateMatch && endDateMatch) {
    return { type: 'duration', startDate: startDateMatch[1], endDate: endDateMatch[1] };
  }
  
  return { type: 'unknown' };
}

/**
 * Extract entity information from context content
 * @param {string} contextContent - Context XML content
 * @returns {Object} Entity information
 */
function extractEntityFromContext(contextContent) {
  const identifierMatch = contextContent.match(/<xbrli:identifier[^>]*>([^<]*)<\/xbrli:identifier>/);
  
  return {
    identifier: identifierMatch ? identifierMatch[1] : null
  };
}

/**
 * Extract dimensional information from context content
 * @param {string} contextContent - Context XML content
 * @returns {Object} Dimensional data
 */
function extractDimensionsFromContext(contextContent) {
  const dimensions = {};
  
  // Look for explicit dimension members
  const memberPattern = /<xbrldi:explicitMember[^>]*dimension="([^"]*)"[^>]*>([^<]*)<\/xbrldi:explicitMember>/g;
  
  let match;
  while ((match = memberPattern.exec(contextContent)) !== null) {
    const [fullMatch, dimension, member] = match;
    dimensions[dimension] = member;
  }
  
  return dimensions;
}

/**
 * Helper function to extract attributes from XML
 * @param {string} attributeString - XML attribute string
 * @param {string} attributeName - Name of attribute to extract
 * @returns {string|null} Attribute value
 */
function extractAttribute(attributeString, attributeName) {
  const match = attributeString.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
  return match ? match[1] : null;
}

/**
 * Find dimensional facts matching specific criteria
 * @param {Object} xbrlData - Parsed XBRL data
 * @param {Object} criteria - Search criteria
 * @param {string} [criteria.concept] - XBRL concept name
 * @param {string} [criteria.value] - Exact fact value to match
 * @param {Object} [criteria.valueRange] - Value range {min, max}
 * @param {Object} [criteria.dimensions] - Dimensional filters
 * @returns {Array} Matching facts with dimensional context
 */
function findDimensionalFacts(xbrlData, criteria) {
  const { facts, contexts } = xbrlData;
  const matchingFacts = [];
  
  // Searching facts with criteria
  
  for (const fact of facts) {
    // Check if concept matches (partial match for flexibility)
    if (criteria.concept && !fact.concept.toLowerCase().includes(criteria.concept.toLowerCase())) {
      continue;
    }
    
    // Check if exact value matches (if specified)
    if (criteria.value && fact.value.toString() !== criteria.value.toString()) {
      continue;
    }
    
    // Check if value is in range (if specified)
    if (criteria.valueRange) {
      const numValue = typeof fact.value === 'number' ? fact.value : parseFloat(fact.value);
      if (isNaN(numValue) || numValue < criteria.valueRange.min || numValue > criteria.valueRange.max) {
        continue;
      }
    }
    
    // Get context for this fact
    const context = contexts[fact.contextRef];
    if (!context) {
      continue;
    }
    
    // Check dimensional filters (if specified)
    if (criteria.dimensions) {
      let dimensionMatch = true;
      for (const [dimName, dimValue] of Object.entries(criteria.dimensions)) {
        if (!context.dimensions[dimName] || !context.dimensions[dimName].toLowerCase().includes(dimValue.toLowerCase())) {
          dimensionMatch = false;
          break;
        }
      }
      if (!dimensionMatch) {
        continue;
      }
    }
    
    // This fact matches all criteria
    matchingFacts.push({
      ...fact,
      context: context,
      period: context.period,
      periodType: context.period?.type,
      periodStart: context.period?.startDate || context.period?.instant,
      periodEnd: context.period?.endDate || context.period?.instant,
      dimensions: context.dimensions
    });
  }
  
  // console.log(`✅ Found ${matchingFacts.length} matching facts`);
  return matchingFacts;
}

module.exports = {
  getXbrlInstanceUrl,
  parseXbrlInstance,
  findDimensionalFacts,
  extractFactsFromIxbrl,
  extractFactsFromXml,
  extractContextsFromIxbrl,
  extractContextsFromXml,
  parseXbrlName,
  parseNumericValue,
  findCompanySpecificPatterns
};
