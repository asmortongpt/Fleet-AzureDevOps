/**
 * Error Handling Example Component
 *
 * Demonstrates all error handling patterns in the application:
 * - Query error boundaries
 * - Loading skeletons
 * - Inline error displays
 * - Toast notifications
 * - Retry functionality
 */

import React, { useState } from 'react';
import { QueryErrorBoundary, QueryErrorDisplay, InlineQueryError } from '@/components/errors/QueryErrorBoundary';
import {
  SkeletonTable,
  SkeletonCard,
  SkeletonDashboard,
  SkeletonList,
  Skeleton,
} from '@/components/skeletons/SkeletonComponents';
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from '@/hooks/useDataQueriesEnhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Info } from 'lucide-react';

import logger from '@/utils/logger';
/**
 * Example 1: Basic Query with Error Handling and Loading State
 */
const BasicQueryExample: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useVehicles();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={3} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryErrorDisplay error={error as Error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicles ({data?.length || 0})</CardTitle>
        <CardDescription>Successfully loaded vehicle data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.map((vehicle: any) => (
            <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                <div className="text-sm text-muted-foreground">{vehicle.vin}</div>
              </div>
              <Badge>{vehicle.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Example 2: Mutation with Toast Notifications
 */
const MutationExample: React.FC = () => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
  });

  const createVehicle = useCreateVehicle({
    // Toast notifications are automatic
    onSuccess: (data) => {
      logger.debug('Vehicle created:', data);
      // Reset form
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVehicle.mutate(formData as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Vehicle (Mutation Example)</CardTitle>
        <CardDescription>
          Demonstrates automatic toast notifications on success/error
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Make</label>
            <input
              type="text"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">VIN</label>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={createVehicle.isPending}
            className="w-full"
          >
            {createVehicle.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Vehicle'
            )}
          </Button>

          {createVehicle.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(createVehicle.error as Error)?.message || 'Failed to create vehicle'}
              </AlertDescription>
            </Alert>
          )}

          {createVehicle.isSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Vehicle created successfully!
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

/**
 * Example 3: Error Boundary Protection
 */
const ErrorBoundaryExample: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);

  // Component that throws error
  const ErrorComponent = () => {
    if (shouldError) {
      throw new Error('Intentional error for demonstration');
    }
    return <div>This component is working normally</div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Boundary Example</CardTitle>
        <CardDescription>
          Protected component with error boundary
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setShouldError(!shouldError)}
          variant={shouldError ? 'destructive' : 'default'}
        >
          {shouldError ? 'Reset Error' : 'Trigger Error'}
        </Button>

        <QueryErrorBoundary>
          <ErrorComponent />
        </QueryErrorBoundary>
      </CardContent>
    </Card>
  );
};

/**
 * Example 4: Different Loading States
 */
const LoadingStatesExample: React.FC = () => {
  const [loadingType, setLoadingType] = useState<'table' | 'card' | 'list' | 'dashboard'>('table');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading State Examples</CardTitle>
        <CardDescription>
          Various skeleton loader patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={loadingType === 'table' ? 'default' : 'outline'}
              onClick={() => setLoadingType('table')}
              size="sm"
            >
              Table
            </Button>
            <Button
              variant={loadingType === 'card' ? 'default' : 'outline'}
              onClick={() => setLoadingType('card')}
              size="sm"
            >
              Card
            </Button>
            <Button
              variant={loadingType === 'list' ? 'default' : 'outline'}
              onClick={() => setLoadingType('list')}
              size="sm"
            >
              List
            </Button>
            <Button
              variant={loadingType === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setLoadingType('dashboard')}
              size="sm"
            >
              Dashboard
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            {loadingType === 'table' && <SkeletonTable rows={3} />}
            {loadingType === 'card' && <SkeletonCard />}
            {loadingType === 'list' && <SkeletonList items={3} />}
            {loadingType === 'dashboard' && <SkeletonDashboard />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Example Component
 */
export const ErrorHandlingExample: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Error Handling Examples</h1>
        <p className="text-muted-foreground">
          Comprehensive examples of error handling, loading states, and user feedback
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Production-Grade Error Handling</AlertTitle>
        <AlertDescription>
          All examples demonstrate automatic error handling with:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>User-friendly error messages</li>
            <li>Toast notifications for mutations</li>
            <li>Automatic retry logic for network errors</li>
            <li>Loading skeletons for better UX</li>
            <li>Error boundaries for crash protection</li>
            <li>Error logging and reporting</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="query" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="mutation">Mutation</TabsTrigger>
          <TabsTrigger value="boundary">Error Boundary</TabsTrigger>
          <TabsTrigger value="loading">Loading States</TabsTrigger>
        </TabsList>

        <TabsContent value="query">
          <BasicQueryExample />
        </TabsContent>

        <TabsContent value="mutation">
          <MutationExample />
        </TabsContent>

        <TabsContent value="boundary">
          <ErrorBoundaryExample />
        </TabsContent>

        <TabsContent value="loading">
          <LoadingStatesExample />
        </TabsContent>
      </Tabs>

      {/* Best Practices Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">For Queries:</h4>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>✓ Always show loading skeletons</li>
                <li>✓ Display errors inline with retry option</li>
                <li>✓ Use error boundaries for protection</li>
                <li>✓ Set appropriate staleTime</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">For Mutations:</h4>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>✓ Show toast on success/error</li>
                <li>✓ Disable buttons while pending</li>
                <li>✓ Show loading spinners</li>
                <li>✓ Invalidate related queries on success</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandlingExample;
