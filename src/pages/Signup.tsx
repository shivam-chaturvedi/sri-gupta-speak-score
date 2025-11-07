import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, Shield, Lock, Mail, ArrowLeft, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setIsLoading(true)
    
    try {
      const { error } = await signUp(data.email, data.password)
      
      if (error) {
        console.error('Signup error:', error)
        let errorMessage = "Unable to create account. Please try again."
        
        if (error.message) {
          if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
            errorMessage = "An account with this email already exists. Please try signing in instead."
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = "Network error. Please check your internet connection and try again."
          } else if (error.message.includes('Password')) {
            errorMessage = error.message
          } else {
            errorMessage = error.message
          }
        }
        
        toast({
          title: error.message?.includes('already') ? "Account Already Exists" : "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Account Created Successfully!",
          description: "Welcome to Dialectica! You can now start practicing your debate skills.",
          variant: "default",
        })
        
        navigate('/')
      }
    } catch (error) {
      console.error('Signup exception:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Unable to connect to registration service. Please check your internet connection and try again."
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formValues = watch()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
      
      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Dialectica</h1>
          <p className="text-white/80 text-sm">Start Your Speaking Journey</p>
        </div>

        {/* Signup Card */}
        <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Join Dialectica and master the art of debate
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className={`pl-10 h-11 ${errors.email ? 'border-destructive' : formValues.email && !errors.email ? 'border-success' : ''}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className={`pl-10 pr-12 h-11 ${errors.password ? 'border-destructive' : formValues.password && !errors.password ? 'border-success' : ''}`}
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className={`pl-10 pr-12 h-11 ${errors.confirmPassword ? 'border-destructive' : formValues.confirmPassword && !errors.confirmPassword ? 'border-success' : ''}`}
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 hover:bg-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full h-11 bg-gradient-primary hover:opacity-90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary hover:text-primary/90 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                🎯 Join thousands of speakers improving their skills daily
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/70">
            © 2024 Dialectica. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup