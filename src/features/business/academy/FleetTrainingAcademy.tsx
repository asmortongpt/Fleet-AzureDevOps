/**
 * FleetTrainingAcademy - Comprehensive Training Platform
 * Leverages existing TrainingCertificationManagement and KnowledgeManagementTraining services
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  FileText,
  Award,
  Users,
  Clock,
  CheckCircle2,
  PlayCircle,
  Download,
  Star,
  TrendingUp,
  Calendar,
  Target,
  Brain,
  Shield,
  Truck,
  Wrench,
  Navigation,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: 'safety' | 'operations' | 'maintenance' | 'compliance' | 'leadership' | 'technology';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  modules: TrainingModule[];
  prerequisites?: string[];
  certification?: CertificationInfo;
  enrolledUsers: number;
  rating: number;
  instructor: Instructor;
  tags: string[];
  isRequired: boolean;
  completionRate: number;
  lastUpdated: string;
}

interface TrainingModule {
  id: string;
  title: string;
  type: 'video' | 'document' | 'interactive' | 'quiz' | 'simulation';
  duration: number;
  content: string;
  resources: Resource[];
  completed: boolean;
}

interface CertificationInfo {
  name: string;
  validityPeriod: number; // in months
  renewalRequired: boolean;
  accreditingBody: string;
}

interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  rating: number;
  coursesCount: number;
}

interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link' | 'interactive';
  url: string;
  size?: string;
}

interface UserProgress {
  userId: string;
  courseId: string;
  progress: number;
  completedModules: string[];
  lastAccessed: string;
  timeSpent: number;
  score?: number;
}

const FleetTrainingAcademy: React.FC = () => {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);

  // Mock data - in real app, this would come from the existing services
  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = () => {
    // Mock training courses leveraging existing system capabilities
    const mockCourses: TrainingCourse[] = [
      {
        id: 'safety-001',
        title: 'Fleet Safety Fundamentals',
        description:
          'Comprehensive safety training covering defensive driving, vehicle inspection, and emergency procedures for government fleet operators.',
        category: 'safety',
        level: 'beginner',
        duration: 120,
        modules: [
          {
            id: 'mod-001',
            title: 'Defensive Driving Techniques',
            type: 'video',
            duration: 30,
            content: 'Interactive video training with real-world scenarios',
            resources: [
              {
                id: 'res-001',
                name: 'Safety Checklist',
                type: 'pdf',
                url: '/resources/safety-checklist.pdf',
                size: '2.1 MB'
              }
            ],
            completed: false
          },
          {
            id: 'mod-002',
            title: 'Pre-Trip Vehicle Inspection',
            type: 'interactive',
            duration: 45,
            content: 'Virtual vehicle inspection simulator',
            resources: [],
            completed: false
          },
          {
            id: 'mod-003',
            title: 'Emergency Response Procedures',
            type: 'video',
            duration: 25,
            content: 'Step-by-step emergency protocols',
            resources: [],
            completed: false
          },
          {
            id: 'mod-004',
            title: 'Safety Assessment Quiz',
            type: 'quiz',
            duration: 20,
            content: 'Comprehensive safety knowledge assessment',
            resources: [],
            completed: false
          }
        ],
        prerequisites: [],
        certification: {
          name: 'Fleet Safety Operator Certification',
          validityPeriod: 24,
          renewalRequired: true,
          accreditingBody: 'Department of Transportation'
        },
        enrolledUsers: 1247,
        rating: 4.8,
        instructor: {
          id: 'inst-001',
          name: 'Sarah Martinez',
          title: 'Fleet Safety Specialist',
          avatar: '/images/instructors/sarah-martinez.jpg',
          bio: '15+ years in fleet safety and training',
          rating: 4.9,
          coursesCount: 12
        },
        tags: ['safety', 'defensive-driving', 'inspection', 'emergency'],
        isRequired: true,
        completionRate: 87,
        lastUpdated: '2024-12-15'
      },
      {
        id: 'maint-001',
        title: 'Predictive Maintenance & AI Systems',
        description:
          'Advanced training on leveraging AI-powered predictive maintenance systems, OBD2 diagnostics, and telematics data interpretation.',
        category: 'maintenance',
        level: 'advanced',
        duration: 180,
        modules: [
          {
            id: 'mod-005',
            title: 'AI Predictive Analytics Overview',
            type: 'video',
            duration: 40,
            content: 'Understanding machine learning in fleet maintenance',
            resources: [],
            completed: false
          },
          {
            id: 'mod-006',
            title: 'OBD2 Diagnostic Interpretation',
            type: 'interactive',
            duration: 60,
            content: 'Hands-on OBD2 data analysis simulator',
            resources: [],
            completed: false
          },
          {
            id: 'mod-007',
            title: 'Telematics Data Analysis',
            type: 'document',
            duration: 45,
            content: 'Advanced telematics interpretation guide',
            resources: [],
            completed: false
          },
          {
            id: 'mod-008',
            title: 'Maintenance Optimization Strategies',
            type: 'simulation',
            duration: 35,
            content: 'AI-powered maintenance scheduling simulation',
            resources: [],
            completed: false
          }
        ],
        prerequisites: ['safety-001'],
        certification: {
          name: 'Advanced Fleet Maintenance Technician',
          validityPeriod: 36,
          renewalRequired: true,
          accreditingBody: 'National Fleet Management Association'
        },
        enrolledUsers: 456,
        rating: 4.6,
        instructor: {
          id: 'inst-002',
          name: 'Michael Chen',
          title: 'AI Systems Engineer',
          avatar: '/images/instructors/michael-chen.jpg',
          bio: 'Expert in AI applications for fleet management',
          rating: 4.7,
          coursesCount: 8
        },
        tags: ['AI', 'predictive-maintenance', 'OBD2', 'telematics', 'advanced'],
        isRequired: false,
        completionRate: 73,
        lastUpdated: '2024-12-10'
      },
      {
        id: 'comp-001',
        title: 'Government Fleet Compliance',
        description:
          'Essential compliance training covering federal regulations, environmental standards, and audit preparation for government fleet operations.',
        category: 'compliance',
        level: 'intermediate',
        duration: 90,
        modules: [
          {
            id: 'mod-009',
            title: 'Federal Fleet Regulations',
            type: 'document',
            duration: 30,
            content: 'Comprehensive regulation overview',
            resources: [],
            completed: false
          },
          {
            id: 'mod-010',
            title: 'Environmental Compliance',
            type: 'video',
            duration: 25,
            content: 'Sustainability and environmental requirements',
            resources: [],
            completed: false
          },
          {
            id: 'mod-011',
            title: 'Audit Preparation Workshop',
            type: 'interactive',
            duration: 35,
            content: 'Interactive audit simulation',
            resources: [],
            completed: false
          }
        ],
        prerequisites: [],
        certification: {
          name: 'Government Fleet Compliance Officer',
          validityPeriod: 12,
          renewalRequired: true,
          accreditingBody: 'General Services Administration'
        },
        enrolledUsers: 890,
        rating: 4.5,
        instructor: {
          id: 'inst-003',
          name: 'Jennifer Rodriguez',
          title: 'Compliance Specialist',
          avatar: '/images/instructors/jennifer-rodriguez.jpg',
          bio: 'Government compliance expert with 20+ years experience',
          rating: 4.8,
          coursesCount: 15
        },
        tags: ['compliance', 'regulations', 'audit', 'government'],
        isRequired: true,
        completionRate: 91,
        lastUpdated: '2024-12-01'
      }
    ];

    setCourses(mockCourses);

    // Mock user progress
    const mockProgress: UserProgress[] = [
      {
        userId: 'user-001',
        courseId: 'safety-001',
        progress: 75,
        completedModules: ['mod-001', 'mod-002', 'mod-003'],
        lastAccessed: '2024-12-20',
        timeSpent: 90,
        score: 88
      },
      {
        userId: 'user-001',
        courseId: 'comp-001',
        progress: 45,
        completedModules: ['mod-009', 'mod-010'],
        lastAccessed: '2024-12-18',
        timeSpent: 55
      }
    ];

    setUserProgress(mockProgress);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety':
        return Shield;
      case 'operations':
        return Truck;
      case 'maintenance':
        return Wrench;
      case 'compliance':
        return FileText;
      case 'leadership':
        return Users;
      case 'technology':
        return Brain;
      default:
        return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety':
        return 'bg-red-100 text-red-800';
      case 'operations':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'compliance':
        return 'bg-green-100 text-green-800';
      case 'leadership':
        return 'bg-purple-100 text-purple-800';
      case 'technology':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'interactive':
        return Target;
      case 'quiz':
        return Brain;
      case 'simulation':
        return Navigation;
      default:
        return BookOpen;
    }
  };

  const getUserProgress = (courseId: string): UserProgress | undefined => {
    return userProgress.find((progress) => progress.courseId === courseId);
  };

  const startCourse = (course: TrainingCourse) => {
    // In real implementation, this would navigate to course player
    console.log('Starting course:', course.id);
  };

  const continueCourse = (course: TrainingCourse) => {
    // In real implementation, this would navigate to last accessed module
    console.log('Continuing course:', course.id);
  };

  const viewCertification = (course: TrainingCourse) => {
    // In real implementation, this would show certification details
    console.log('Viewing certification for:', course.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <BookOpen className="mr-3 text-blue-600" />
                Fleet Training Academy
              </h1>
              <p className="text-gray-600 text-lg">
                Professional development and certification for fleet management excellence
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                <Users className="w-4 h-4 mr-1" />
                2,593 Active Learners
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Award className="w-4 h-4 mr-1" />
                45 Certifications Available
              </Badge>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Courses Completed</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Certifications Earned</p>
                    <p className="text-2xl font-bold">892</p>
                  </div>
                  <Award className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Average Rating</p>
                    <p className="text-2xl font-bold">4.7</p>
                  </div>
                  <Star className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Learning Hours</p>
                    <p className="text-2xl font-bold">15,420</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Courses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by title, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-48">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="safety">Safety</option>
                  <option value="operations">Operations</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="compliance">Compliance</option>
                  <option value="leadership">Leadership</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const progress = getUserProgress(course.id);
            const CategoryIcon = getCategoryIcon(course.category);

            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getCategoryColor(course.category)}>
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {course.category}
                    </Badge>
                    <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                  </div>

                  <CardTitle className="text-lg leading-tight mb-2">
                    {course.title}
                    {course.isRequired && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Required
                      </Badge>
                    )}
                  </CardTitle>

                  <CardDescription className="text-sm line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress bar (if enrolled) */}
                  {progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <Progress value={progress.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {progress.completedModules.length} of {course.modules.length} modules
                        </span>
                        {progress.score && <span>Score: {progress.score}%</span>}
                      </div>
                    </div>
                  )}

                  {/* Course info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {Math.floor(course.duration / 60)}h {course.duration % 60}m
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.enrolledUsers.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {course.instructor.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{course.instructor.name}</p>
                      <p className="text-xs text-gray-500">{course.instructor.title}</p>
                    </div>
                  </div>

                  {/* Certification */}
                  {course.certification && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Award className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          Certification available
                        </span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {course.certification.validityPeriod} months
                      </Badge>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    {progress ? (
                      <Button
                        onClick={() => continueCourse(course)}
                        className="flex-1"
                        variant="default"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startCourse(course)}
                        className="flex-1"
                        variant="outline"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Start Course
                      </Button>
                    )}

                    <Dialog
                      open={showCourseDetails && selectedCourse?.id === course.id}
                      onOpenChange={(open) => {
                        setShowCourseDetails(open);
                        if (!open) setSelectedCourse(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCourse(course)}
                        >
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center">
                            <CategoryIcon className="w-5 h-5 mr-2" />
                            {course.title}
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            {course.description}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Course modules */}
                          <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Course Modules</h3>
                            <div className="space-y-3">
                              {course.modules.map((module, index) => {
                                const ModuleIcon = getModuleIcon(module.type);
                                return (
                                  <div
                                    key={module.id}
                                    className="flex items-center p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <ModuleIcon className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {index + 1}. {module.title}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {module.duration} minutes
                                        </p>
                                      </div>
                                    </div>
                                    {module.completed && (
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Course details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Course Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Duration:</span>
                                  <span>
                                    {Math.floor(course.duration / 60)}h {course.duration % 60}m
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Level:</span>
                                  <Badge className={getLevelColor(course.level)}>
                                    {course.level}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Enrolled:</span>
                                  <span>{course.enrolledUsers.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rating:</span>
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                    {course.rating}
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span>Completion Rate:</span>
                                  <span>{course.completionRate}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Instructor info */}
                            <div>
                              <h4 className="font-semibold mb-2">Instructor</h4>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium">{course.instructor.name}</p>
                                <p className="text-sm text-gray-600">{course.instructor.title}</p>
                                <p className="text-sm mt-1">{course.instructor.bio}</p>
                                <div className="flex items-center mt-2 text-sm">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                  {course.instructor.rating} • {course.instructor.coursesCount}{' '}
                                  courses
                                </div>
                              </div>
                            </div>

                            {/* Prerequisites */}
                            {course.prerequisites && course.prerequisites.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Prerequisites</h4>
                                <div className="space-y-1">
                                  {course.prerequisites.map((prereq) => (
                                    <Badge key={prereq} variant="outline" className="mr-1">
                                      {prereq}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Certification */}
                            {course.certification && (
                              <div>
                                <h4 className="font-semibold mb-2">Certification</h4>
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <div className="flex items-center mb-2">
                                    <Award className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="font-medium text-green-800">
                                      {course.certification.name}
                                    </span>
                                  </div>
                                  <p className="text-sm text-green-600">
                                    Valid for {course.certification.validityPeriod} months
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Accredited by {course.certification.accreditingBody}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            <div>
                              <h4 className="font-semibold mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {course.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t">
                          <Button variant="outline" onClick={() => setShowCourseDetails(false)}>
                            Close
                          </Button>
                          {progress ? (
                            <Button onClick={() => continueCourse(course)}>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Continue Course
                            </Button>
                          ) : (
                            <Button onClick={() => startCourse(course)}>
                              <BookOpen className="w-4 h-4 mr-2" />
                              Enroll Now
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No results */}
        {filteredCourses.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or selected category.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FleetTrainingAcademy;
