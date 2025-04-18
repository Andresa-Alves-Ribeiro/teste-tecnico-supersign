import { useEffect } from 'react';
import useDocumentStore from '@/store/useDocumentStore';
import Loading from '@/components/Loading';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Document as DocumentType } from '@/types/interfaces';
import { DocumentStatus } from '@/types/enums';
import { documentStatusConfig } from '@/constants/documentStatus';
import { formatFileSizeInMB } from '@/utils/file';
import { toast } from 'react-hot-toast';
import Logger from '@/utils/logger';
import { Document as PrismaDocument } from '@prisma/client';

interface ApiErrorResponse {
  message: string;
}

// Adapter function to convert API document to store document type
const adaptDocument = (doc: DocumentType): PrismaDocument => {
  return {
    ...doc,
    mimeType: doc.mimeType ?? null,
    size: doc.size ?? null,
    fileUrl: doc.fileKey, // Map fileKey to fileUrl as expected by Prisma
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt)
  } as PrismaDocument;
};

const DocumentList = (): JSX.Element => {
  const { documents, loading, error, setDocuments, setLoading, setError } = useDocumentStore();

  useEffect(() => {
    let isMounted = true;

    const fetchDocuments = async (): Promise<void> => {
      if (loading) return; // Prevent multiple simultaneous requests
            
      setLoading(true);
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          const errorData = await response.json() as ApiErrorResponse;
          throw new Error(errorData.message || 'Failed to fetch documents');
        }
        const data = await response.json() as DocumentType[];
        if (isMounted) {
          setDocuments(data.map(adaptDocument));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error fetching documents';
        Logger.error('Error fetching documents:', errorMessage);
        if (isMounted) {
          setError(errorMessage);
          toast.error('Failed to load documents. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchDocuments();

    return () => {
      isMounted = false;
    };
  }, [setDocuments, setLoading, setError, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading text="Carregando documentos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-red-500">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tamanho
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((document) => {
            const status = document.status as DocumentStatus;
            const statusConfig = documentStatusConfig[status];

            return (
              <motion.tr
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: documents.indexOf(document) * 0.1 }}
              >
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{document.name}</div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left">
                  <div className="text-sm text-gray-500">
                    {document.size ? formatFileSizeInMB(document.size) : '-'}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.icon}
                    <span className="ml-1">{statusConfig.label}</span>
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/documents/${document.id}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Visualizar
                  </Link>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList; 