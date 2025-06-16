
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Code, Book } from 'lucide-react';

const DocumentationGenerator: React.FC = () => {
  const [generatedDocs, setGeneratedDocs] = useState('');

  const documentationSections = [
    {
      id: 'api',
      title: 'API Documentation',
      description: 'Complete API endpoints and usage',
      content: `# API Documentation

## Authentication
All API requests require authentication using JWT tokens.

### Login
\`POST /auth/login\`
- **Body**: \`{ email: string, password: string }\`
- **Response**: \`{ user: User, token: string }\`

### Leads Management
\`GET /api/leads\`
- **Query Parameters**: \`page?, limit?, status?, country?\`
- **Response**: \`{ leads: Lead[], total: number, page: number }\`

\`POST /api/leads\`
- **Body**: \`Lead\` object
- **Response**: \`{ lead: Lead }\`

\`PUT /api/leads/:id\`
- **Body**: Partial \`Lead\` object
- **Response**: \`{ lead: Lead }\`

\`DELETE /api/leads/:id\`
- **Response**: \`{ success: boolean }\`

### Workflow Automation
\`GET /api/workflow-rules\`
- **Response**: \`{ rules: WorkflowRule[] }\`

\`POST /api/workflow-rules\`
- **Body**: \`WorkflowRule\` object
- **Response**: \`{ rule: WorkflowRule }\`

### Analytics
\`GET /api/analytics/dashboard\`
- **Query Parameters**: \`dateRange?: string\`
- **Response**: \`{ stats: DashboardStats }\`

\`GET /api/analytics/reports\`
- **Query Parameters**: \`type?: string, format?: string\`
- **Response**: Report file or data
`
    },
    {
      id: 'user',
      title: 'User Guide',
      description: 'Step-by-step user instructions',
      content: `# User Guide

## Getting Started

### 1. Login
1. Navigate to the login page
2. Enter your email and password
3. Click "Sign In"

### 2. Dashboard Overview
The dashboard provides:
- Lead statistics
- Recent activities
- Performance metrics
- Quick actions

### 3. Managing Leads

#### Adding a New Lead
1. Go to the Leads page
2. Click "Add Lead"
3. Fill in the required information:
   - First Name (required)
   - Last Name (required)
   - Email (required)
   - Phone (optional)
   - Country (required)
4. Click "Save"

#### Bulk Import
1. Click "Import Leads"
2. Download the template
3. Fill in your data
4. Upload the file
5. Review validation results
6. Confirm import

#### Lead Communication
1. Select a lead
2. Click "Contact" 
3. Choose communication method:
   - Email
   - SMS
   - Phone call
4. Log the interaction

### 4. Workflow Automation

#### Setting up Rules
1. Go to Workflow Automation
2. Click "Create Rule"
3. Define conditions
4. Set actions
5. Activate the rule

#### Follow-up Reminders
1. Select a lead
2. Click "Set Reminder"
3. Choose reminder type and date
4. Add notes
5. Assign to team member

### 5. Reports and Analytics

#### Generating Reports
1. Go to Reports page
2. Select report type
3. Choose date range
4. Apply filters
5. Generate and download

#### Dashboard Analytics
- View real-time metrics
- Monitor conversion rates
- Track team performance
- Analyze trends
`
    },
    {
      id: 'technical',
      title: 'Technical Documentation',
      description: 'Architecture and implementation details',
      content: `# Technical Documentation

## Architecture Overview

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Build Tool**: Vite

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Edge Functions**: Deno/TypeScript

### Security
- Row Level Security (RLS) policies
- JWT token authentication
- Data encryption for sensitive fields
- Rate limiting
- Audit logging

## Key Components

### Hooks
- \`useOptimizedLeads\`: Lead management with caching
- \`useWorkflowAutomation\`: Workflow rule execution
- \`usePerformanceMonitor\`: Performance tracking
- \`useAuditLog\`: Security audit logging

### Services
- \`reportService\`: PDF/Excel generation
- \`emailService\`: Email automation
- \`smsService\`: SMS communication

### Database Schema

#### Leads Table
\`\`\`sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  balance DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

#### Workflow Rules Table
\`\`\`sql
CREATE TABLE workflow_rules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## Performance Optimizations

### Frontend
- Lazy loading of routes and components
- Virtual scrolling for large lists
- Memoization with React.memo and useMemo
- Code splitting with dynamic imports
- Image optimization and caching

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- Query optimization
- Caching strategies

### Monitoring
- Real-time performance metrics
- Error tracking and reporting
- User session analytics
- API response time monitoring

## Deployment

### Environment Variables
\`\`\`
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

### Production Build
\`\`\`bash
npm run build
npm run preview
\`\`\`

### Security Checklist
- [ ] All RLS policies enabled
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Data encryption verified
`
    }
  ];

  const generateFullDocumentation = () => {
    const fullDocs = documentationSections
      .map(section => section.content)
      .join('\n\n---\n\n');
    setGeneratedDocs(fullDocs);
  };

  const downloadDocumentation = () => {
    const blob = new Blob([generatedDocs], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plexop-crm-documentation.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Documentation Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive documentation for production deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={generateFullDocumentation} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Documentation
            </Button>
            {generatedDocs && (
              <Button variant="outline" onClick={downloadDocumentation} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Markdown
              </Button>
            )}
          </div>

          <Tabs defaultValue="sections" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sections">Documentation Sections</TabsTrigger>
              <TabsTrigger value="preview">Generated Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4">
              {documentationSections.map(section => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      {section.title}
                      <Badge variant="outline">Ready</Badge>
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      Covers: API endpoints, user workflows, technical architecture, deployment guides
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedDocs ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Documentation Preview</CardTitle>
                    <CardDescription>
                      Complete documentation ready for production
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={generatedDocs}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Click "Generate Documentation" to create the complete documentation
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentationGenerator;
