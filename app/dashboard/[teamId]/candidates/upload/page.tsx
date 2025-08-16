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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const hasCompletedFiles = completedCount > 0;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/${params.teamId}/candidates`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Candidates
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Upload CVs</h2>
            <p className="text-muted-foreground">
              Upload multiple PDF files and let AI analyze them to extract structured candidate data
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Select PDF Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Drag & drop PDF files here
                </h3>
                <p className="text-muted-foreground mb-4">
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
                  variant="outline" 
                  onClick={() => document.getElementById('file-input')?.click()}
                  type="button"
                >
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  PDF files only, max 10MB each
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Selected Files ({files.length})</h4>
                    {!isUploading && (
                      <Button onClick={uploadFiles} disabled={files.length === 0}>
                        <Upload className="h-4 w-4 mr-2" />
                        Process Files
                      </Button>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>🤖 AI analyzing CVs with Gemini...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-muted-foreground mt-2">
                        Processing {files.length} files in parallel batches
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No files selected yet. Upload PDF files to see processing results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{files.length}</div>
                      <div className="text-sm text-muted-foreground">Total Files</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                      <div className="text-sm text-muted-foreground">Processed</div>
                    </div>
                  </div>

                  {hasCompletedFiles && (
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => router.push(`/dashboard/${params.teamId}/candidates`)}
                        className="w-full"
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
