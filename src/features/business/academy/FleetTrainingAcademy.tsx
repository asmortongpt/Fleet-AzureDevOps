/**
 * FleetTrainingAcademy - Comprehensive Training Platform
 * Leverages existing TrainingCertificationManagement and KnowledgeManagementTraining services
 */

import {
  BookOpen,
  Video,
  FileText,
  Award,
  Users,
  Clock,
  CheckCircle2,
  PlayCircle,
  Star,
  Target,
  Brain,
  Shield,
  Truck,
  Wrench,
  Navigation,
  Search
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import logger from '@/utils/logger';

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
  const [stats, setStats] = useState({
    activeLearners: 0,
    certificationsAvailable: 0,
    coursesCompleted: 0,
    certificationsEarned: 0,
    averageRating: 0,
    learningHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);

  // Load training data from API
  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, progressRes] = await Promise.all([
        fetch('/api/training/courses', { credentials: 'include' }),
        fetch('/api/training/progress', { credentials: 'include' })
      ]);

      if (!coursesRes.ok) {
        throw new Error(`Failed to load courses (${coursesRes.status})`);
      }
      if (!progressRes.ok) {
        throw new Error(`Failed to load progress (${progressRes.status})`);
      }

      const coursesPayload = await coursesRes.json();
      const progressPayload = await progressRes.json();

      const progressRows = (progressPayload.data ?? []).map((row: any): UserProgress => ({
        userId: row.driver_id,
        courseId: row.course_id,
        progress: Number(row.progress) || 0,
        completedModules: Array.isArray(row.completed_modules) ? row.completed_modules : [],
        lastAccessed: row.last_accessed || '',
        timeSpent: Number(row.time_spent_minutes) || 0,
        score: row.score ?? undefined
      }));

      const progressByCourse = new Map<string, UserProgress[]>();
      progressRows.forEach((p: UserProgress) => {
        if (!progressByCourse.has(p.courseId)) {
          progressByCourse.set(p.courseId, []);
        }
        progressByCourse.get(p.courseId)!.push(p);
      });

      const coursesRows = coursesPayload.data ?? [];
      const mappedCourses: TrainingCourse[] = coursesRows.map((course: any) => {
        const courseProgress = progressByCourse.get(course.id) || [];
        const completedCount = courseProgress.filter((p) => p.progress >= 100).length;
        const completionRate = courseProgress.length > 0
          ? Math.round((completedCount / courseProgress.length) * 100)
          : 0;

        const modules = Array.isArray(course.modules) ? course.modules : [];
        const mappedModules = modules.map((module: any) => {
          const moduleId = module.id || module.module_id || `${course.id}-${module.title || 'module'}`;
          const isCompleted = courseProgress.some((p) => p.completedModules?.includes?.(moduleId));
          return {
            id: moduleId,
            title: module.title || 'Module',
            type: module.type || 'document',
            duration: Number(module.duration) || 0,
            content: module.content || '',
            resources: Array.isArray(module.resources) ? module.resources : [],
            completed: isCompleted
          } as TrainingModule;
        });

        const instructor = course.instructor || {};

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          duration: Number(course.duration_minutes) || 0,
          modules: mappedModules,
          prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
          certification: course.certification || undefined,
          enrolledUsers: courseProgress.length,
          rating: Number(course.rating) || 0,
          instructor: {
            id: instructor.id || course.id,
            name: instructor.name || 'Instructor',
            title: instructor.title || 'Trainer',
            avatar: instructor.avatar || '',
            bio: instructor.bio || '',
            rating: Number(instructor.rating) || 0,
            coursesCount: Number(instructor.coursesCount) || 0
          },
          tags: Array.isArray(course.tags) ? course.tags : [],
          isRequired: Boolean(course.is_required) || false,
          completionRate,
          lastUpdated: course.updated_at || course.created_at
        };
      });

      const uniqueLearners = new Set(progressRows.map((p: UserProgress) => p.userId)).size;
      const certificationsAvailable = mappedCourses.filter((c) => Boolean(c.certification)).length;
      const coursesCompleted = progressRows.filter((p: UserProgress) => p.progress >= 100).length;
      const certificationsEarned = progressRows.filter((p: UserProgress) => {
        const course = mappedCourses.find((c) => c.id === p.courseId);
        return p.progress >= 100 && Boolean(course?.certification);
      }).length;
      const averageRating = mappedCourses.length > 0
        ? Number((mappedCourses.reduce((sum, course) => sum + (course.rating || 0), 0) / mappedCourses.length).toFixed(1))
        : 0;
      const learningHours = Math.round(
        progressRows.reduce((sum: number, p: UserProgress) => sum + (p.timeSpent || 0), 0) / 60
      );

      setCourses(mappedCourses);
      setUserProgress(progressRows);
      setStats({
        activeLearners: uniqueLearners,
        certificationsAvailable,
        coursesCompleted,
        certificationsEarned,
        averageRating,
        learningHours
      });
    } catch (error) {
      logger.error('Failed to load training data', error as Error);
      setCourses([]);
      setUserProgress([]);
    } finally {
      setIsLoading(false);
    }
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
    logger.info('Starting course:', course.id);
  };

  const continueCourse = (course: TrainingCourse) => {
    // In real implementation, this would navigate to last accessed module
    logger.info('Continuing course:', course.id);
  };

  const viewCertification = (course: TrainingCourse) => {
    // In real implementation, this would show certification details
    logger.info('Viewing certification for:', course.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-700">Loading training catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <BookOpen className="mr-3 text-blue-800" />
                Fleet Training Academy
              </h1>
              <p className="text-slate-700 text-sm">
                Professional development and certification for fleet management excellence
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="px-3 py-1">
                <Users className="w-4 h-4 mr-1" />
                {stats.activeLearners.toLocaleString()} Active Learners
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Award className="w-4 h-4 mr-1" />
                {stats.certificationsAvailable.toLocaleString()} Certifications Available
              </Badge>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Courses Completed</p>
                    <p className="text-sm font-bold">{stats.coursesCompleted.toLocaleString()}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Certifications Earned</p>
                    <p className="text-sm font-bold">{stats.certificationsEarned.toLocaleString()}</p>
                  </div>
                  <Award className="w-4 h-4 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Average Rating</p>
                    <p className="text-sm font-bold">{stats.averageRating.toFixed(1)}</p>
                  </div>
                  <Star className="w-4 h-4 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Learning Hours</p>
                    <p className="text-sm font-bold">{stats.learningHours.toLocaleString()}</p>
                  </div>
                  <Clock className="w-4 h-4 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and filters */}
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="search">Search Courses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {filteredCourses.map((course) => {
            const progress = getUserProgress(course.id);
            const CategoryIcon = getCategoryIcon(course.category);

            return (
              <Card key={course.id} className="hover:shadow-sm transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getCategoryColor(course.category)}>
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {course.category}
                    </Badge>
                    <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                  </div>

                  <CardTitle className="text-sm leading-tight mb-2">
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

                <CardContent className="space-y-2">
                  {/* Progress bar (if enrolled) */}
                  {progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <Progress value={progress.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-700">
                        <span>
                          {progress.completedModules.length} of {course.modules.length} modules
                        </span>
                        {progress.score && <span>Score: {progress.score}%</span>}
                      </div>
                    </div>
                  )}

                  {/* Course info */}
                  <div className="flex items-center justify-between text-sm text-gray-700">
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
                    <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {course.instructor.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{course.instructor.name}</p>
                      <p className="text-xs text-gray-700">{course.instructor.title}</p>
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
                            <CategoryIcon className="w-3 h-3 mr-2" />
                            {course.title}
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            {course.description}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {/* Course modules */}
                          <div className="md:col-span-2">
                            <h3 className="text-sm font-semibold mb-2">Course Modules</h3>
                            <div className="space-y-3">
                              {course.modules.map((module, index) => {
                                const ModuleIcon = getModuleIcon(module.type);
                                return (
                                  <div
                                    key={module.id}
                                    className="flex items-center p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                                        <ModuleIcon className="w-4 h-4 text-blue-800" />
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {index + 1}. {module.title}
                                        </p>
                                        <p className="text-sm text-gray-700 flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {module.duration} minutes
                                        </p>
                                      </div>
                                    </div>
                                    {module.completed && (
                                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Course details */}
                          <div className="space-y-2">
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
                                <p className="text-sm text-slate-700">{course.instructor.title}</p>
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
                                  <p className="text-xs text-slate-700 mt-1">
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

                        <div className="flex justify-end space-x-2 pt-2 border-t">
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
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-slate-700 mb-2">
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
