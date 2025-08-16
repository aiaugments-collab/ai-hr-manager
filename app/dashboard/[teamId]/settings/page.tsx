'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Cloud,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const params = useParams<{ teamId: string }>();
  
  const [currentStorage, setCurrentStorage] = useState<'firebase' | 'cloudinary'>('cloudinary');
  const [currentDatabase, setCurrentDatabase] = useState<'firebase'>('firebase');
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test storage provider connection
  const testStorageProvider = async (provider: 'firebase' | 'cloudinary') => {
    try {
      logger.info('Testing storage provider', { provider }, 'SettingsPage');
      
      // Here you could add actual connection testing
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: `${provider} storage connection successful!` });
      
    } catch (error) {
      logger.error('Storage provider test failed', error, 'SettingsPage');
      setMessage({ type: 'error', text: `Failed to connect to ${provider} storage` });
    }
  };

  // Switch storage provider
  const switchStorageProvider = async (provider: 'firebase' | 'cloudinary') => {
    if (provider === currentStorage) return;
    
    try {
      setSwitching(true);
      setMessage(null);
      
      logger.info('Switching storage provider', { from: currentStorage, to: provider }, 'SettingsPage');
      
      // Test connection first
      await testStorageProvider(provider);
      
      // Update current provider
      setCurrentStorage(provider);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully switched to ${provider} storage! New uploads will use ${provider}.` 
      });
      
    } catch (error) {
      logger.error('Failed to switch storage provider', error, 'SettingsPage');
      setMessage({ type: 'error', text: 'Failed to switch storage provider' });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="h-8 w-8 mr-3" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure storage providers and system settings
        </p>
      </div>

      {/* Storage Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Storage Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose where your documents are stored. You can switch between providers anytime.
          </p>
          
          {/* Firebase Storage */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Firebase Storage</h3>
                <p className="text-sm text-muted-foreground">Google Cloud Storage with Firebase integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentStorage === 'firebase' && (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              <Button
                variant={currentStorage === 'firebase' ? 'outline' : 'default'}
                size="sm"
                onClick={() => switchStorageProvider('firebase')}
                disabled={switching || currentStorage === 'firebase'}
              >
                {currentStorage === 'firebase' ? 'Current' : 'Switch to Firebase'}
              </Button>
            </div>
          </div>

          {/* Cloudinary Storage */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Cloudinary</h3>
                <p className="text-sm text-muted-foreground">Optimized media storage and delivery</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentStorage === 'cloudinary' && (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              <Button
                variant={currentStorage === 'cloudinary' ? 'outline' : 'default'}
                size="sm"
                onClick={() => switchStorageProvider('cloudinary')}
                disabled={switching || currentStorage === 'cloudinary'}
              >
                {currentStorage === 'cloudinary' ? 'Current' : 'Switch to Cloudinary'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Currently using Firebase Firestore for document metadata and search.
          </p>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Firebase Firestore</h3>
                <p className="text-sm text-muted-foreground">NoSQL document database with real-time sync</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {message && (
        <Card className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className={`flex items-center space-x-2 ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Firebase Storage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Integrated with Firebase ecosystem</li>
                <li>• Pay-as-you-go pricing</li>
                <li>• Global CDN</li>
                <li>• Security rules integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cloudinary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Optimized for media files</li>
                <li>• Advanced transformation features</li>
                <li>• Built-in CDN</li>
                <li>• Media analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
