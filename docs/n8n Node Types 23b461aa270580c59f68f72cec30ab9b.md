# n8n Node Types

<aside>
ℹ️

More Details at

[n8n_detailed_nodes.md](n8n_detailed_nodes.md)

</aside>

## Trigger Nodes

Nodes that start workflow execution based on events or schedules:

- **Manual Trigger** - Manually start workflows
- **Webhook** - Trigger via HTTP requests
- **Schedule Trigger** - Time-based triggers (cron jobs)
- **Email Trigger (IMAP)** - Trigger on new emails
- **File Trigger** - Monitor file system changes
- **Form Trigger** - Create web forms that trigger workflows
- **Chat Trigger** - Trigger from chat platforms
- **RSS Feed Trigger** - Monitor RSS feeds for new items
- **Interval** - Execute at regular intervals
- **Start** - Simple manual start trigger
- **Error Trigger** - Trigger workflows based on error conditions
- **Event-driven Triggers** - Advanced triggers for specific events

## Control Flow Nodes

Nodes that control workflow execution logic:

- **IF** - Conditional branching
- **Switch** - Multiple condition branching
- **Merge** - Combine multiple data streams
- **Wait** - Pause workflow execution
- **Stop and Error** - Halt execution with error
- **No Operation** - Pass-through node (for organization)
- **Execute Workflow** - Call other workflows
- **Split In Batches** - Process data in chunks
- **Loop Over Items** - Iterate through data items

## Data Transformation Nodes

Nodes for manipulating and transforming data:

- **Set** - Modify or add data fields
- **Code** - Execute JavaScript/Python code
- **Function** - JavaScript function execution
- **Function Item** - Process individual items with JS
- **JSON** - Parse and manipulate JSON data
- **XML** - Parse and manipulate XML data
- **HTML Extract** - Extract data from HTML
- **Crypto** - Cryptographic operations
- **DateTime** - Date and time operations
- **Math** - Mathematical calculations
- **Text** - String manipulation operations
- **Rename Keys** - Rename object properties
- **AI Transform** - Generate code snippets using AI (Cloud plans only)

## AI and Machine Learning Nodes

Advanced AI-powered nodes for intelligent automation:

- **AI Agent** - Build AI-powered applications and agents
- **Tools Agent** - AI agent with tool-calling capabilities
- **LangChain Integration** - Connect with LangChain framework
- **Claude** - Anthropic's Claude AI model integration
- **Gemini** - Google's Gemini AI model
- **Groq** - Groq AI model integration
- **Vertex AI** - Google Cloud Vertex AI models
- **External Vector Stores** - Integration with vector databases
- **OpenAI** - ChatGPT and other OpenAI models
- **Hugging Face** - Access to Hugging Face models

## Input/Output (I/O) Nodes

Nodes for reading from and writing to external sources:

### File Operations

- **Read Binary File** - Read files as binary data
- **Write Binary File** - Write binary data to files
- **Read PDF** - Extract text from PDF files
- **Read Excel** - Read Excel spreadsheets
- **Write Excel** - Create Excel files
- **CSV** - Read/write CSV files

### Database Nodes

- **MySQL** - MySQL database operations
- **PostgreSQL** - PostgreSQL database operations
- **MongoDB** - MongoDB operations
- **Redis** - Redis key-value store
- **SQLite** - SQLite database operations
- **Microsoft SQL Server** - SQL Server operations
- **Oracle DB** - Oracle database operations
- **Execute Query** - Generic SQL query execution

### HTTP/API Nodes

- **HTTP Request** - Make HTTP/REST API calls
- **GraphQL** - Execute GraphQL queries
- **Webhook** - Receive HTTP requests
- **Response** - Send HTTP responses

## Communication Nodes

Nodes for messaging and notifications:

### Email

- **Email Send (SMTP)** - Send emails via SMTP
- **Gmail** - Gmail integration
- **Outlook** - Microsoft Outlook integration
- **Email Read (IMAP)** - Read emails via IMAP

### Messaging Platforms

- **Slack** - Slack integration
- **Discord** - Discord bot operations
- **Telegram** - Telegram bot integration
- **Microsoft Teams** - Teams integration
- **WhatsApp** - WhatsApp Business API
- **SMS** - Send SMS messages
- **Twilio** - Twilio communication services

### Social Media

- **Twitter** - Twitter API integration
- **Facebook** - Facebook Graph API
- **LinkedIn** - LinkedIn API operations
- **Instagram** - Instagram integration

## Cloud Services Nodes

Nodes for cloud platform integrations:

### Storage Services

- **Google Drive** - Google Drive operations
- **Dropbox** - Dropbox file operations
- **OneDrive** - Microsoft OneDrive
- **Amazon S3** - AWS S3 storage
- **Box** - Box cloud storage
- **FTP** - FTP file operations
- **SFTP** - Secure FTP operations

### Productivity Suites

- **Google Sheets** - Google Sheets operations
- **Google Docs** - Google Docs integration
- **Microsoft Excel** - Excel Online operations
- **Notion** - Notion workspace integration
- **Airtable** - Airtable database operations

### Cloud Platforms

- **AWS** - Various AWS services
- **Google Cloud** - Google Cloud Platform services
- **Azure** - Microsoft Azure services
- **DigitalOcean** - DigitalOcean API

## CRM and Business Tools

Nodes for customer relationship management and business operations:

- **Salesforce** - Salesforce CRM integration
- **HubSpot** - HubSpot CRM and marketing
- **Pipedrive** - Pipedrive CRM operations
- **Zoho CRM** - Zoho CRM integration
- [**Monday.com**](http://monday.com/) - [Monday.com](http://monday.com/) project management
- **Trello** - Trello board operations
- **Asana** - Asana task management
- **Jira** - Jira issue tracking
- **ServiceNow** - ServiceNow platform integration

## E-commerce Nodes

Nodes for online store and payment integrations:

- **Shopify** - Shopify store operations
- **WooCommerce** - WooCommerce integration
- **Stripe** - Stripe payment processing
- **PayPal** - PayPal payment operations
- **Square** - Square POS and payments
- **Magento** - Magento e-commerce platform

## Analytics and Monitoring

Nodes for data analysis and system monitoring:

- **Google Analytics** - GA data retrieval
- **Mixpanel** - Mixpanel analytics
- **Segment** - Segment customer data platform
- **Grafana** - Grafana monitoring
- **Elasticsearch** - Elasticsearch operations
- **Splunk** - Splunk data platform

## Development and DevOps

Nodes for software development workflows:

- **GitHub** - GitHub repository operations
- **GitLab** - GitLab integration
- **Docker** - Docker container operations
- **Jenkins** - Jenkins CI/CD integration
- **Kubernetes** - Kubernetes cluster operations
- **SSH** - SSH command execution

## Utility Nodes

General utility and helper nodes:

- **Date & Time** - Date/time formatting and calculations
- **Crypto** - Encryption and hashing operations
- **QR Code** - Generate and read QR codes
- **Barcode** - Generate and read barcodes
- **PDF** - PDF generation and manipulation
- **Image** - Image processing operations
- **Compress** - File compression operations
- **Convert** - Data format conversions

## Specialized Integration Nodes

Nodes for specific service integrations:

- **Zapier** - Zapier webhook integration
- **IFTTT** - IFTTT service integration
- **Microsoft Power Automate** - Power Automate integration
- **Integromat/Make** - Make platform integration

## Custom and Community Nodes

- **Custom Nodes** - User-created nodes
- **Community Packages** - Third-party node packages (2,515+ available as of July 2025)
- **n8n Community Nodes** - Extended functionality from community
- **Popular Community Nodes** - Top 100 most downloaded community nodes available

---