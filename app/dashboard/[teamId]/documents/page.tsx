'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DocumentService } from '@/lib/services/document-service';
import { Document } from '@/lib/types/document';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Search, 
  Trash2, 
  Download,
  Loader2, 
  AlertCircle,
  File,
  FileImage
} from 'lucide-react';

export default function DocumentsPage() {
  const params = useParams<{ teamId: string }>();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      // Using logger with context 'DocumentsPage'
      
      try {
        setLoading(true);
        setError(null);
        
        if (!params.teamId) {
          throw new Error('Team ID is required');
        }
        
        logger.info('Fetching documents via API', { teamId: params.teamId }, 'DocumentsPage');
        
        const response = await fetch(`/api/documents?teamId=${params.teamId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch documents');
        }
        
        const data = await response.json();
        setDocuments(data.documents);
        
        logger.info('Documents loaded successfully via API', { count: data.documents.length }, 'DocumentsPage');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
        setError(errorMessage);
        logger.error('Failed to fetch documents', err, 'DocumentsPage');
      } finally {
        setLoading(false);
      }
    };

    if (params.teamId) {
      fetchDocuments();
    }
  }, [params.teamId]);

  // Handle document search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !params.teamId) return;
    
    try {
      setSearching(true);
      setError(null);
      logger.info('Searching documents via API', { query: searchQuery, teamId: params.teamId }, 'DocumentsPage');
      
      const response = await fetch(`/api/documents/search?teamId=${params.teamId}&query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }
      
      const data = await response.json();
      setDocuments(data.results.map((result: any) => result.document));
      
      logger.info('Search completed via API', { query: searchQuery, results: data.results.length }, 'DocumentsPage');
      
    } catch (err) {
      logger.error('Search failed', err, 'DocumentsPage');
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }
    
    try {
      setDeleting(documentId);
      setError(null);
      logger.info('Deleting document via API', { documentId, documentName }, 'DocumentsPage');
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      logger.info('Document deleted successfully via API', { documentId, documentName }, 'DocumentsPage');
      
    } catch (err) {
      logger.error('Failed to delete document', err, 'DocumentsPage');
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Clear search and reload all documents
  const clearSearch = async () => {
    setSearchQuery('');
    if (params.teamId) {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/documents?teamId=${params.teamId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reload documents');
        }
        
        const data = await response.json();
        setDocuments(data.documents);
        
      } catch (err) {
        logger.error('Failed to reload documents', err, 'DocumentsPage');
        setError('Failed to reload documents. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Get file icon based on type with modern gradient styling
  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <File className="h-5 w-5 text-white" />
          </div>
        );
      case 'txt':
        return (
          <div className="h-10 w-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center shadow-md">
            <FileImage className="h-5 w-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 bg-gradient-to-br from-slate-400 to-gray-500 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
        );
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to safely format dates that might be strings from API
  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex-col min-h-screen">
        <div className="flex-1 space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Loading documents...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Documents</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your company documents and knowledge base
          </p>
        </div>
        <Link href={`/dashboard/${params.teamId}/documents/upload`}>
            <Button className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-10 px-4 gap-2">
              <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
        </Link>
      </div>

      {/* Search */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
        <CardContent className="pt-6">
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search documents by name or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-11 h-11 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={!searchQuery.trim() || searching}
                className="h-11 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl px-6"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            {searchQuery && (
                <Button 
                  onClick={clearSearch}
                  className="h-11 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-200 rounded-xl"
                >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
          <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/60 dark:border-red-800/60 shadow-lg">
          <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
            <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">No documents found</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                      {searchQuery ? 'No documents match your search criteria. Try adjusting your search terms.' : 'Upload your first document to get started with your knowledge base.'}
                </p>
                <Link href={`/dashboard/${params.teamId}/documents/upload`}>
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl h-11 px-6">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
            </div>
        ) : (
          documents.map((document) => (
              <Card key={document.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                  <div className="flex flex-col space-y-4">
                    {/* Document Icon and Type */}
                <div className="flex items-center justify-between">
                    {getFileIcon(document.type)}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => window.open(document.fileUrl, '_blank')}
                          className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md transition-all duration-200 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 h-9 w-9 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(document.id, document.name)}
                      disabled={deleting === document.id}
                          className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 hover:shadow-md transition-all duration-200 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 w-9 p-0"
                    >
                      {deleting === document.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                      </div>
                    </div>
                    
                    {/* Document Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg leading-tight line-clamp-2" title={document.name}>
                        {document.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{formatFileSize(document.size)}</span>
                        <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-0 shadow-sm">
                          {document.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-500 dark:text-slate-500 text-sm">
                        Uploaded {formatDate(document.uploadedAt)}
                      </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {documents.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
          <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">Document Statistics</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-sm">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{documents.length}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Documents</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/60 dark:border-green-800/60 shadow-sm">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Download className="h-6 w-6 text-white" />
              </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
                </div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Size</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200/60 dark:border-purple-800/60 shadow-sm">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                    <File className="h-6 w-6 text-white" />
              </div>
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {new Set(documents.map(doc => doc.type)).size}
                </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">File Types</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
