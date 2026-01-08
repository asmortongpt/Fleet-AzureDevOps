import { Loader2, Save, RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminConfig() {
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to env vars
      const response = await fetch('/api/admin/config').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        setConfigs(data);
      } else {
        // Fallback: show common configurable items
        setConfigs({
          // Security
          'VITE_AZURE_AD_CLIENT_ID': import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
          'VITE_AZURE_AD_TENANT_ID': import.meta.env.VITE_AZURE_AD_TENANT_ID || '',
          // AI Services
          'VITE_GROK_API_KEY': import.meta.env.VITE_GROK_API_KEY || '',
          'VITE_ANTHROPIC_API_KEY': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'VITE_OPENAI_API_KEY': import.meta.env.VITE_OPENAI_API_KEY || '',
          // Maps
          'VITE_GOOGLE_MAPS_API_KEY': import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          // Feature Flags
          'VITE_ENABLE_AI_FEATURES': import.meta.env.VITE_ENABLE_AI_FEATURES || 'true',
          'VITE_ENABLE_ADVANCED_ANALYTICS': import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS || 'true',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const configCategories = {
    security: ['AZURE_AD', 'AUTH', 'JWT', 'SECRET'],
    ai: ['GROK', 'ANTHROPIC', 'CLAUDE', 'OPENAI', 'GEMINI'],
    maps: ['GOOGLE_MAPS', 'MAPBOX'],
    features: ['ENABLE_', 'FEATURE_'],
    performance: ['CACHE', 'TIMEOUT', 'LIMIT'],
  };

  const categorizeConfig = (key: string): string => {
    for (const [category, keywords] of Object.entries(configCategories)) {
      if (keywords.some(k => key.toUpperCase().includes(k))) {
        return category;
      }
    }
    return 'other';
  };

  const groupedConfigs = Object.entries(configs).reduce((acc, [key, value]) => {
    const category = categorizeConfig(key);
    if (!acc[category]) acc[category] = {};
    acc[category][key] = value;
    return acc;
  }, {} as Record<string, Record<string, any>>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Manage all configurable settings for Fleet
        </p>
      </div>

      {message && (
        <Alert className={`mb-4 ${message.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          {Object.keys(groupedConfigs).map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{category} Settings</CardTitle>
                <CardDescription>
                  Configure {category}-related settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryConfigs).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {key.replace(/^VITE_/, '').replace(/_/g, ' ')}
                      </Label>
                      <Input
                        id={key}
                        type={key.includes('KEY') || key.includes('SECRET') ? 'password' : 'text'}
                        value={value || ''}
                        onChange={(e) => setConfigs({...configs, [key]: e.target.value})}
                        placeholder={`Enter ${key}`}
                        className="font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
        <Button variant="outline" onClick={fetchConfigs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
