
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, Code, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const APIEndpoints: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const baseUrl = 'https://zknyyltinlagwkbbedrx.supabase.co/functions/v1';
  
  const endpoints = [
    {
      method: 'GET',
      path: '/api/leads',
      description: 'Get all leads',
      params: '?page=1&limit=10&status=active'
    },
    {
      method: 'POST',
      path: '/api/leads',
      description: 'Create a new lead',
      body: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        country: 'US'
      }
    },
    {
      method: 'GET',
      path: '/api/leads/{id}',
      description: 'Get a specific lead',
      params: ''
    },
    {
      method: 'PUT',
      path: '/api/leads/{id}',
      description: 'Update a lead',
      body: {
        status: 'active',
        balance: 1000
      }
    },
    {
      method: 'POST',
      path: '/api/communications',
      description: 'Send communication',
      body: {
        lead_id: 'uuid',
        type: 'email',
        subject: 'Welcome',
        content: 'Welcome to our platform!'
      }
    },
    {
      method: 'GET',
      path: '/api/analytics',
      description: 'Get analytics data',
      params: '?period=30d&metrics=leads,conversions'
    }
  ];

  const generateApiKey = () => {
    const key = 'api_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(key);
    toast({
      title: "API Key Generated",
      description: "New API key has been generated. Make sure to save it securely.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard.",
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authentication">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="authentication" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  API Key Management
                </h3>
                
                <div className="flex gap-2">
                  <Input
                    value={apiKey}
                    placeholder="Generate an API key"
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={generateApiKey}>
                    Generate Key
                  </Button>
                  {apiKey && (
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">Authentication</h4>
                  <p className="text-blue-700 text-sm mb-2">
                    Include your API key in the request headers:
                  </p>
                  <code className="block bg-blue-100 p-2 rounded text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="endpoints" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Endpoints</h3>
                
                {endpoints.map((endpoint, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">
                            {baseUrl}{endpoint.path}
                          </code>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-sm">{endpoint.description}</p>
                      {endpoint.params && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Parameters: </span>
                          <code className="text-xs bg-gray-100 px-1 rounded">{endpoint.params}</code>
                        </div>
                      )}
                      {endpoint.body && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Request Body: </span>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(endpoint.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Code Examples
                </h3>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">JavaScript/Fetch</h4>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`// Get all leads
fetch('${baseUrl}/api/leads', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Create a new lead
fetch('${baseUrl}/api/leads', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    country: 'US'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                    </pre>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Python/Requests</h4>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`import requests

# Get all leads
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('${baseUrl}/api/leads', headers=headers)
data = response.json()
print(data)

# Create a new lead
lead_data = {
    'first_name': 'John',
    'last_name': 'Doe',
    'email': 'john@example.com',
    'country': 'US'
}

response = requests.post('${baseUrl}/api/leads', 
                        headers=headers, 
                        json=lead_data)
data = response.json()
print(data)`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIEndpoints;
