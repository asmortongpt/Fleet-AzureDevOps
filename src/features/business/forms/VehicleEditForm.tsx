import {
  DirectionsCar,
  LocalGasStation,
  Build,
  Speed,
  Info,
  Battery4Bar
} from '@mui/icons-material';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Stack,
  Autocomplete,
  Slider,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { Vehicle } from '@/core/multi-tenant/contexts/FleetDataContext';

interface VehicleEditFormProps {
  vehicle: Vehicle;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

const departmentOptions = [
  'Police Department',
  'Fire Department',
  'Public Works',
  'Parks & Recreation',
  'Administration',
  'Emergency Services',
  'Transportation',
  'Utilities'
];

const statusOptions = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'maintenance', label: 'Maintenance', color: 'warning' },
  { value: 'out_of_service', label: 'Out of Service', color: 'error' },
  { value: 'reserved', label: 'Reserved', color: 'info' },
  { value: 'idle', label: 'Idle', color: 'default' }
] as const;

const ownershipOptions = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' }
];

const availableFeatures = [
  'GPS Tracking',
  'Backup Camera',
  'Dash Camera',
  'Emergency Lights',
  'Two-Way Radio',
  'Mobile Data Terminal',
  'Air Conditioning',
  'Automatic Transmission',
  'All-Wheel Drive',
  'Hybrid Engine',
  'Electric Vehicle',
  'Wheelchair Accessible',
  'Cargo Barriers',
  'Emergency Equipment Storage'
];

export const VehicleEditForm: React.FC<VehicleEditFormProps> = ({
  vehicle,
  onSave,
  onCancel
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<Vehicle>(vehicle);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(vehicle);
  }, [vehicle]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: Vehicle) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev: Vehicle) => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof Vehicle] as any,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required';
    }
    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }
    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN is required';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onSave(formData);
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formData.features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f: string) => f !== feature)
      : [...currentFeatures, feature];

    handleChange('features', newFeatures);
  };

  const selectedStatus = statusOptions.find(option => option.value === formData.status);

  return (
    <Box sx={{ maxHeight: '80vh', overflow: 'auto' }}>
      {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid size={12}>
          <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <DirectionsCar color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Basic Information
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Plate Number"
                    value={formData.plateNumber}
                    onChange={(e) => handleChange('plateNumber', e.target.value)}
                    error={!!errors.plateNumber}
                    helperText={errors.plateNumber}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="VIN"
                    value={formData.vin}
                    onChange={(e) => handleChange('vin', e.target.value)}
                    error={!!errors.vin}
                    helperText={errors.vin}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Make"
                    value={formData.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    error={!!errors.make}
                    helperText={errors.make}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    error={!!errors.model}
                    helperText={errors.model}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleChange('year', parseInt(e.target.value))}
                    error={!!errors.year}
                    helperText={errors.year}
                    variant="outlined"
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Status and Assignment */}
        <Grid size={12}>
          <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Info color="secondary" />
                <Typography variant="h6" fontWeight={600}>
                  Status & Assignment
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleChange('status', e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label={option.label}
                              color={option.color as any}
                              variant="outlined"
                            />
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    options={departmentOptions}
                    value={formData.department}
                    onChange={(_, newValue) => handleChange('department', newValue || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Department"
                        error={!!errors.department}
                        helperText={errors.department}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Ownership</InputLabel>
                    <Select
                      value={formData.ownership}
                      label="Ownership"
                      onChange={(e) => handleChange('ownership', e.target.value)}
                    >
                      {ownershipOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Assigned Driver"
                    value={formData.driver || ''}
                    onChange={(e) => handleChange('driver', e.target.value)}
                    variant="outlined"
                    placeholder="Enter driver name"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Current Mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleChange('mileage', parseInt(e.target.value) || 0)}
                    variant="outlined"
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">miles</Typography>
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Fuel and Battery Information */}
        <Grid size={12}>
          <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.success.main, 0.02) }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <LocalGasStation color="success" />
                <Typography variant="h6" fontWeight={600}>
                  Fuel & Energy
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography gutterBottom variant="subtitle2" fontWeight={600}>
                    Fuel Level: {formData.fuel.level}%
                  </Typography>
                  <Slider
                    value={formData.fuel.level}
                    onChange={(_, value) => handleNestedChange('fuel', 'level', value)}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={0}
                    max={100}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Fuel Capacity"
                    type="number"
                    value={formData.fuel.capacity}
                    onChange={(e) => handleNestedChange('fuel', 'capacity', parseFloat(e.target.value) || 0)}
                    variant="outlined"
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">gallons</Typography>
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Fuel Efficiency"
                    type="number"
                    value={formData.fuel.efficiency}
                    onChange={(e) => handleNestedChange('fuel', 'efficiency', parseFloat(e.target.value) || 0)}
                    variant="outlined"
                    InputProps={{
                      endAdornment: <Typography variant="body2" color="text.secondary">MPG</Typography>
                    }}
                  />
                </Grid>
                {formData.batteryLevel !== undefined && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Battery4Bar color="info" />
                      <Box sx={{ flex: 1 }}>
                        <Typography gutterBottom variant="subtitle2" fontWeight={600}>
                          Battery Level: {formData.batteryLevel}%
                        </Typography>
                        <Slider
                          value={formData.batteryLevel}
                          onChange={(_, value) => handleChange('batteryLevel', value)}
                          valueLabelDisplay="auto"
                          step={1}
                          marks
                          min={0}
                          max={100}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Features */}
        <Grid size={12}>
          <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Build color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  Vehicle Features
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the features and equipment installed on this vehicle:
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableFeatures.map((feature) => {
                  const isSelected = formData.features?.includes(feature);
                  return (
                    <Chip
                      key={feature}
                      label={feature}
                      onClick={() => handleFeatureToggle(feature)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.8)
                            : alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Information */}
        <Grid size={12}>
          <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.info.main, 0.02) }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Speed color="info" />
                <Typography variant="h6" fontWeight={600}>
                  Location & Maintenance
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    label="Current Location"
                    value={formData.location.address}
                    onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
                    variant="outlined"
                    placeholder="Enter current address or location"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Next Maintenance"
                    type="date"
                    value={formData.nextMaintenance?.toISOString().split('T')[0] ?? ''}
                    onChange={(e) => handleChange('nextMaintenance', new Date(e.target.value))}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Form Status */}
        {Object.keys(errors).length > 0 && (
          <Grid size={12}>
            <Alert severity="error">
              Please correct the following errors:
              <ul style={{ margin: '8px 0 0 16px' }}>
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};