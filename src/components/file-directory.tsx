import React, { useEffect, useState } from 'react';
import { File } from 'lucide-react';

interface FileDirectoryProps {
    userId: number;
    onFileSelect: (fileId: number) => void;
}

const FileDirectory: React.FC<FileDirectoryProps> = ({ userId, onFileSelect }) => {
    const [files, setFiles] = useState<{ id: number; name: string; type: string }[]>([]);

    useEffect(() => {
        const loadFiles = async () => {
            const response = await fetch(`/api/files?userId=${userId}`);
            const data = await response.json();
            setFiles(data);
        };
        loadFiles();
    }, [userId]);

    return (
        <div className="w-64 border-r border-red-900 p-4 text-white">
            <div className="flex items-center gap-2 mb-4">
                <File className="h-5 w-5 text-red-500" />
                <span className="font-semibold">Directory</span>
            </div>
            <ul>
                {files.map((file) => (
                    <li key={file.id} className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => onFileSelect(file.id)}
                            className="text-white hover:underline"
                        >
                            {file.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileDirectory;