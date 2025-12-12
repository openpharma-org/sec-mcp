# Unofficial SEC EDGAR MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to the U.S. Securities and Exchange Commission's EDGAR (Electronic Data Gathering, Analysis, and Retrieval) system. This server enables AI assistants and applications to search, retrieve, and analyze public company filings, financial statements, and **dimensional XBRL data** from the SEC's database.

## 🚀 Key Features

- 🏢 **Company Discovery**: Find companies by name or ticker with real-time SEC data
- 📋 **Complete Filing Access**: Full company submission histories and document details  
- 📊 **Advanced XBRL Analysis**: Extract dimensional financial facts with geographic/segment breakdowns
- 🔍 **Intelligent Fact Search**: Find specific financial values with dimensional context
- 📈 **Business Intelligence**: Automated fact classification and table generation
- 🌐 **Multi-API Integration**: Robust fallback mechanisms across SEC endpoints
- ⚡ **Real-time Data**: Direct access to SEC's live EDGAR database
- 🔌 **MCP Compatible**: Works seamlessly with Cursor, Claude Desktop, and other MCP clients

## 🌍 European Filings - Sister Project

Looking for **European company financial data**? Check out our companion server:

**[EU Filings MCP Server](https://github.com/openpharma-org/eu-filings-mcp-server)** - Access financial filings from 27+ EU countries via ESEF (European Single Electronic Format)

**Key Features**:
- 🌍 Pan-European coverage (France, Germany, Italy, Spain, Netherlands, UK, Denmark, Switzerland, and more)
- 📊 IFRS XBRL data extraction with dimensional analysis
- 🔍 Company search by name or LEI (Legal Entity Identifier)
- 📈 Advanced features: fact tables, time-series analysis, dimensional facts
- 23,000+ filings accessible via filings.xbrl.org free API

**98% feature parity** with this SEC server, optimized for European regulatory frameworks.

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
Extract facts with complete dimensional context from XBRL instance documents.

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
Find financial facts around specific target values with filters.

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
Generate comprehensive dimensional fact tables with business intelligence.

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

## 🎯 Performance Optimization

### Best Practices

1. **Use CIK instead of ticker** when possible for faster lookups
2. **Cache Company Facts data** for repeated concept queries
3. **Limit fact table rows** with `maxRows` option for large datasets
4. **Use specific accession numbers** to avoid submission lookups
5. **Batch similar requests** to respect rate limits

## Resources

- 🏛️ **SEC EDGAR**: [Official SEC Resources](https://www.sec.gov/edgar)
- 📊 **XBRL Resources**: [XBRL.org](https://www.xbrl.org/)

---

**⚠️ Important**: This is an unofficial tool. Please respect SEC's data usage guidelines and terms of service. Always verify critical financial data through official SEC sources.