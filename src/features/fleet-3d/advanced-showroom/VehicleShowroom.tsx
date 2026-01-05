import {
  DirectionsCar as CarIcon,
  LocalShipping as TruckIcon,
  DirectionsBus as BusIcon,
  ThreeSixty as Rotate360Icon,
  Speed as SpeedIcon,
  LocalGasStation as GasIcon,
  Engineering as EngineIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  CompareArrows as CompareIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  ViewInAr as ARIcon,
  QrCode as QrCodeIcon,
  RemoveRedEye as ViewIcon,
  Build as MaintenanceIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Rating
} from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';

interface VehicleSpecs {
  engine: string;
  transmission: string;
  fuelType: string;
  mpg: string;
  seatingCapacity: number;
  cargoCapacity: string;
  towing: string;
  wheelbase: string;
  length: string;
  width: string;
  height: string;
  weight: string;
}

interface Vehicle3DModel {
  id: string;
  name: string;
  category: 'bus' | 'van' | 'truck' | 'suv' | 'sedan' | 'specialized';
  manufacturer: string;
  model: string;
  year: number;
  vin: string;
  status: 'available' | 'in_service' | 'maintenance' | 'retired';
  primaryImage: string;
  images360: string[];
  model3dUrl?: string;
  interiorImages: string[];
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  specifications: VehicleSpecs;
  features: string[];
  maintenanceHistory: Array<{
    date: string;
    type: string;
    cost: number;
    description: string;
  }>;
  rating: number;
  views: number;
  isFavorite: boolean;
}

const VehicleShowroom: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle3DModel[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle3DModel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'carousel'>('grid');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVehicles, setCompareVehicles] = useState<Vehicle3DModel[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [arMode, setArMode] = useState(false);
  const rotationInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadVehicleDatabase();
  }, []);

  useEffect(() => {
    if (isRotating && selectedVehicle) {
      rotationInterval.current = setInterval(() => {
        setRotation((prev) => (prev + 1) % 360);
        setImageIndex((prev) => (prev + 1) % (selectedVehicle.images360.length || 1));
      }, 50);
    } else {
      if (rotationInterval.current) {
        clearInterval(rotationInterval.current);
      }
    }
    return () => {
      if (rotationInterval.current) {
        clearInterval(rotationInterval.current);
      }
    };
  }, [isRotating, selectedVehicle]);

  const loadVehicleDatabase = () => {
    setLoading(true);

    // Simulated vehicle database with rich 3D showcase data
    const vehicleDatabase: Vehicle3DModel[] = [
      {
        id: 'BUS-301',
        name: 'Blue Bird Vision',
        category: 'bus',
        manufacturer: 'Blue Bird',
        model: 'Vision School Bus',
        year: 2023,
        vin: '1BABNBKA5PF301234',
        status: 'available',
        primaryImage: '/api/placeholder/800/600',
        images360: Array(36).fill('/api/placeholder/800/600'),
        model3dUrl: '/models/school-bus.glb',
        interiorImages: Array(8).fill('/api/placeholder/800/600'),
        exteriorColor: 'School Bus Yellow',
        interiorColor: 'Black Vinyl',
        mileage: 15234,
        purchaseDate: '2023-01-15',
        purchasePrice: 95000,
        currentValue: 88000,
        specifications: {
          engine: 'Cummins B6.7 Diesel',
          transmission: 'Allison 2500 PTS',
          fuelType: 'Diesel',
          mpg: '7.2',
          seatingCapacity: 72,
          cargoCapacity: 'N/A',
          towing: 'N/A',
          wheelbase: '238"',
          length: '39\'',
          width: '96"',
          height: '128"',
          weight: '25,000 lbs'
        },
        features: [
          'Air Brakes',
          'LED Lighting',
          'Stop Arm Camera',
          'GPS Tracking',
          'Child Safety Alarm',
          'Tinted Windows',
          'Emergency Exits',
          'First Aid Kit',
          'Fire Extinguisher',
          'Two-Way Radio'
        ],
        maintenanceHistory: [
          {
            date: '2024-01-10',
            type: 'Oil Change',
            cost: 250,
            description: 'Regular maintenance - oil and filter change'
          },
          {
            date: '2023-12-15',
            type: 'Brake Service',
            cost: 850,
            description: 'Front brake pad replacement'
          },
          {
            date: '2023-11-20',
            type: 'Annual Inspection',
            cost: 450,
            description: 'DOT annual inspection and certification'
          }
        ],
        rating: 4.5,
        views: 245,
        isFavorite: true
      },
      {
        id: 'VAN-105',
        name: 'Ford Transit 350',
        category: 'van',
        manufacturer: 'Ford',
        model: 'Transit 350 HD',
        year: 2023,
        vin: '1FTBW2XG7PKA10567',
        status: 'available',
        primaryImage: '/api/placeholder/800/600',
        images360: Array(36).fill('/api/placeholder/800/600'),
        model3dUrl: '/models/transit-van.glb',
        interiorImages: Array(6).fill('/api/placeholder/800/600'),
        exteriorColor: 'Oxford White',
        interiorColor: 'Ebony Cloth',
        mileage: 8456,
        purchaseDate: '2023-03-20',
        purchasePrice: 48000,
        currentValue: 44000,
        specifications: {
          engine: '3.5L V6 EcoBoost',
          transmission: '10-Speed Automatic',
          fuelType: 'Gasoline',
          mpg: '15/19',
          seatingCapacity: 15,
          cargoCapacity: '487.3 cu.ft',
          towing: '6,900 lbs',
          wheelbase: '147.6"',
          length: '21\'9"',
          width: '81.3"',
          height: '109.4"',
          weight: '5,890 lbs'
        },
        features: [
          'Backup Camera',
          'Lane Keeping System',
          'Pre-Collision Assist',
          'Hill Start Assist',
          'Trailer Sway Control',
          'SYNC 4 Infotainment',
          'Power Windows',
          'Keyless Entry',
          'Cruise Control',
          'Dual Rear Wheels'
        ],
        maintenanceHistory: [
          {
            date: '2024-01-05',
            type: 'Oil Change',
            cost: 85,
            description: 'Synthetic oil change'
          },
          {
            date: '2023-10-15',
            type: 'Tire Rotation',
            cost: 60,
            description: 'Tire rotation and balance'
          }
        ],
        rating: 4.8,
        views: 189,
        isFavorite: false
      },
      {
        id: 'TRUCK-208',
        name: 'Freightliner Cascadia',
        category: 'truck',
        manufacturer: 'Freightliner',
        model: 'Cascadia 126',
        year: 2022,
        vin: '1FUJHHDR3NLHJ2089',
        status: 'in_service',
        primaryImage: '/api/placeholder/800/600',
        images360: Array(36).fill('/api/placeholder/800/600'),
        model3dUrl: '/models/freightliner.glb',
        interiorImages: Array(5).fill('/api/placeholder/800/600'),
        exteriorColor: 'Arctic White',
        interiorColor: 'Gray Premium',
        mileage: 45678,
        purchaseDate: '2022-06-10',
        purchasePrice: 155000,
        currentValue: 138000,
        specifications: {
          engine: 'Detroit DD15 14.8L',
          transmission: 'DT12 Automated',
          fuelType: 'Diesel',
          mpg: '6.5',
          seatingCapacity: 2,
          cargoCapacity: '2,500 cu.ft',
          towing: '80,000 lbs',
          wheelbase: '230"',
          length: '72\'',
          width: '102"',
          height: '13\'6"',
          weight: '19,000 lbs'
        },
        features: [
          'Detroit Assurance 5.0',
          'Active Brake Assist',
          'Adaptive Cruise Control',
          'Lane Departure Warning',
          'Side Guard Assist',
          'Bluetooth Connectivity',
          'Air Suspension',
          'Aluminum Wheels',
          'LED Headlights',
          'Sleeper Cab'
        ],
        maintenanceHistory: [
          {
            date: '2024-01-12',
            type: 'PM Service',
            cost: 1250,
            description: 'Preventive maintenance service'
          },
          {
            date: '2023-11-28',
            type: 'Transmission Service',
            cost: 850,
            description: 'Transmission fluid and filter change'
          }
        ],
        rating: 4.6,
        views: 312,
        isFavorite: true
      },
      {
        id: 'SUV-412',
        name: 'Chevrolet Tahoe',
        category: 'suv',
        manufacturer: 'Chevrolet',
        model: 'Tahoe Z71',
        year: 2023,
        vin: '1GNSKBKD5PR412789',
        status: 'available',
        primaryImage: '/api/placeholder/800/600',
        images360: Array(36).fill('/api/placeholder/800/600'),
        model3dUrl: '/models/tahoe.glb',
        interiorImages: Array(10).fill('/api/placeholder/800/600'),
        exteriorColor: 'Black',
        interiorColor: 'Jet Black Leather',
        mileage: 12345,
        purchaseDate: '2023-02-28',
        purchasePrice: 72000,
        currentValue: 68000,
        specifications: {
          engine: '5.3L V8',
          transmission: '10-Speed Automatic',
          fuelType: 'Gasoline',
          mpg: '16/20',
          seatingCapacity: 8,
          cargoCapacity: '122.9 cu.ft',
          towing: '8,400 lbs',
          wheelbase: '120.9"',
          length: '210.7"',
          width: '81"',
          height: '75.8"',
          weight: '5,635 lbs'
        },
        features: [
          '4WD Z71 Off-Road Package',
          'Magnetic Ride Control',
          'Head-Up Display',
          'Surround Vision Camera',
          'Rear Seat Entertainment',
          'Wireless Charging',
          'Bose Premium Audio',
          'Heated/Cooled Seats',
          'Power Liftgate',
          'Adaptive Cruise Control'
        ],
        maintenanceHistory: [
          {
            date: '2023-12-20',
            type: 'Oil Change',
            cost: 95,
            description: 'Full synthetic oil change'
          }
        ],
        rating: 4.9,
        views: 423,
        isFavorite: false
      },
      {
        id: 'SEDAN-501',
        name: 'Ford Fusion Hybrid',
        category: 'sedan',
        manufacturer: 'Ford',
        model: 'Fusion Hybrid SE',
        year: 2020,
        vin: '3FA6P0LU5LR501234',
        status: 'available',
        primaryImage: '/api/placeholder/800/600',
        images360: Array(36).fill('/api/placeholder/800/600'),
        interiorImages: Array(7).fill('/api/placeholder/800/600'),
        exteriorColor: 'Ingot Silver',
        interiorColor: 'Ebony Cloth',
        mileage: 34567,
        purchaseDate: '2020-09-15',
        purchasePrice: 28000,
        currentValue: 22000,
        specifications: {
          engine: '2.0L I4 Hybrid',
          transmission: 'eCVT',
          fuelType: 'Hybrid',
          mpg: '43/41',
          seatingCapacity: 5,
          cargoCapacity: '12 cu.ft',
          towing: '2,000 lbs',
          wheelbase: '112.2"',
          length: '191.8"',
          width: '72.9"',
          height: '58.1"',
          weight: '3,668 lbs'
        },
        features: [
          'SYNC 3',
          'Apple CarPlay',
          'Android Auto',
          'Blind Spot Monitoring',
          'Rear Cross Traffic Alert',
          'Push Button Start',
          'Dual Zone Climate',
          'Backup Camera',
          'Remote Start',
          'Lane Keep Assist'
        ],
        maintenanceHistory: [
          {
            date: '2024-01-08',
            type: 'Battery Service',
            cost: 150,
            description: 'Hybrid battery check and service'
          },
          {
            date: '2023-09-10',
            type: 'Brake Service',
            cost: 450,
            description: 'Rear brake replacement'
          }
        ],
        rating: 4.3,
        views: 156,
        isFavorite: false
      },
      {
        id: 'SPEC-601',
        name: 'Mobile Command Center',
        category: 'specialized',
        manufacturer: 'LDV Custom',
        model: 'Command Master 3500',
        year: 2023,
        vin: 'LDVCUSTOM601SPEC',
        status: 'available',
        primaryImage: '/api/placeholder/800/600',
        images360: Array(36).fill('/api/placeholder/800/600'),
        model3dUrl: '/models/command-center.glb',
        interiorImages: Array(12).fill('/api/placeholder/800/600'),
        exteriorColor: 'Emergency Red',
        interiorColor: 'Command Gray',
        mileage: 5678,
        purchaseDate: '2023-05-01',
        purchasePrice: 285000,
        currentValue: 275000,
        specifications: {
          engine: '6.7L Cummins Turbo Diesel',
          transmission: 'Allison 3000',
          fuelType: 'Diesel',
          mpg: '8',
          seatingCapacity: 8,
          cargoCapacity: 'Custom',
          towing: '15,000 lbs',
          wheelbase: '254"',
          length: '45\'',
          width: '102"',
          height: '12\'6"',
          weight: '26,000 lbs'
        },
        features: [
          'Satellite Communications',
          'Multiple Workstations',
          'Conference Room',
          'Emergency Generator',
          'Climate Control System',
          'LED Scene Lighting',
          'Surveillance Cameras',
          'Radio Communications Hub',
          'Deployable Awning',
          'Self-Leveling System',
          'Medical Equipment Bay',
          'IT Server Rack'
        ],
        maintenanceHistory: [
          {
            date: '2023-12-01',
            type: 'Generator Service',
            cost: 850,
            description: 'Generator maintenance and testing'
          }
        ],
        rating: 5.0,
        views: 567,
        isFavorite: true
      }
    ];

    setTimeout(() => {
      setVehicles(vehicleDatabase);
      setLoading(false);
    }, 1500);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleVehicleSelect = (vehicle: Vehicle3DModel) => {
    setSelectedVehicle(vehicle);
    setImageIndex(0);
    setRotation(0);
    setZoom(1);

    // Increment view count
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicle.id ? { ...v, views: v.views + 1 } : v
      )
    );
  };

  const handleToggleFavorite = (vehicleId: string) => {
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId ? { ...v, isFavorite: !v.isFavorite } : v
      )
    );
  };

  const handleCompareToggle = (vehicle: Vehicle3DModel) => {
    if (compareVehicles.find(v => v.id === vehicle.id)) {
      setCompareVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    } else if (compareVehicles.length < 3) {
      setCompareVehicles(prev => [...prev, vehicle]);
    }
  };

  const filteredVehicles = vehicles.filter(
    v => selectedCategory === 'all' || v.category === selectedCategory
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'in_service': return 'warning';
      case 'maintenance': return 'error';
      case 'retired': return 'default';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bus': return <BusIcon />;
      case 'van': return <CarIcon />;
      case 'truck': return <TruckIcon />;
      case 'suv': return <CarIcon />;
      case 'sedan': return <CarIcon />;
      case 'specialized': return <EngineIcon />;
      default: return <CarIcon />;
    }
  };

  const renderVehicleCard = (vehicle: Vehicle3DModel) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={() => handleVehicleSelect(vehicle)}
    >
      <Box position="relative">
        <CardMedia
          component="img"
          height="200"
          image={vehicle.primaryImage}
          alt={vehicle.name}
        />
        <Box position="absolute" top={8} right={8}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(vehicle.id);
            }}
            sx={{ bgcolor: 'background: paper', '&:hover': { bgcolor: 'background: paper' } }}
          >
            {vehicle.isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </IconButton>
        </Box>
        <Box position="absolute" top={8} left={8}>
          <Chip
            label={vehicle.status.replace('_', ' ').toUpperCase()}
            color={getStatusColor(vehicle.status) as any}
            size="small"
          />
        </Box>
        <Box position="absolute" bottom={8} right={8}>
          <Badge badgeContent={vehicle.views} color="primary">
            <ViewIcon />
          </Badge>
        </Box>
      </Box>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div" noWrap>
            {vehicle.name}
          </Typography>
          <Rating value={vehicle.rating} precision={0.5} size="small" readOnly />
        </Box>

        <Typography variant="body2" color="text: secondary" gutterBottom>
          {vehicle.year} {vehicle.manufacturer} {vehicle.model}
        </Typography>

        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text: secondary">
              <SpeedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {vehicle.mileage.toLocaleString()} mi
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text: secondary">
              <GasIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {vehicle.specifications.mpg} MPG
            </Typography>
          </Grid>
        </Grid>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            ${vehicle.currentValue.toLocaleString()}
          </Typography>
          {compareMode && (
            <FormControlLabel
              control={
                <Switch
                  checked={compareVehicles.some(v => v.id === vehicle.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCompareToggle(vehicle);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label="Compare"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const render360Viewer = () => {
    if (!selectedVehicle) return null;

    return (
      <Box position="relative" height={500}>
        <Box
          component="img"
          src={selectedVehicle.images360[imageIndex % selectedVehicle.images360.length]}
          alt={`${selectedVehicle.name} 360 view`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `scale(${zoom})`,
            transition: 'transform 0.3s'
          }}
        />

        <Box position="absolute" bottom={16} left="50%" sx={{ transform: 'translateX(-50%)' }}>
          <Paper sx={{ p: 1, display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setIsRotating(!isRotating)}>
              {isRotating ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton onClick={() => setZoom(Math.max(1, zoom - 0.2))}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={() => setZoom(Math.min(2, zoom + 0.2))}>
              <ZoomInIcon />
            </IconButton>
            <IconButton>
              <FullscreenIcon />
            </IconButton>
            {selectedVehicle.model3dUrl && (
              <IconButton onClick={() => setArMode(!arMode)}>
                <ARIcon />
              </IconButton>
            )}
          </Paper>
        </Box>

        <Box position="absolute" top={16} right={16}>
          <Chip
            icon={<Rotate360Icon />}
            label={`${Math.round(rotation)}°`}
            color="primary"
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🚗 Interactive Vehicle Showroom
      </Typography>
      <Typography variant="subtitle1" color="text: secondary" gutterBottom>
        Explore our fleet in stunning 3D detail
      </Typography>

      {/* Controls Bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={(e, value) => value && handleCategoryChange(value)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="bus">Buses</ToggleButton>
          <ToggleButton value="van">Vans</ToggleButton>
          <ToggleButton value="truck">Trucks</ToggleButton>
          <ToggleButton value="suv">SUVs</ToggleButton>
          <ToggleButton value="sedan">Sedans</ToggleButton>
          <ToggleButton value="specialized">Specialized</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flexGrow: 1 }} />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, value) => value && setViewMode(value)}
          size="small"
        >
          <ToggleButton value="grid">Grid</ToggleButton>
          <ToggleButton value="list">List</ToggleButton>
          <ToggleButton value="carousel">Carousel</ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel
          control={
            <Switch
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
            />
          }
          label="Compare Mode"
        />
      </Paper>

      {/* Statistics Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{vehicles.length}</Typography>
            <Typography variant="body2" color="text: secondary">Total Vehicles</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{vehicles.filter(v => v.status === 'available').length}</Typography>
            <Typography variant="body2" color="text: secondary">Available</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">${vehicles.reduce((sum, v) => sum + v.currentValue, 0).toLocaleString()}</Typography>
            <Typography variant="body2" color="text: secondary">Fleet Value</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{vehicles.filter(v => v.isFavorite).length}</Typography>
            <Typography variant="body2" color="text: secondary">Favorites</Typography>
          </Paper>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Loading vehicle showroom...</Typography>
        </Box>
      ) : (
        <>
          {/* Vehicle Grid/List */}
          {viewMode === 'grid' && (
            <Grid container spacing={3}>
              {filteredVehicles.map((vehicle) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
                  {renderVehicleCard(vehicle)}
                </Grid>
              ))}
            </Grid>
          )}

          {/* Selected Vehicle Detail View */}
          {selectedVehicle && (
            <Dialog
              open={!!selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5">
                    {selectedVehicle.name}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <IconButton onClick={() => handleToggleFavorite(selectedVehicle.id)}>
                      {selectedVehicle.isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <IconButton>
                      <ShareIcon />
                    </IconButton>
                    <IconButton>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton>
                      <QrCodeIcon />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab label="360° View" />
                  <Tab label="Specifications" />
                  <Tab label="Features" />
                  <Tab label="Maintenance" />
                  <Tab label="Interior" />
                </Tabs>

                <Box sx={{ mt: 2 }}>
                  {activeTab === 0 && render360Viewer()}

                  {activeTab === 1 && (
                    <Grid container spacing={2}>
                      {Object.entries(selectedVehicle.specifications).map(([key, value]) => (
                        <Grid item xs={12} sm={6} key={key}>
                          <Box display="flex" justifyContent="space-between" p={1} bgcolor="grey.100" borderRadius={1}>
                            <Typography variant="body2" fontWeight="bold">
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                            </Typography>
                            <Typography variant="body2">{value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {activeTab === 2 && (
                    <Box>
                      {selectedVehicle.features.map((feature, index) => (
                        <Chip key={index} label={feature} sx={{ m: 0.5 }} />
                      ))}
                    </Box>
                  )}

                  {activeTab === 3 && (
                    <List>
                      {selectedVehicle.maintenanceHistory.map((record, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <MaintenanceIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${record.type} - $${record.cost}`}
                            secondary={`${record.date} - ${record.description}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  {activeTab === 4 && (
                    <Grid container spacing={2}>
                      {selectedVehicle.interiorImages.map((img, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            component="img"
                            src={img}
                            alt={`Interior ${index + 1}`}
                            sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedVehicle(null)}>Close</Button>
                <Button variant="contained" startIcon={<CalendarIcon />}>
                  Schedule Test Drive
                </Button>
              </DialogActions>
            </Dialog>
          )}

          {/* Compare Mode Overlay */}
          {compareMode && compareVehicles.length > 0 && (
            <Paper
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                p: 2,
                maxWidth: 400,
                zIndex: 1300
              }}
            >
              <Typography variant="h6" gutterBottom>
                Compare Vehicles ({compareVehicles.length}/3)
              </Typography>
              <List dense>
                {compareVehicles.map(v => (
                  <ListItem key={v.id}>
                    <ListItemText primary={v.name} secondary={`${v.year} ${v.model}`} />
                    <IconButton size="small" onClick={() => handleCompareToggle(v)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                fullWidth
                disabled={compareVehicles.length < 2}
                startIcon={<CompareIcon />}
              >
                Compare Selected
              </Button>
            </Paper>
          )}
        </>
      )}

      {/* AR Mode Overlay */}
      {arMode && selectedVehicle && (
        <Dialog open={arMode} onClose={() => setArMode(false)} fullScreen>
          <DialogContent sx={{ bgcolor: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box textAlign="center">
              <ARIcon sx={{ fontSize: 100, mb: 2 }} />
              <Typography variant="h4">AR View</Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Point your device camera at a flat surface to place the vehicle
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                onClick={() => setArMode(false)}
              >
                Exit AR Mode
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default VehicleShowroom;