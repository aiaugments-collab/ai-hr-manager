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

  // Get file type badge color
  const getFileTypeBadge = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">PDF</Badge>;
      case 'doc':
      case 'docx':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">DOC</Badge>;
      case 'txt':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">TXT</Badge>;
      default:
        return <Badge variant="secondary">FILE</Badge>;
    }
  };

  const hasSuccessfulUploads = uploadFiles.some(f => f.status === 'success');
  const allCompleted = uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'success' || f.status === 'error');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/${params.teamId}/documents`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Upload Documents</h1>
            <p className="text-muted-foreground">
              Upload PDF, DOC, DOCX, or TXT files to your knowledge base
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT files up to 20MB each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Files to Upload ({uploadFiles.length})</CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={uploadAllFiles}
                disabled={uploading || uploadFiles.length === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All
                  </>
                )}
              </Button>
              {!uploading && (
                <Button
                  variant="outline"
                  onClick={() => setUploadFiles([])}
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
            
            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{uploadFile.file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </div>
                    </div>
                    {getFileTypeBadge(uploadFile.file.name)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'pending' && (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <Badge variant="outline">Uploading</Badge>
                      </div>
                    )}
                    {uploadFile.status === 'success' && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          Success
                        </Badge>
                      </div>
                    )}
                    {uploadFile.status === 'error' && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <Badge variant="outline" className="border-red-500 text-red-700">
                          Error
                        </Badge>
                      </div>
                    )}
                    
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
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
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Upload completed!</span>
              </div>
              <Link href={`/dashboard/${params.teamId}/documents`}>
                <Button variant="outline">
                  View Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
