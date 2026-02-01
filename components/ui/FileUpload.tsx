'use client';

import { useState, useRef } from 'react';
import { DesignImage, MockupPSD } from '@/types';

interface FileUploadProps {
  label: string;
  accept: string;
  multiple?: boolean;
  onUpload: (file: DesignImage | MockupPSD | (DesignImage | MockupPSD)[]) => void;
  uploadedFile?: DesignImage | MockupPSD | null;
  uploadedFiles?: (DesignImage | MockupPSD)[];
}

export default function FileUpload({
  label,
  accept,
  multiple = false,
  onUpload,
  uploadedFile,
  uploadedFiles = [],
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (multiple) {
        onUpload(result.files);
      } else {
        onUpload(result.files[0]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file(s)');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayFiles = multiple ? uploadedFiles : (uploadedFile ? [uploadedFile] : []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id={`file-upload-${label}`}
        />
        <label
          htmlFor={`file-upload-${label}`}
          className="cursor-pointer flex flex-col items-center justify-center space-y-2"
        >
          <span className="text-gray-600 dark:text-gray-400">
            {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">{accept}</span>
        </label>
      </div>
      {displayFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {displayFiles.map((file, idx) => (
            <div key={file.id || idx} className="text-sm text-gray-600 dark:text-gray-400">
              ✓ {file.originalName} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
