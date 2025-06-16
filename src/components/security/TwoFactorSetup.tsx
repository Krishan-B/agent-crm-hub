
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Shield, QrCode, Key } from 'lucide-react';
import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { useToast } from '@/hooks/use-toast';

const TwoFactorSetup: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    twoFactorSettings,
    isLoading,
    error,
    generateSecret,
    enableTwoFactor,
    disableTwoFactor
  } = useTwoFactorAuth();

  const handleGenerateSecret = async () => {
    try {
      const data = await generateSecret();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      toast({
        title: "2FA Secret Generated",
        description: "Scan the QR code with your authenticator app"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate 2FA secret",
        variant: "destructive"
      });
    }
  };

  const handleEnable2FA = async () => {
    if (!secret || !verificationCode) return;

    try {
      await enableTwoFactor(secret, verificationCode);
      setQrCode(null);
      setSecret(null);
      setVerificationCode('');
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled successfully"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to enable 2FA. Please check your verification code.",
        variant: "destructive"
      });
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode) return;

    try {
      await disableTwoFactor(verificationCode);
      setVerificationCode('');
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please check your verification code.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable 2FA</p>
            <p className="text-sm text-gray-500">
              {twoFactorSettings?.is_enabled 
                ? "Two-factor authentication is currently enabled"
                : "Two-factor authentication is currently disabled"
              }
            </p>
          </div>
          <Switch 
            checked={twoFactorSettings?.is_enabled || false}
            disabled={isLoading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!twoFactorSettings?.is_enabled && (
          <div className="space-y-4">
            {!qrCode && (
              <Button onClick={handleGenerateSecret} disabled={isLoading}>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            )}

            {qrCode && (
              <div className="space-y-4">
                <div className="text-center">
                  <img src={qrCode} alt="2FA QR Code" className="mx-auto border rounded" />
                  <p className="text-sm text-gray-500 mt-2">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                {secret && (
                  <div>
                    <Label>Manual Entry Key</Label>
                    <div className="flex items-center gap-2">
                      <Input value={secret} readOnly className="font-mono text-sm" />
                      <Key className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="verification">Verification Code</Label>
                  <Input
                    id="verification"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={handleEnable2FA} 
                  disabled={isLoading || !verificationCode}
                  className="w-full"
                >
                  Enable Two-Factor Authentication
                </Button>
              </div>
            )}
          </div>
        )}

        {twoFactorSettings?.is_enabled && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="disableVerification">Verification Code</Label>
              <Input
                id="disableVerification"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code to disable"
                maxLength={6}
              />
            </div>

            <Button 
              onClick={handleDisable2FA} 
              disabled={isLoading || !verificationCode}
              variant="destructive"
              className="w-full"
            >
              Disable Two-Factor Authentication
            </Button>
          </div>
        )}

        {twoFactorSettings?.backup_codes && twoFactorSettings.backup_codes.length > 0 && (
          <div>
            <Label>Backup Codes</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {twoFactorSettings.backup_codes.map((code, index) => (
                <div key={index} className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {code}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Save these backup codes in a secure location. Each can only be used once.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
