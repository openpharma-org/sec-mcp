# SEC EDGAR MCP Server

[![npm version](https://badge.fury.io/js/%40uh-joan%2Fsec-mcp-server.svg)](https://badge.fury.io/js/%40uh-joan%2Fsec-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **production-ready** Model Context Protocol (MCP) server that provides comprehensive access to the U.S. Securities and Exchange Commission's EDGAR (Electronic Data Gathering, Analysis, and Retrieval) system. This server enables AI assistants and applications to search, retrieve, and analyze public company filings, financial statements, and **dimensional XBRL data** from the SEC's database.

## 🚀 Key Features

- 🏢 **Company Discovery**: Find companies by name or ticker with real-time SEC data
- 📋 **Complete Filing Access**: Full company submission histories and document details  
- 📊 **Advanced XBRL Analysis**: Extract dimensional financial facts with geographic/segment breakdowns
- 🔍 **Intelligent Fact Search**: Find specific financial values with dimensional context
- 📈 **Business Intelligence**: Automated fact classification and table generation
- 🌐 **Multi-API Integration**: Robust fallback mechanisms across SEC endpoints
- ⚡ **Real-time Data**: Direct access to SEC's live EDGAR database
- 🔌 **MCP Compatible**: Works seamlessly with Cursor, Claude Desktop, and other MCP clients

## 🎯 Dimensional XBRL Capabilities

### Revolutionary Fact Table Generation

Extract precise financial facts with complete dimensional context:

```json
{
  "method": "build_fact_table",
  "cik_or_ticker": "JNJ",
  "target_value": 638000000,
  "tolerance": 50000000
}
```

**Returns dimensional facts like:**
- 🎯 **$638.0M** = J&J Electrophysiology **Non-US Revenue** (Q1 2025)
- 📊 Complete dimensional breakdown: Geography + Business Segment + Subsegment
- 🏷️ Full XBRL context: `us-gaap:NonUsMember` + `jnj:MedTechMember` + `jnj:ElectrophysiologyMember`

### Business Intelligence Extraction

Automatically classifies and analyzes financial facts:
- **Subsegment Revenue**: Product-line specific performance
- **Geographic Revenue**: International vs domestic breakdowns  
- **Segment Revenue**: Business division analysis
- **Comparative Analysis**: Cross-product and cross-geography insights

## 📊 Complete API Reference

The server provides a unified `sec_edgar` tool with **10 powerful methods**:

### Core Company Operations

#### 1. Search Companies (`search_companies`)
Find companies by name or ticker using SEC's official database.

```json
{
  "method": "search_companies",
  "query": "Johnson & Johnson"
}
```

#### 2. Get Company CIK (`get_company_cik`)
Convert ticker symbols to Central Index Keys with validation.

```json
{
  "method": "get_company_cik",
  "ticker": "JNJ"
}
```

#### 3. Get Company Submissions (`get_company_submissions`)
Retrieve complete filing history with enhanced metadata.

```json
{
  "method": "get_company_submissions",
  "cik_or_ticker": "0000200406"
}
```

### Financial Data Access

#### 4. Get Company Facts (`get_company_facts`)
Access all XBRL financial data with structured organization.

```json
{
  "method": "get_company_facts",
  "cik_or_ticker": "JNJ"
}
```

#### 5. Get Company Concept (`get_company_concept`)
Extract specific financial concepts with historical trends.

```json
{
  "method": "get_company_concept",
  "cik_or_ticker": "JNJ",
  "taxonomy": "us-gaap",
  "tag": "RevenueFromContractWithCustomerExcludingAssessedTax"
}
```

#### 6. Get Frames Data (`get_frames_data`)
Analyze aggregated data across companies and periods.

```json
{
  "method": "get_frames_data",
  "taxonomy": "us-gaap",
  "tag": "Assets",
  "unit": "USD",
  "frame": "CY2024Q1I"
}
```

### Advanced Dimensional Analysis

#### 7. Get Dimensional Facts (`get_dimensional_facts`)
**NEW**: Extract facts with complete dimensional context from XBRL instance documents.

```json
{
  "method": "get_dimensional_facts",
  "cik_or_ticker": "JNJ",
  "accession_number": "0000200406-25-000119",
  "search_criteria": {
    "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
    "valueRange": {
      "min": 588000000,
      "max": 688000000
    },
    "dimensions": {
      "subsegment": "Electrophysiology"
    }
  }
}
```

#### 8. Search Facts by Value (`search_facts_by_value`)
**NEW**: Find financial facts around specific target values with filters.

```json
{
  "method": "search_facts_by_value",
  "cik_or_ticker": "JNJ",
  "target_value": 638000000,
  "tolerance": 50000000,
  "filters": {
    "concept": "Revenue",
    "formType": "10-Q"
  }
}
```

#### 9. Build Fact Table (`build_fact_table`)
**NEW**: Generate comprehensive dimensional fact tables with business intelligence.

```json
{
  "method": "build_fact_table",
  "cik_or_ticker": "JNJ",
  "target_value": 638000000,
  "tolerance": 50000000,
  "options": {
    "maxRows": 25,
    "showDimensions": true,
    "sortBy": "deviation"
  }
}
```

### Utility Operations

#### 10. Filter Filings (`filter_filings`)
Enhanced filtering with date ranges and form types.

```json
{
  "method": "filter_filings",
  "filings": [...],
  "form_type": "10-Q",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

## 🏗️ Enhanced Architecture

### Multi-Tier API Access Strategy

1. **Primary**: Direct iXBRL document parsing from EDGAR Archives
2. **Secondary**: SEC Submissions API for filing discovery and metadata
3. **Tertiary**: Company Facts API with dimensional inference
4. **Emergency**: Known dimensional structure mapping

### SEC API Compliance

- ✅ **Official Endpoints**: Uses `data.sec.gov` APIs per SEC guidelines
- ✅ **Proper User-Agent**: `SEC-Research-Tool/1.0 (contact@research.org)`
- ✅ **Rate Limiting**: Respects 10 requests/second SEC limit
- ✅ **Error Recovery**: Graceful degradation with meaningful diagnostics

### iXBRL Parser Technology

- **Modern Format Support**: Handles Inline XBRL (HTML-embedded) instead of legacy XML
- **Dimensional Extraction**: Parses `<ix:nonFraction>`, `<ix:fraction>`, and context relationships
- **Business Classification**: Automatically categorizes facts by type and dimensional scope
- **Context Resolution**: Maps XBRL contexts to readable dimensional breakdowns

## 🎯 Real-World Use Cases

### Investment Analysis
```json
{
  "method": "build_fact_table",
  "cik_or_ticker": "AAPL",
  "target_value": 100000000000,
  "tolerance": 10000000000
}
```
*Find all facts around $100B for Apple with dimensional context*

### Competitive Intelligence
```json
{
  "method": "search_facts_by_value",
  "cik_or_ticker": "TSLA",
  "target_value": 20000000000,
  "filters": {
    "concept": "Revenue",
    "dimensions": {"geography": "International"}
  }
}
```
*Analyze Tesla's international revenue performance*

### Regulatory Compliance Monitoring
```json
{
  "method": "get_dimensional_facts",
  "cik_or_ticker": "JPM",
  "search_criteria": {
    "concept": "LoanLossProvision",
    "valueRange": {"min": 1000000000, "max": 5000000000}
  }
}
```
*Monitor JPMorgan's loan loss provisions with risk segmentation*

### Cross-Company Benchmarking
```json
{
  "method": "get_frames_data",
  "taxonomy": "us-gaap",
  "tag": "OperatingIncomeLoss",
  "unit": "USD",
  "frame": "CY2024Q3I"
}
```
*Compare operating income across all companies for Q3 2024*

## 📥 Installation & Setup

### Quick Start with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "sec-edgar": {
      "command": "npx",
      "args": ["@openpharma-org/sec-mcp"]
    }
  }
}
```

### Cursor Integration

Add to your Cursor MCP settings (`mcp.json`):

```json
{
  "servers": {
    "sec-mcp-server": {
      "command": "node",
      "args": ["/path/to/sec-mcp-server/src/index.js"]
    }
  }
}
```

### NPM Installation

```bash
# Global installation
npm install -g @openpharma-org/sec-mcp

# Local installation
npm install @openpharma-org/sec-mcp
```

### From Source

```bash
git clone https://github.com/openpharma-org/sec-mcp.git
cd sec-mcp-server
npm install
npm run build
npm start
```

## 🔧 Development

### Project Structure

```
sec-mcp-server/
├── src/
│   ├── index.js           # MCP server implementation
│   ├── edgar-api.js       # SEC EDGAR API interactions
│   ├── xbrl-parser.js     # iXBRL document parser
│   └── fact-table-builder.js # Business intelligence engine
├── dist/                  # Built files
├── demo-fact-table.js     # Demonstration script
├── package.json
└── README.md
```

### Advanced Configuration

#### Custom User-Agent
```javascript
// For academic research
headers: {
  'User-Agent': 'University-Research/1.0 (research@university.edu)'
}

// For commercial analysis
headers: {
  'User-Agent': 'Financial-Analysis-Tool/1.0 (contact@company.com)'
}
```

#### Rate Limiting
```javascript
// Built-in rate limiting respects SEC guidelines
const rateLimitDelay = 100; // milliseconds between requests
```

### Testing the Implementation

```bash
# Test basic functionality
node demo-fact-table.js

# Test specific company
node -e "
const { buildFactTable } = require('./src/edgar-api.js');
buildFactTable('AAPL', 100000000000, 10000000000).then(console.log);
"
```

## 📊 SEC Filing Reference

### Major Form Types

| Form | Description | Frequency | Key Data |
|------|-------------|-----------|----------|
| **10-K** | Annual Report | Yearly | Complete financials, business overview |
| **10-Q** | Quarterly Report | Quarterly | Unaudited financials, interim updates |
| **8-K** | Current Report | As needed | Material events, acquisitions |
| **DEF 14A** | Proxy Statement | Annually | Executive compensation, voting matters |
| **20-F** | Foreign Annual | Yearly | Non-US company annual report |
| **S-1** | Registration | As needed | IPO registration statement |

### XBRL Taxonomies

#### US-GAAP (us-gaap)
Primary financial concepts:
- `Assets` - Total company assets
- `Liabilities` - Total liabilities  
- `StockholdersEquity` - Shareholders' equity
- `RevenueFromContractWithCustomerExcludingAssessedTax` - Revenue excluding taxes
- `NetIncomeLoss` - Net income or loss
- `OperatingIncomeLoss` - Operating income or loss
- `CashAndCashEquivalents` - Cash and equivalents

#### Dimensional Axes
- `srt:StatementGeographicalAxis` - Geographic segmentation
- `us-gaap:StatementBusinessSegmentsAxis` - Business segment breakdown
- `us-gaap:SubsegmentsAxis` - Product line subsegments
- `us-gaap:StatementEquityComponentsAxis` - Equity components

#### Common Members
- Geography: `us-gaap:UsMember`, `us-gaap:NonUsMember`
- Business: `*:TechnologyMember`, `*:HealthcareMember`, `*:MedTechMember`
- Products: `*:ElectrophysiologyMember`, `*:OrthopedicsMember`

## 🔍 Advanced Query Patterns

### Finding Dimensional Revenue Facts
```json
{
  "method": "get_dimensional_facts",
  "cik_or_ticker": "JNJ",
  "search_criteria": {
    "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
    "dimensions": {
      "us-gaap:StatementBusinessSegmentsAxis": "jnj:MedTechMember",
      "us-gaap:SubsegmentsAxis": "jnj:ElectrophysiologyMember"
    }
  }
}
```

### Building Comprehensive Analysis Tables
```json
{
  "method": "build_fact_table",
  "cik_or_ticker": "PFE",
  "target_value": 15000000000,
  "tolerance": 2000000000,
  "options": {
    "maxRows": 50,
    "sortBy": "value",
    "filters": {
      "concept": "Revenue",
      "formType": "10-Q"
    }
  }
}
```

### Cross-Period Comparison
```json
{
  "method": "search_facts_by_value",
  "cik_or_ticker": "AMZN",
  "target_value": 50000000000,
  "tolerance": 5000000000,
  "filters": {
    "concept": "OperatingIncome"
  }
}
```

## 🛡️ Error Handling & Troubleshooting

### Common Issues

#### SEC Rate Limiting
```
Error: Request failed with status code 429
Solution: Built-in rate limiting handles this automatically
```

#### Invalid CIK/Ticker
```
Error: Could not find CIK for ticker
Solution: Use search_companies to verify ticker symbol
```

#### Missing Filing Data
```
Error: No recent filing found
Solution: Check filing history with get_company_submissions
```

#### EDGAR Archives Access
```
Error: 403 Forbidden
Solution: Automatic fallback to Company Facts API
```

### Diagnostic Commands

```bash
# Test SEC API connectivity
node -e "const {getCompanyCik} = require('./src/edgar-api.js'); getCompanyCik('AAPL').then(console.log);"

# Verify filing access
node -e "const {getCompanySubmissions} = require('./src/edgar-api.js'); getCompanySubmissions('AAPL').then(r => console.log(r.recentFilings.slice(0,3)));"

# Test dimensional parsing
node -e "const {buildFactTable} = require('./src/edgar-api.js'); buildFactTable('AAPL', 100000000000, 10000000000).then(r => console.log(r.summary));"
```

## 🎯 Performance Optimization

### Best Practices

1. **Use CIK instead of ticker** when possible for faster lookups
2. **Cache Company Facts data** for repeated concept queries
3. **Limit fact table rows** with `maxRows` option for large datasets
4. **Use specific accession numbers** to avoid submission lookups
5. **Batch similar requests** to respect rate limits


```javascript
// Built-in performance tracking
console.time('fact-table-build');
const result = await buildFactTable('JNJ', 638000000, 50000000);
console.timeEnd('fact-table-build');
```

## 🔮 Future Enhancements

- **Multi-company Analysis**: Cross-company dimensional comparisons
- **Time Series Analysis**: Historical dimensional fact tracking  
- **Industry Benchmarking**: Sector-specific fact analysis
- **Export Capabilities**: CSV/Excel output for fact tables
- **Custom Taxonomies**: Support for company-specific XBRL extensions

## 🤝 Contributing

### Development Setup

```bash
git clone https://github.com/openpharma-org/sec-mcp.git
cd sec-mcp-server
npm install
npm run build
```

### Testing Enhancements

```bash
# Test new dimensional features
npm test

# Validate SEC API compliance
npm run validate-api

# Test MCP integration
npm run test-mcp
```

### Contribution Guidelines

1. **API Compliance**: Maintain SEC rate limiting and User-Agent requirements
2. **Error Handling**: Implement graceful degradation for API failures
3. **Documentation**: Update README for new features
4. **Testing**: Include test cases for dimensional analysis
5. **Performance**: Consider large dataset implications

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏛️ Acknowledgments

### Technical Achievements

- **Revolutionary Dimensional Analysis**: First MCP server with comprehensive XBRL dimensional fact extraction
- **Multi-API Integration**: Robust fallback mechanisms across SEC endpoints
- **Production-Ready Architecture**: Enterprise-grade error handling and performance optimization
- **SEC Compliance**: Full adherence to SEC data usage guidelines and rate limits

### Key Technologies

- Built on [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- Uses [XBRL standard](https://www.xbrl.org/) for structured financial data
- Implements [Model Context Protocol](https://modelcontextprotocol.io/) specification
- Leverages [Inline XBRL](https://www.xbrl.org/ixbrl/) for modern SEC filings

### Special Recognition

- **SEC EDGAR Team**: For maintaining this invaluable public resource
- **XBRL International**: For developing the XBRL standard
- **MCP Community**: For advancing AI-tool integration protocols
- **User Community**: For driving feature development and testing

## 📞 Support & Community

- 🐛 **Issues**: [GitHub Issues](https://github.com/openpharma-org/sec-mcp/issues)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/openpharma-org/sec-mcp/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/openpharma-org/sec-mcp/discussions)
- 🏛️ **SEC EDGAR**: [Official SEC Resources](https://www.sec.gov/edgar)
- 📊 **XBRL Resources**: [XBRL.org](https://www.xbrl.org/)

---

## 🎯 Breakthrough Achievement

**This MCP server represents a breakthrough in financial data analysis**, providing the first comprehensive dimensional XBRL fact extraction capability in the MCP ecosystem. From simple ticker lookups to complex multi-dimensional business intelligence, this server enables unprecedented analysis of SEC filing data.

**From a simple User-Agent investigation to a complete dimensional analysis platform** - demonstrating the power of persistent problem-solving and architectural excellence! 🚀

---

**⚠️ Important**: This is an unofficial tool. Please respect SEC's data usage guidelines and terms of service. Always verify critical financial data through official SEC sources.