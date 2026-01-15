import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigData {
  system: {
    lowImpact: { maxConnections: number };
    mediumImpact: { sessionTimeout: number };
    highImpact: { rateLimit: number };
    critical: { maintenanceMode: boolean };
  };
  users: { roles: string[]; inviteOnly: boolean };
  integrations: { apiKey: string; webhookUrl: string };
}

interface ConfigDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

const fetchConfig = async (): Promise<ConfigData> => {
  const response = await fetch('/api/admin/config');
  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
};

const saveConfig = async (data: ConfigData): Promise<ConfigData> => {
  const response = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save config');
  return response.json();
};

const AdminControl: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(['config'], fetchConfig, {
    staleTime: 60000,
  });
  const mutation = useMutation(saveConfig, {
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['config']);
      const previousData = queryClient.getQueryData(['config']);
      queryClient.setQueryData(['config'], newData);
      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['config'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['config']);
    },
  });

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<ConfigData>({
    defaultValues: data || {
      system: {
        lowImpact: { maxConnections: 100 },
        mediumImpact: { sessionTimeout: 30 },
        highImpact: { rateLimit: 1000 },
        critical: { maintenanceMode: false },
      },
      users: { roles: [], inviteOnly: false },
      integrations: { apiKey: '', webhookUrl: '' },
    },
  });

  const [confirmText, setConfirmText] = useState('');
  const [diff, setDiff] = useState<ConfigDiff[]>([]);

  const calculateDiff = useMemo(() => {
    if (!data || !isDirty) return [];
    const current = control._formValues as ConfigData;
    const changes: ConfigDiff[] = [];
    Object.entries(current).forEach(([section, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        const original = (data as any)[section][key];
        if (JSON.stringify(original) !== JSON.stringify(value)) {
          changes.push({ field: `${section}.${key}`, oldValue: original, newValue: value });
        }
      });
    });
    return changes;
  }, [data, control._formValues, isDirty]);

  const onSubmit = (formData: ConfigData) => {
    setDiff(calculateDiff);
    if (calculateDiff.some(d => d.field.includes('critical')) && confirmText !== 'CONFIRM') {
      return;
    }
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="flex justify-center p-6">Loading configuration...</div>;
  if (error) return <div className="text-red-600 p-6">Error: {(error as Error).message}</div>;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Admin Control Center</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {mutation.isError ? (
              <>
                <AlertCircle className="text-red-500" />
                <span className="text-red-500">Configuration save failed</span>
              </>
            ) : mutation.isSuccess ? (
              <>
                <CheckCircle className="text-green-500" />
                <span className="text-green-500">Configuration updated successfully</span>
              </>
            ) : (
              <>
                <CheckCircle className="text-green-500" />
                <span className="text-green-500">System configuration is healthy</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system">System Config</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Low Impact Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxConnections">Max Connections</Label>
                    <Controller
                      name="system.lowImpact.maxConnections"
                      control={control}
                      rules={{ min: { value: 1, message: 'Must be at least 1' } }}
                      render={({ field }) => (
                        <Input
                          id="maxConnections"
                          type="number"
                          {...field}
                          className={cn(errors.system?.lowImpact?.maxConnections && 'border-red-500')}
                        />
                      )}
                    />
                    {errors.system?.lowImpact?.maxConnections && (
                      <p className="text-red-500 text-sm">{errors.system.lowImpact.maxConnections.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medium Impact Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Controller
                      name="system.mediumImpact.sessionTimeout"
                      control={control}
                      rules={{ min: { value: 1, message: 'Must be at least 1 minute' } }}
                      render={({ field }) => (
                        <Input
                          id="sessionTimeout"
                          type="number"
                          {...field}
                          className={cn(errors.system?.mediumImpact?.sessionTimeout && 'border-red-500')}
                        />
                      )}
                    />
                    {errors.system?.mediumImpact?.sessionTimeout && (
                      <p className="text-red-500 text-sm">{errors.system.mediumImpact.sessionTimeout.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High Impact Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rateLimit">Rate Limit (req/min)</Label>
                    <Controller
                      name="system.highImpact.rateLimit"
                      control={control}
                      rules={{ min: { value: 100, message: 'Must be at least 100' } }}
                      render={({ field }) => (
                        <Input
                          id="rateLimit"
                          type="number"
                          {...field}
                          className={cn(errors.system?.highImpact?.rateLimit && 'border-red-500')}
                        />
                      )}
                    />
                    {errors.system?.highImpact?.rateLimit && (
                      <p className="text-red-500 text-sm">{errors.system.highImpact.rateLimit.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inviteOnly">Invite Only Mode</Label>
                    <Controller
                      name="users.inviteOnly"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="inviteOnly"
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrations Control Plane</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Controller
                      name="integrations.apiKey"
                      control={control}
                      rules={{ required: 'API Key is required' }}
                      render={({ field }) => (
                        <Input
                          id="apiKey"
                          type="password"
                          {...field}
                          className={cn(errors.integrations?.apiKey && 'border-red-500')}
                        />
                      )}
                    />
                    {errors.integrations?.apiKey && (
                      <p className="text-red-500 text-sm">{errors.integrations.apiKey.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Controller
                      name="integrations.webhookUrl"
                      control={control}
                      rules={{ pattern: { value: /^https?:\/\//, message: 'Must be a valid URL' } }}
                      render={({ field }) => (
                        <Input
                          id="webhookUrl"
                          {...field}
                          className={cn(errors.integrations?.webhookUrl && 'border-red-500')}
                        />
                      )}
                    />
                    {errors.integrations?.webhookUrl && (
                      <p className="text-red-500 text-sm">{errors.integrations.webhookUrl.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle /> Danger Zone - Critical Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <Controller
                      name="system.critical.maintenanceMode"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="maintenanceMode"
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="border-red-500"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="confirmText">Type "CONFIRM" to proceed with critical changes</Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={!calculateDiff.some(d => d.field.includes('critical'))}
                    className="border-red-500"
                  />
                  {calculateDiff.some(d => d.field.includes('critical')) && confirmText !== 'CONFIRM' && (
                    <p className="text-red-500 text-sm mt-1">You must type CONFIRM to proceed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isDirty && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Configuration Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {calculateDiff.map((change) => (
                  <li key={change.field} className="text-sm">
                    <strong>{change.field}</strong>: {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => control.reset(data)}>
                  Discard Changes
                </Button>
                <Button type="submit" disabled={mutation.isLoading || (calculateDiff.some(d => d.field.includes('critical')) && confirmText !== 'CONFIRM')}>
                  {mutation.isLoading ? 'Saving...' : 'Apply Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

export default AdminControl;