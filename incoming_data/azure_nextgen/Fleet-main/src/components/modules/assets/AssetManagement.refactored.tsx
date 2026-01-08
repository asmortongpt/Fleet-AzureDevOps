import { Plus, MagnifyingGlass } from "@phosphor-icons/react"

import { AssetStatsBar } from "./AssetManagement/components/AssetStatsBar"
import { useAssetFilters } from "./AssetManagement/hooks/useAssetFilters"
import { useAssets } from "./AssetManagement/hooks/useAssets"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"



export function AssetManagement() {
  const { assets, loading } = useAssets()
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredAssets,
    stats
  } = useAssetFilters(assets)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "in_use":
        return "bg-success/10 text-success border-success/20"
      case "maintenance":
        return "bg-warning/10 text-warning border-warning/20"
      case "retired":
      case "disposed":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-primary/10 text-primary border-primary/20"
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-success/10 text-success border-success/20"
      case "good":
        return "bg-primary/10 text-primary border-primary/20"
      case "fair":
        return "bg-warning/10 text-warning border-warning/20"
      case "poor":
      case "needs_repair":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading assets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all organizational assets</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Stats */}
      <AssetStatsBar
        totalAssets={stats.totalAssets}
        activeAssets={stats.activeAssets}
        maintenanceAssets={stats.maintenanceAssets}
        totalValue={stats.totalValue}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag, or serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="vehicle">Vehicles</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{asset.asset_tag}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{asset.asset_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.manufacturer} {asset.model}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.asset_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getConditionColor(asset.condition)}>
                      {asset.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>{asset.location || "N/A"}</TableCell>
                  <TableCell>{asset.assigned_to_name || "Unassigned"}</TableCell>
                  <TableCell>${asset.current_value?.toLocaleString() || "0"}</TableCell>
                </TableRow>
              ))}
              {filteredAssets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No assets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssetManagement
