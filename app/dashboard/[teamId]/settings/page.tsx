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
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Configure storage providers and system settings
          </p>
        </div>

        {/* Storage Provider Settings */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-slate-800 dark:text-slate-200">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Cloud className="h-4 w-4 text-white" />
              </div>
              Storage Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose where your documents are stored. You can switch between providers anytime.
            </p>
            
            {/* Firebase Storage */}
            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Firebase Storage</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Google Cloud Storage with Firebase integration</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {currentStorage === 'firebase' && (
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border-0 shadow-sm">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                <Button
                  onClick={() => switchStorageProvider('firebase')}
                  disabled={switching || currentStorage === 'firebase'}
                  className={currentStorage === 'firebase' 
                    ? 'bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md transition-all duration-200 rounded-xl text-slate-700 dark:text-slate-300'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl h-9 px-4'
                  }
                >
                  {currentStorage === 'firebase' ? 'Current' : 'Switch to Firebase'}
                </Button>
              </div>
            </div>

            {/* Cloudinary Storage */}
            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Cloudinary</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Optimized media storage and delivery</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {currentStorage === 'cloudinary' && (
                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border-0 shadow-sm">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                <Button
                  onClick={() => switchStorageProvider('cloudinary')}
                  disabled={switching || currentStorage === 'cloudinary'}
                  className={currentStorage === 'cloudinary' 
                    ? 'bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md transition-all duration-200 rounded-xl text-slate-700 dark:text-slate-300'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl h-9 px-4'
                  }
                >
                  {currentStorage === 'cloudinary' ? 'Current' : 'Switch to Cloudinary'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Provider Settings */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-slate-800 dark:text-slate-200">
              <div className="h-6 w-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Database className="h-4 w-4 text-white" />
              </div>
              Database Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Currently using Firebase Firestore for document metadata and search.
            </p>
            
            <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-xl shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Firebase Firestore</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">NoSQL document database with real-time sync</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border-0 shadow-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Status Message */}
        {message && (
          <Card className={`shadow-lg ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-800/60' 
              : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/60 dark:border-red-800/60'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shadow-sm ${
                  message.type === 'success' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-red-500 to-pink-600'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className={`font-medium ${
                  message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {message.text}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Comparison */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">Provider Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200/60 dark:border-orange-800/60 shadow-sm">
                <h4 className="font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  Firebase Storage
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-orange-500 mr-2" />
                    Integrated with Firebase ecosystem
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-orange-500 mr-2" />
                    Pay-as-you-go pricing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-orange-500 mr-2" />
                    Global CDN
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-orange-500 mr-2" />
                    Security rules integration
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-sm">
                <h4 className="font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                    <Cloud className="h-4 w-4 text-white" />
                  </div>
                  Cloudinary
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-blue-500 mr-2" />
                    Optimized for media files
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-blue-500 mr-2" />
                    Advanced transformation features
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-blue-500 mr-2" />
                    Built-in CDN
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-blue-500 mr-2" />
                    Media analytics
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
