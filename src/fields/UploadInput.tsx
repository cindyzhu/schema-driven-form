import React, { useRef } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  file?: File;
}

export const UploadInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const files: FileInfo[] = Array.isArray(field.value) ? field.value : [];
  const multiple = definition.props?.multiple ?? false;
  const accept = definition.props?.accept ?? '';
  const maxSize = definition.props?.maxSize; // in bytes

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileInfo[] = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    // Filter by size if maxSize is set
    const validFiles = maxSize
      ? newFiles.filter((f) => f.size <= maxSize)
      : newFiles;

    if (multiple) {
      field.onChange([...files, ...validFiles]);
    } else {
      field.onChange(validFiles.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    field.onChange(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <FieldWrapper field={field} definition={definition}>
      <div
        className="df-upload"
        onClick={() => !field.disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!field.disabled && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <div className="df-upload__text">
          Click or drag files to upload
        </div>
        <div className="df-upload__hint">
          {accept ? `Accepted: ${accept}` : 'All file types'}
          {maxSize ? ` | Max: ${formatSize(maxSize)}` : ''}
        </div>
      </div>
      {files.length > 0 && (
        <div className="df-upload__files">
          {files.map((f, i) => (
            <div key={i} className="df-upload__file">
              <span>{f.name} ({formatSize(f.size)})</span>
              <button
                type="button"
                className="df-upload__file-remove"
                onClick={() => removeFile(i)}
                disabled={field.disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </FieldWrapper>
  );
};
