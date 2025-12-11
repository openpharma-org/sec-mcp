#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const {
  getCompanyCik,
  searchCompanies,
  getCompanySubmissions,
  getCompanyFacts,
  getCompanyConcept,
  getFramesData,
  filterFilings,
  getDimensionalFacts,
  searchFactsByValue,
  buildFactTable,
  timeSeriesDimensionalAnalysis
} = require('./edgar-api.js');

const server = new Server(
  {
    name: 'sec-edgar-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sec-edgar',
        description: 'Unified tool for SEC EDGAR (Electronic Data Gathering, Analysis, and Retrieval) operations: access company filings, financial statements, and XBRL data from the U.S. Securities and Exchange Commission. Provides comprehensive access to public company disclosures, financial metrics, and regulatory filings using the official SEC EDGAR API.',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: [
                'search_companies', 
                'get_company_cik', 
                'get_company_submissions', 
                'get_company_facts', 
                'get_company_concept', 
                'get_frames_data',
                'filter_filings',
                'get_dimensional_facts',
                'search_facts_by_value',
                'build_fact_table',
                'time_series_dimensional_analysis'
              ],
              description: 'The operation to perform: search_companies (find companies by name/ticker), get_company_cik (convert ticker to CIK), get_company_submissions (filing history), get_company_facts (all XBRL financial data), get_company_concept (specific financial metric), get_frames_data (aggregated data across companies), filter_filings (filter filing results), get_dimensional_facts (get XBRL facts with dimensional context), search_facts_by_value (find facts around a target value with filters), build_fact_table (build comprehensive table of facts with dimensional analysis), time_series_dimensional_analysis (analyze subsegment revenue across time periods with geographic breakdowns)',
              examples: ['search_companies', 'get_company_submissions', 'get_company_facts']
            },
            query: {
              type: 'string',
              description: 'For search_companies: Company name or ticker symbol to search for (e.g., "Apple", "AAPL", "Microsoft")',
              examples: ['Apple', 'AAPL', 'Microsoft', 'Tesla', 'Amazon']
            },
            ticker: {
              type: 'string',
              description: 'For get_company_cik: Stock ticker symbol to convert to CIK (e.g., "AAPL", "MSFT", "TSLA")',
              examples: ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL']
            },
            cik_or_ticker: {
              type: 'string',
              description: 'For get_company_submissions, get_company_facts, get_company_concept: Company CIK number (10-digit) or ticker symbol',
              examples: ['0000320193', 'AAPL', '0000789019', 'MSFT']
            },
            taxonomy: {
              type: 'string',
              description: 'For get_company_concept, get_frames_data: XBRL taxonomy (e.g., "us-gaap" for US GAAP, "dei" for Document Entity Information, "invest" for Investment Company)',
              examples: ['us-gaap', 'dei', 'invest', 'srt', 'country', 'currency', 'exch', 'naics', 'sic', 'stpr']
            },
            tag: {
              type: 'string', 
              description: 'For get_company_concept, get_frames_data: XBRL concept tag (e.g., "Assets", "Revenues", "NetIncomeLoss", "StockholdersEquity")',
              examples: ['Assets', 'Revenues', 'NetIncomeLoss', 'StockholdersEquity', 'Cash', 'Liabilities', 'OperatingIncomeLoss']
            },
            unit: {
              type: 'string',
              description: 'For get_frames_data: Unit of measure (e.g., "USD" for US Dollars, "shares" for share counts)',
              examples: ['USD', 'shares', 'pure']
            },
            frame: {
              type: 'string',
              description: 'For get_frames_data: Reporting frame in format like "CY2021Q4I" (Calendar Year 2021 Q4 Instant), "CY2021" (Calendar Year 2021), "Q1" (Q1 any year)',
              examples: ['CY2021Q4I', 'CY2021', 'CY2020Q4I', 'Q1', 'Q2', 'Q3', 'Q4']
            },
            filings: {
              type: 'array',
              description: 'For filter_filings: Array of filing objects to filter (typically from get_company_submissions result)',
              items: {
                type: 'object'
              }
            },
            form_type: {
              type: 'string',
              description: 'For filter_filings: Form type to filter by (e.g., "10-K" for annual reports, "10-Q" for quarterly, "8-K" for current reports)',
              examples: ['10-K', '10-Q', '8-K', '20-F', 'DEF 14A', 'S-1', '4', '3']
            },
            start_date: {
              type: 'string',
              description: 'For filter_filings: Start date for filing date range in YYYY-MM-DD format',
              examples: ['2023-01-01', '2022-06-01', '2024-01-01']
            },
            end_date: {
              type: 'string',
              description: 'For filter_filings: End date for filing date range in YYYY-MM-DD format',
              examples: ['2023-12-31', '2023-06-30', '2024-12-31']
            },
            limit: {
              type: 'integer',
              description: 'For filter_filings: Maximum number of results to return',
              examples: [10, 20, 50, 100]
            },
            accession_number: {
              type: 'string',
              description: 'SEC accession number of the specific filing to analyze (for get_dimensional_facts, search_facts_by_value, build_fact_table)',
              examples: ['0000200406-25-000119', '0000320193-25-000010']
            },
            search_criteria: {
              type: 'object',
              description: 'Search criteria for finding dimensional facts (for get_dimensional_facts)',
              properties: {
                concept: {
                  type: 'string',
                  description: 'XBRL concept name to search for',
                  examples: ['Revenue', 'Assets', 'RevenueFromContractWithCustomerExcludingAssessedTax']
                },
                value: {
                  type: 'string',
                  description: 'Specific value to find (optional)',
                  examples: ['638000000', '1000000000']
                },
                valueRange: {
                  type: 'object',
                  description: 'Value range to search within (optional)',
                  properties: {
                    min: { type: 'number', description: 'Minimum value' },
                    max: { type: 'number', description: 'Maximum value' }
                  }
                },
                dimensions: {
                  type: 'object',
                  description: 'Dimensional filters (optional)',
                  examples: [{'segment': 'MedTech', 'geography': 'NonUs'}]
                }
              }
            },
            target_value: {
              type: 'number',
              description: 'Target value in dollars to search around (for search_facts_by_value, build_fact_table)',
              examples: [638000000, 500000000, 1000000000]
            },
            tolerance: {
              type: 'number',
              description: 'Tolerance range (±) in dollars for matching values (for search_facts_by_value, build_fact_table)',
              examples: [50000000, 25000000, 100000000]
            },
            filters: {
              type: 'object',
              description: 'Additional filters for fact searches (for search_facts_by_value)',
              properties: {
                concept: {
                  type: 'string',
                  description: 'XBRL concept name filter'
                },
                formType: {
                  type: 'string',
                  description: 'Filing form type (e.g., "10-Q", "10-K")'
                },
                dimensions: {
                  type: 'object',
                  description: 'Dimensional filters'
                }
              }
            },
            options: {
              type: 'object',
              description: 'Table formatting and analysis options (for build_fact_table)',
              properties: {
                maxRows: {
                  type: 'number',
                  description: 'Maximum rows to return (default: 25)'
                },
                showDimensions: {
                  type: 'boolean',
                  description: 'Include dimensional details (default: true)'
                },
                sortBy: {
                  type: 'string',
                  description: 'Sort order: deviation, value, concept (default: deviation)'
                },
                filters: {
                  type: 'object',
                  description: 'Additional fact filters'
                }
              }
            },
            time_series_options: {
              type: 'object',
              description: 'Options for time series dimensional analysis (for time_series_dimensional_analysis)',
              properties: {
                concept: {
                  type: 'string',
                  description: 'XBRL concept to analyze across time periods',
                  examples: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Assets', 'OperatingIncome']
                },
                subsegment: {
                  type: 'string',
                  description: 'Specific subsegment to analyze (e.g., product line)',
                  examples: ['Electrophysiology', 'Orthopedics', 'Surgery']
                },
                periods: {
                  type: 'number',
                  description: 'Number of quarterly periods to analyze',
                  examples: [4, 8, 12]
                },
                minValue: {
                  type: 'number',
                  description: 'Minimum value threshold for inclusion',
                  examples: [100000000, 500000000, 1000000000]
                },
                includeGeography: {
                  type: 'boolean',
                  description: 'Include geographic dimensional breakdown',
                  examples: [true, false]
                },
                showGrowthRates: {
                  type: 'boolean',
                  description: 'Calculate and display growth rates between periods',
                  examples: [true, false]
                },
                sortBy: {
                  type: 'string',
                  description: 'Sort criteria for time series results',
                  examples: ['period', 'value', 'geography']
                }
              }
            }
          },
          required: ['method'],
          additionalProperties: false
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'sec-edgar') {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const { method, ...params } = args;

    switch (method) {
      case 'search_companies': {
        const { query } = params;
        if (!query) {
          throw new Error('query parameter is required for search_companies');
        }
        
        const results = await searchCompanies(query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_company_cik': {
        const { ticker } = params;
        if (!ticker) {
          throw new Error('ticker parameter is required for get_company_cik');
        }
        
        const cik = await getCompanyCik(ticker);
        const result = {
          ticker: ticker.toUpperCase(),
          cik: cik,
          found: cik !== null,
          source: 'SEC EDGAR Company Tickers'
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_company_submissions': {
        const { cik_or_ticker } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for get_company_submissions');
        }
        
        const results = await getCompanySubmissions(cik_or_ticker);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_company_facts': {
        const { cik_or_ticker } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for get_company_facts');
        }
        
        const results = await getCompanyFacts(cik_or_ticker);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_company_concept': {
        const { cik_or_ticker, taxonomy, tag } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for get_company_concept');
        }
        if (!taxonomy) {
          throw new Error('taxonomy parameter is required for get_company_concept');
        }
        if (!tag) {
          throw new Error('tag parameter is required for get_company_concept');
        }
        
        const results = await getCompanyConcept(cik_or_ticker, taxonomy, tag);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_frames_data': {
        const { taxonomy, tag, unit, frame } = params;
        if (!taxonomy) {
          throw new Error('taxonomy parameter is required for get_frames_data');
        }
        if (!tag) {
          throw new Error('tag parameter is required for get_frames_data');
        }
        if (!unit) {
          throw new Error('unit parameter is required for get_frames_data');
        }
        if (!frame) {
          throw new Error('frame parameter is required for get_frames_data');
        }
        
        const results = await getFramesData(taxonomy, tag, unit, frame);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'filter_filings': {
        const { filings, form_type, start_date, end_date, limit } = params;
        if (!filings || !Array.isArray(filings)) {
          throw new Error('filings array parameter is required for filter_filings');
        }
        
        const filters = {};
        if (form_type) filters.formType = form_type;
        if (start_date) filters.startDate = start_date;
        if (end_date) filters.endDate = end_date;
        if (limit) filters.limit = limit;
        
        const results = filterFilings(filings, filters);
        const response = {
          originalCount: filings.length,
          filteredCount: results.length,
          filters: filters,
          filings: results,
          source: 'SEC EDGAR Filings Filter'
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'get_dimensional_facts': {
        const { cik_or_ticker, accession_number, search_criteria } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for get_dimensional_facts');
        }
        if (!accession_number) {
          throw new Error('accession_number parameter is required for get_dimensional_facts');
        }
        if (!search_criteria) {
          throw new Error('search_criteria parameter is required for get_dimensional_facts');
        }
        
        const results = await getDimensionalFacts(cik_or_ticker, accession_number, search_criteria);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'search_facts_by_value': {
        const { cik_or_ticker, target_value, tolerance, accession_number, filters } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for search_facts_by_value');
        }
        if (!target_value) {
          throw new Error('target_value parameter is required for search_facts_by_value');
        }
        
        const results = await searchFactsByValue(
          cik_or_ticker, 
          target_value,
          tolerance || 50000000,
          accession_number,
          filters || {}
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'build_fact_table': {
        const { cik_or_ticker, target_value, tolerance, accession_number, options } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for build_fact_table');
        }
        if (!target_value) {
          throw new Error('target_value parameter is required for build_fact_table');
        }
        
        const results = await buildFactTable(
          cik_or_ticker,
          target_value,
          tolerance || 50000000,
          accession_number,
          options || {}
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'time_series_dimensional_analysis': {
        const { cik_or_ticker, time_series_options } = params;
        if (!cik_or_ticker) {
          throw new Error('cik_or_ticker parameter is required for time_series_dimensional_analysis');
        }
        
        const analysisOptions = time_series_options || {};
        
        const results = await timeSeriesDimensionalAnalysis(
          cik_or_ticker,
          analysisOptions
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2)
        }
      ]
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr so it doesn't interfere with JSON-RPC
  process.stderr.write('SEC EDGAR MCP server running on stdio\n');
}

main().catch((error) => {
  process.stderr.write(`Server error: ${error}\n`);
  process.exit(1);
});