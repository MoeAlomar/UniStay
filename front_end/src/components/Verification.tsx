import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { CheckCircle2, Upload, Mail, Clock } from "lucide-react";

interface VerificationProps {
  onNavigate: (page: string) => void;
}

export function Verification({ onNavigate }: VerificationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");

  const steps = [
    {
      number: 1,
      title: "Upload ID",
      description: "Upload your national ID or student ID",
      icon: Upload,
    },
    {
      number: 2,
      title: "Verify Email",
      description: "Confirm your email address",
      icon: Mail,
    },
    {
      number: 3,
      title: "Await Approval",
      description: "Our team will review your information",
      icon: Clock,
    },
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="mb-2 text-foreground">Account Verification</h1>
            <p className="text-muted-foreground">
              Complete these steps to verify your account and build trust
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <Card
                  key={step.number}
                  className={`${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isCompleted
                      ? "border-green-600 bg-green-50"
                      : "border-border"
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? "bg-primary text-white"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className="text-sm mb-1 text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Step Content */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-foreground">
                      Upload Your Identification
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Please upload a clear photo of your national ID or student ID.
                      This helps us verify your identity and keep the platform safe.
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG or PDF (max. 5MB)
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Privacy Notice:</strong> Your ID will be used only for
                      verification purposes and will be stored securely. We never
                      share your personal information with third parties.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-foreground">Verify Your Email</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      We've sent a 6-digit verification code to your email address.
                      Please enter it below to confirm your email.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-xl tracking-widest"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Didn't receive the code?
                    </p>
                    <Button variant="link" className="text-primary">
                      Resend Code
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      <strong>Check your spam folder:</strong> If you don't see the
                      email in your inbox, please check your spam or junk folder.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-10 h-10 text-green-600" />
                  </div>

                  <div>
                    <h3 className="mb-4 text-foreground">
                      Verification Under Review
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for submitting your information! Our team is
                      reviewing your documents. This usually takes 24-48 hours.
                    </p>
                  </div>

                  <div className="bg-secondary rounded-lg p-6 text-left">
                    <h4 className="mb-3 text-foreground">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          Our team will review your ID and verify your information
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          You'll receive an email once your account is verified
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          You'll get a "Verified" badge on your profile
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          You can start browsing and contacting landlords immediately
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && currentStep < 3 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                className="flex-1"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                {currentStep === 2 ? "Verify Email" : "Continue"}
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => onNavigate("landing")}
              >
                Go to Dashboard
              </Button>
            )}
          </div>

          {currentStep < 3 && (
            <div className="text-center mt-4">
              <Button
                variant="link"
                className="text-muted-foreground"
                onClick={() => onNavigate("landing")}
              >
                Skip for now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
