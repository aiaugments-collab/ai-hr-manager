'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function DocumentUploadPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    logger.info('Files dropped for upload', { count: acceptedFiles.length }, 'DocumentUpload');
    
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      status: 'pending',
      progress: 0
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true
  });

  // Remove file from upload list
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload all files
  const uploadAllFiles = async () => {
    if (!params.teamId || uploadFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    logger.info('Starting batch document upload', { 
      count: uploadFiles.length, 
      teamId: params.teamId 
    }, 'DocumentUpload');
    
    const totalFiles = uploadFiles.length;
    let completedFiles = 0;
    
    // Process files one by one to avoid overwhelming the server
    for (const uploadFile of uploadFiles) {
      try {
        // Update file status to uploading
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));
        
        logger.info('Uploading document', { fileName: uploadFile.file.name }, 'DocumentUpload');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('teamId', params.teamId);
        formData.append('createdBy', 'current-user'); // TODO: Get from auth
        
        // Upload file
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const result = await response.json();
        
        // Update file status to success
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));
        
        logger.info('Document uploaded successfully', { 
          fileName: uploadFile.file.name,
          documentId: result.document?.id 
        }, 'DocumentUpload');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // Update file status to error
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', progress: 0, error: errorMessage }
            : f
        ));
        
        logger.error('Document upload failed', error, 'DocumentUpload');
      }
      
      completedFiles++;
      setUploadProgress((completedFiles / totalFiles) * 100);
    }
    
    setUploading(false);
    
    const successCount = uploadFiles.filter(f => f.status === 'success').length;
    const errorCount = uploadFiles.filter(f => f.status === 'error').length;
    
    logger.info('Batch upload completed', { 
      total: totalFiles,
      success: successCount,
      errors: errorCount 
    }, 'DocumentUpload');
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type badge color with gradient styling
  const getFileTypeBadge = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return <Badge className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-300 border-0 shadow-sm">PDF</Badge>;
      case 'doc':
      case 'docx':
        return <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border-0 shadow-sm">DOC</Badge>;
      case 'txt':
        return <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-700 dark:to-gray-700 text-slate-700 dark:text-slate-300 border-0 shadow-sm">TXT</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-700 dark:to-gray-700 text-slate-700 dark:text-slate-300 border-0 shadow-sm">FILE</Badge>;
    }
  };

  const hasSuccessfulUploads = uploadFiles.some(f => f.status === 'success');
  const allCompleted = uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'success' || f.status === 'error');

  return (
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/${params.teamId}/documents`}>
              <Button className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-200 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 h-10 px-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">Upload Documents</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Upload PDF, DOC, DOCX, or TXT files to your knowledge base
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">Select Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-lg' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 shadow-lg ${
                isDragActive 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
              }`}>
                <Upload className="h-8 w-8 text-white" />
              </div>
              {isDragActive ? (
                <div>
                  <p className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Drop the files here!</p>
                  <p className="text-blue-600 dark:text-blue-400">Release to upload your documents</p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Drag & drop files here, or click to browse</p>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Supports PDF, DOC, DOCX, TXT files up to 20MB each
                  </p>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl">
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">Files to Upload ({uploadFiles.length})</CardTitle>
              <div className="flex space-x-3">
                <Button
                  onClick={uploadAllFiles}
                  disabled={uploading || uploadFiles.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl h-10 px-4"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process Files
                    </>
                  )}
                </Button>
                {!uploading && (
                  <Button
                    onClick={() => setUploadFiles([])}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-200 rounded-xl text-slate-700 dark:text-slate-300"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {uploading && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Overall Progress</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full h-2" />
                </div>
              )}
              
              <div className="space-y-3">
                {uploadFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="flex items-center justify-between p-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center shadow-md">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{uploadFile.file.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {formatFileSize(uploadFile.file.size)}
                        </div>
                      </div>
                      {getFileTypeBadge(uploadFile.file.name)}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {uploadFile.status === 'pending' && (
                        <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-300 border-0 shadow-sm">
                          Pending
                        </Badge>
                      )}
                      {uploadFile.status === 'uploading' && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border-0 shadow-sm">
                            Uploading
                          </Badge>
                        </div>
                      )}
                      {uploadFile.status === 'success' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border-0 shadow-sm">
                            Success
                          </Badge>
                        </div>
                      )}
                      {uploadFile.status === 'error' && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <Badge className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-300 border-0 shadow-sm">
                            Error
                          </Badge>
                        </div>
                      )}
                      
                      {!uploading && (
                        <Button
                          onClick={() => removeFile(uploadFile.id)}
                          className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md transition-all duration-200 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {allCompleted && hasSuccessfulUploads && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-800/60 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">Upload completed!</span>
                    <p className="text-sm text-green-600 dark:text-green-400">Your documents have been successfully processed and added to the knowledge base.</p>
                  </div>
                </div>
                <Link href={`/dashboard/${params.teamId}/documents`}>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl h-10 px-6">
                    View Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
