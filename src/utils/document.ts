import { useRouter } from 'next/router';
import { prisma } from '@/services/prisma';
import Logger from '@/utils/logger';
import { Document, Prisma } from '@prisma/client';

export interface DocumentWithSignatures extends Document {
  signature: {
    id: string;
    documentId: string;
    signedAt: Date | null;
    signatureImg: string;
    userId: string;
    createdAt: Date;
  } | null;
}

export const useDocumentActions = (): {
  onSign: (documentId: string) => void;
  onDelete: (documentId: string) => Promise<void>;
} => {
  const router = useRouter();

  const onSign = (documentId: string): void => {
    router.push(`/documents/${documentId}/sign`);
  };

  const onDelete = async (documentId: string): Promise<void> => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      router.push('/documents');
    } catch (error) {
      Logger.error('Erro ao excluir documento:', error);
      throw error;
    }
  };

  return {
    onSign,
    onDelete
  };
};

export async function deleteDocument(id: string): Promise<Document> {
  try {
    return await prisma.document.delete({
      where: { id }
    });
  } catch (error) {
    Logger.error('Failed to delete document', error, { documentId: id });
    throw error;
  }
}

export async function getDocument(id: string): Promise<DocumentWithSignatures> {
  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        signature: true
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document as DocumentWithSignatures;
  } catch (error) {
    Logger.error('Failed to fetch document', error, { documentId: id });
    throw error;
  }
}

export async function updateDocument(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
  try {
    return await prisma.document.update({
      where: { id },
      data
    });
  } catch (error) {
    Logger.error('Failed to update document', error, { documentId: id });
    throw error;
  }
} 