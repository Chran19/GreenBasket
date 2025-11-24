"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { authAPI } from "@/lib/api"
import { User, Mail, Phone, MapPin, Edit, Save, X, Bell, Shield, Lock, Trash2, Eye, EyeOff, Settings } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    priceAlerts: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyDigest: false,
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showAddress: false,
    allowMessages: true,
    dataAnalytics: true,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
      })
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await authAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      })
      updateUser({
        ...user,
        ...formData,
      })
      setIsEditing(false)
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." })
    } catch (e) {
      console.error('Update profile failed', e)
      toast({ title: "Update Failed", description: "Failed to update profile.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      bio: user.bio || "",
    })
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "New password and confirm password do not match.", variant: "destructive" })
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Password Too Short", description: "Password must be at least 6 characters.", variant: "destructive" })
      return
    }
    try {
      setIsLoading(true)
      await authAPI.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({ title: "Password Changed", description: "Your password has been updated." })
    } catch (e) {
      toast({ title: "Password Change Failed", description: "Check your current password.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationSettingsUpdate = async () => {
    try {
      setIsLoading(true)
      await new Promise((r) => setTimeout(r, 750))
      toast({ title: "Settings Updated", description: "Notification preferences saved." })
    } catch {
      toast({ title: "Update Failed", description: "Failed to update notification settings.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrivacySettingsUpdate = async () => {
    try {
      setIsLoading(true)
      await new Promise((r) => setTimeout(r, 750))
      toast({ title: "Settings Updated", description: "Privacy settings saved." })
    } catch {
      toast({ title: "Update Failed", description: "Failed to update privacy settings.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true)
      await authAPI.deleteAccount()
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." })
      logout()
      router.push("/")
    } catch (e) {
      toast({ title: "Deletion Failed", description: "Failed to delete account.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{user.name}</h2>
                  <Badge variant="secondary" className="mb-4">
                    {user.role}
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-4">Member since {new Date().getFullYear() - 1}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 justify-center">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 justify-center">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center gap-2 justify-center">
                        <MapPin className="h-4 w-4" />
                        <span>{user.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Favorites</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviews Given</span>
                    <span className="font-medium">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Status</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{user.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{user.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{user.phone || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Enter your address"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{user.address || "Not provided"}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm p-2 bg-muted rounded min-h-[100px]">{user.bio || "No bio provided"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Email Notifications */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {[
                      { key: "orderUpdates", title: "Order Updates", desc: "Get notified about order status changes" },
                      { key: "priceAlerts", title: "Price Alerts", desc: "Receive notifications when product prices drop" },
                      { key: "marketingEmails", title: "Marketing Emails", desc: "Receive promotional offers and updates" },
                      { key: "securityAlerts", title: "Security Alerts", desc: "Important security notifications" },
                      { key: "weeklyDigest", title: "Weekly Digest", desc: "Weekly summary of your activity" },
                    ].map((row) => (
                      <div key={row.key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{row.title}</p>
                          <p className="text-sm text-muted-foreground">{row.desc}</p>
                        </div>
                        <Switch
                          checked={(notificationSettings as any)[row.key]}
                          onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, [row.key]: checked } as any)}
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleNotificationSettingsUpdate} disabled={isLoading} className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    {isLoading ? "Updating..." : "Save Notification Preferences"}
                  </Button>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Profile Visibility</p>
                        <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                      </div>
                      <select
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                        className="border rounded px-3 py-1 text-sm"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    {[
                      { key: "showEmail", title: "Show Email Address", desc: "Allow others to see your email" },
                      { key: "showPhone", title: "Show Phone Number", desc: "Allow others to see your phone" },
                      { key: "showAddress", title: "Show Address", desc: "Allow others to see your address" },
                      { key: "allowMessages", title: "Allow Messages", desc: "Let other users send you messages" },
                      { key: "dataAnalytics", title: "Data Analytics", desc: "Help improve our service with analytics" },
                    ].map((row) => (
                      <div key={row.key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{row.title}</p>
                          <p className="text-sm text-muted-foreground">{row.desc}</p>
                        </div>
                        <Switch
                          checked={(privacySettings as any)[row.key]}
                          onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, [row.key]: checked } as any)}
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={handlePrivacySettingsUpdate} disabled={isLoading} className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    {isLoading ? "Updating..." : "Save Privacy Settings"}
                  </Button>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card className="mt-6 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Trash2 className="h-5 w-5" />
                    Delete Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border border-red-200 rounded-lg bg-red-100">
                    <span className="text-sm text-red-800">This action cannot be undone</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Delete Account Permanently"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
