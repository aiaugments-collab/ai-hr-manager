'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: any;
}

interface UploadResult {
  fileName: string;
  success: boolean;
  error?: string;
  candidateId?: string;
  candidate?: any;
  score?: number;
}

export default function UploadPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending'
      }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('teamId', params.teamId);
      
      files.forEach(({ file }) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/candidates/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success || result.results) {
        // Update file statuses based on results
        setFiles(prev => prev.map(file => {
          const uploadResult = result.results?.find((r: UploadResult) => r.fileName === file.file.name);
          return {
            ...file,
            status: uploadResult?.success ? 'completed' : 'error',
            error: uploadResult?.error || (uploadResult?.success ? null : 'Processing failed'),
            result: uploadResult
          };
        }));
        setUploadProgress(100);
      } else {
        console.error('Upload failed:', result.error);
        // Mark all files as error if the entire request failed
        setFiles(prev => prev.map(file => ({
          ...file,
          status: 'error',
          error: result.error || 'Upload request failed'
        })));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        error: 'Upload failed'
      })));
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 border-green-200 shadow-sm';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-pink-100 text-red-700 border-red-200 shadow-sm';
      case 'processing':
        return 'bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-700 border-blue-200 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border-gray-200 shadow-sm';
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const hasCompletedFiles = completedCount > 0;

  return (
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/${params.teamId}/candidates`}>
            <Button className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-200 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Candidates
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Upload CVs</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Upload multiple PDF files and let AI analyze them to extract structured candidate data
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Area */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Select PDF Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg scale-105'
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Drag & drop PDF files here
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  or click to browse files
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                />
                <Button 
                  onClick={() => document.getElementById('file-input')?.click()}
                  type="button"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl px-6"
                >
                  Browse Files
                </Button>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                  PDF files only, max 10MB each
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">Selected Files ({files.length})</h4>
                    {!isUploading && (
                      <Button 
                        onClick={uploadFiles} 
                        disabled={files.length === 0}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 rounded-lg"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Process Files
                      </Button>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-medium text-blue-700 dark:text-blue-300">🤖 AI analyzing CVs with Gemini...</span>
                        <span className="font-bold text-blue-800 dark:text-blue-200">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Processing {files.length} files in parallel batches
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-600/60 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getStatusIcon(file.status)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {file.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {file.error && (
                              <div className="mt-1">
                                <p className="text-xs text-red-600 font-medium">
                                  Error: {file.error}
                                </p>
                                {file.error.includes('API key') && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Please check your Gemini API configuration
                                  </p>
                                )}
                                {file.error.includes('quota') && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Try again later or check your API limits
                                  </p>
                                )}
                                {file.error.includes('rate limit') && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Please wait a moment before trying again
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(file.status)}`}
                          >
                            {file.status}
                          </Badge>
                          {file.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No files selected yet</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Upload PDF files to see processing results.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl shadow-sm">
                      <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{files.length}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Files</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl shadow-sm">
                      <div className="text-3xl font-bold text-green-800 dark:text-green-200">{completedCount}</div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">Processed</div>
                    </div>
                  </div>

                  {hasCompletedFiles && (
                    <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                      <Button 
                        onClick={() => router.push(`/dashboard/${params.teamId}/candidates`)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl py-3"
                      >
                        View Processed Candidates
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
