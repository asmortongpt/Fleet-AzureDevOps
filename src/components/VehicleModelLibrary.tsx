/**
 * Vehicle Model Library Component
 * Browse, search, and manage 3D vehicle models
 */

import {
  Search,
  Upload,
  Download,
  Star,
  Eye,
  Box,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getVehicleModelsService, type Vehicle3DModel } from '@/services/vehicle-models';
import logger from '@/utils/logger';
interface VehicleModelLibraryProps {
  onSelectModel?: (model: Vehicle3DModel) => void;
  selectedModelId?: string;
  vehicleId?: string;
  showUpload?: boolean;
  showSelection?: boolean;
}

export function VehicleModelLibrary({
  onSelectModel,
  selectedModelId,
  vehicleId,
  showUpload = true,
  showSelection = false,
}: VehicleModelLibraryProps) {
  const [models, setModels] = useState<Vehicle3DModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [vehicleType, setVehicleType] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [quality, setQuality] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 24;

  const service = useMemo(() => getVehicleModelsService(), []);

  // Load models
  useEffect(() => {
    loadModels();
  }, [searchQuery, vehicleType, make, source, quality, page, activeTab]);

  const loadModels = async () => {
    try {
      setLoading(true);

      let result;
      if (activeTab === 'featured') {
        const featuredModels = await service.getFeaturedModels(limit);
        result = { models: featuredModels, total: featuredModels.length, limit, offset: 0 };
      } else if (activeTab === 'popular') {
        const popularModels = await service.getPopularModels(limit);
        result = { models: popularModels, total: popularModels.length, limit, offset: 0 };
      } else {
        result = await service.getModels({
          search: searchQuery || undefined,
          vehicleType: vehicleType || undefined,
          make: make || undefined,
          source: source || undefined,
          quality: quality || undefined,
          limit,
          offset: page * limit,
        });
      }

      setModels(result.models);
      setTotal(result.total);
    } catch (error) {
      logger.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadModels();
  };

  const handleSelectModel = (model: Vehicle3DModel) => {
    if (onSelectModel) {
      onSelectModel(model);
    }
  };

  const handleDownload = async (model: Vehicle3DModel, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await service.downloadModel(model.id, `${model.name}.${model.fileFormat}`);
    } catch (error) {
      logger.error('Download error:', error);
      alert('Failed to download model');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">3D Model Library</h2>
          <p className="text-muted-foreground">
            Browse and manage vehicle 3D models from multiple sources
          </p>
        </div>

        <div className="flex gap-2">
          {showUpload && (
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Model
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by make, model, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="coupe">Coupe</SelectItem>
                  <SelectItem value="convertible">Convertible</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="text"
                placeholder="Make (e.g., Toyota)"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />

              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sources</SelectItem>
                  <SelectItem value="sketchfab">Sketchfab</SelectItem>
                  <SelectItem value="azure-blob">Azure Storage</SelectItem>
                  <SelectItem value="car3d">Car3D.net</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Qualities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Models ({total})</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : models.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Box className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No models found</p>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid/List View */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }
              >
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    viewMode={viewMode}
                    isSelected={model.id === selectedModelId}
                    showSelection={showSelection}
                    onSelect={() => handleSelectModel(model)}
                    onDownload={(e) => handleDownload(model, e)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Model Card Component
interface ModelCardProps {
  model: Vehicle3DModel;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  showSelection: boolean;
  onSelect: () => void;
  onDownload: (e: React.MouseEvent) => void;
}

function ModelCard({
  model,
  viewMode,
  isSelected,
  showSelection,
  onSelect,
  onDownload,
}: ModelCardProps) {
  if (viewMode === 'list') {
    return (
      <Card
        className={`cursor-pointer hover:shadow-lg transition-shadow ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {model.thumbnailUrl ? (
                <img
                  src={model.thumbnailUrl}
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Box className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{model.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {[model.make, model.model, model.year].filter(Boolean).join(' ')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{model.source}</Badge>
                {model.qualityTier && (
                  <Badge variant="outline">{model.qualityTier}</Badge>
                )}
                {model.isFeatured && (
                  <Badge variant="default">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {model.viewCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {model.downloadCount || 0}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {showSelection && isSelected && (
              <div className="ml-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow overflow-hidden ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted overflow-hidden relative group">
        {model.thumbnailUrl ? (
          <img
            src={model.thumbnailUrl}
            alt={model.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {showSelection && isSelected && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        )}

        {model.isFeatured && (
          <div className="absolute top-2 left-2">
            <Badge variant="default">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold truncate" title={model.name}>
          {model.name}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {[model.make, model.model, model.year].filter(Boolean).join(' ') || 'No details'}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">
            {model.source}
          </Badge>
          {model.qualityTier && (
            <Badge variant="outline" className="text-xs">
              {model.qualityTier}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {model.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {model.downloadCount || 0}
            </span>
          </div>

          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default VehicleModelLibrary;
