import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Mail, Loader2, Shield, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { resetPassword } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await resetPassword(data.email)
      
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message || "Failed to send reset email. Please try again.",
          variant: "destructive",
        })
      } else {
        setEmailSent(true)
        toast({
          title: "Reset Email Sent",
          description: "Check your inbox for password reset instructions.",
          variant: "default",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to send reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formValues = watch()

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
        
        <Link 
          to="/login" 
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Login</span>
        </Link>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
          </div>

          <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-bold text-foreground">
                Reset Instructions Sent
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                We've sent password reset instructions to your email address
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-success-foreground">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  Try Different Email
                </Button>
                
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
      
      <Link 
        to="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Login</span>
      </Link>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/80 text-sm">Enter your email to receive reset instructions</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              We'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full h-11 bg-gradient-primary hover:opacity-90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Instructions...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary hover:text-primary/90 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword