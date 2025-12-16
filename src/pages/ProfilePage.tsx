/**
 * ProfilePage - User Profile Management
 * Allows users to view and edit their profile information
 */

import { useState } from 'react'
import { useAtom } from 'jotai'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { currentUserAtom } from '@/lib/reactive-state'
import { User, Check, X, Upload, LinkedinLogo, GithubLogo, TwitterLogo } from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'

import logger from '@/utils/logger';
// Form validation schema
const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || '',
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      jobTitle: currentUser?.jobTitle || '',
      department: currentUser?.department || '',
      bio: currentUser?.bio || '',
      linkedin: currentUser?.socialLinks?.linkedin || '',
      github: currentUser?.socialLinks?.github || '',
      twitter: currentUser?.socialLinks?.twitter || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update user atom
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          displayName: data.displayName,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          jobTitle: data.jobTitle,
          department: data.department,
          bio: data.bio,
          socialLinks: {
            linkedin: data.linkedin,
            github: data.github,
            twitter: data.twitter,
          },
          avatar: avatarPreview || currentUser.avatar,
          updatedAt: new Date().toISOString(),
        })
      }

      toast.success('Profile updated successfully')
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      toast.error('Failed to update profile')
      logger.error('Profile update error:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getUserInitials = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    return currentUser?.displayName?.slice(0, 2).toUpperCase() || 'U'
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view your profile</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information</p>
        </div>

        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty && !avatarFile}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a profile picture (max 5MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || currentUser.avatar} alt={currentUser.displayName} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>

              {isEditing && (
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">Upload Photo</span>
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                {...register('displayName')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                Email
                {currentUser.emailVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register('phone')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Your job title and department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  {...register('jobTitle')}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  {...register('department')}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Tell us about yourself..."
                {...register('bio')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted resize-none' : 'resize-none'}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <LinkedinLogo className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/username"
                {...register('linkedin')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.linkedin && (
                <p className="text-sm text-destructive">{errors.linkedin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <GithubLogo className="h-4 w-4" />
                GitHub
              </Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/username"
                {...register('github')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.github && (
                <p className="text-sm text-destructive">{errors.github.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <TwitterLogo className="h-4 w-4" />
                Twitter
              </Label>
              <Input
                id="twitter"
                type="url"
                placeholder="https://twitter.com/username"
                {...register('twitter')}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              {errors.twitter && (
                <p className="text-sm text-destructive">{errors.twitter.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Account Information (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Account status and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">User ID</span>
              <span className="text-sm text-muted-foreground font-mono">{currentUser.id}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              <Badge
                variant={
                  currentUser.status === 'active'
                    ? 'default'
                    : currentUser.status === 'invited'
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1)}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Member Since</span>
              <span className="text-sm text-muted-foreground">
                {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            {currentUser.lastActive && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Active</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(currentUser.lastActive).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
