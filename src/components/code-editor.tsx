import React, { useState, useEffect } from 'react';
import { FolderTree, Loader2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import FileDirectory from './file-directory';
import Analytics from './analytics';
import { geminiApi } from '../services/gemini-api-service';

interface SavedFile {
    id: number;
    name: string;
    content: string;
    type: 'c' | 'rust';
}

const CodeEditor: React.FC<{ userId: number; handleLogout: () => void }> = ({ userId, handleLogout }) => {
    const [cCode, setCCode] = useState<string>('');
    const [rustCode, setRustCode] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [showRustTab, setShowRustTab] = useState<boolean>(false);
    const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
    const [isTranspiling, setIsTranspiling] = useState<boolean>(false);
    const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

    useEffect(() => {
        const loadFiles = async () => {
            const response = await fetch(`/api/files?userId=${userId}`);
            const data = await response.json();
            setSavedFiles(data);
        };
        loadFiles();
    }, [userId]);

    const handleFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.c';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setFileName(file.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    setCCode(content);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleSave = async () => {
        if (!fileName) {
            const name = prompt('Enter file name:');
            if (!name) return;
            setFileName(name);
        }

        const fileNameWithExtension = fileName.endsWith('.c') ? fileName : `${fileName}.c`;

        const response = await fetch('/api/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: fileNameWithExtension,
                content: cCode,
                type: 'c',
                userId,
            }),
        });

        if (response.ok) {
            const newFile = await response.json();
            setSavedFiles((prev) => [...prev, newFile]);
        }
    };

    const handleTranspile = async () => {
        if (!cCode.trim()) return;
        setIsTranspiling(true);
        try {
            const result = await geminiApi.transpile({
                sourceCode: cCode,
                fileName: fileName || 'untitled.c',
            });

            if (result.success && result.rustCode) {
                setRustCode(result.rustCode);
                setShowRustTab(true);
                setShowAnalytics(true);

                const rustFileName = fileName.replace('.c', '.rs');
                const response = await fetch('/api/files', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: rustFileName,
                        content: result.rustCode,
                        type: 'rust',
                        userId,
                    }),
                });

                if (response.ok) {
                    const newFile = await response.json();
                    setSavedFiles((prev) => [...prev, newFile]);
                }
            } else if (result.errors) {
                alert('Transpilation failed:\n' + result.errors.join('\n'));
            }
        } catch (error) {
            console.error('An error occurred during transpilation', error);
            alert('An error occurred during transpilation');
        } finally {
            setIsTranspiling(false);
        }
    };

    const handleDeleteFile = async (fileId: number) => {
        const response = await fetch('/api/files', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: fileId }),
        });

        if (response.ok) {
            setSavedFiles((prev) => prev.filter((file) => file.id !== fileId));
        }
    };

    const handleFileOpen = async (fileId: number) => {
        const file = savedFiles.find((file) => file.id === fileId);
        if (file) {
            setFileName(file.name);
            if (file.type === 'c') {
                setCCode(file.content);
                setShowRustTab(false);
                setShowAnalytics(false);
            } else {
                setRustCode(file.content);
                setShowRustTab(true);
                setShowAnalytics(true);
            }
        }
    };

    return (
        <div className="flex h-screen bg-neutral-900">
            <FileDirectory userId={userId} onFileSelect={handleFileOpen} />
            <div className="flex-1 flex flex-col">
                <div className="bg-red-950 p-4 flex items-center justify-between">
                    <h1 className="text-white text-xl font-bold">SALVAGE</h1>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="bg-red-900 text-white hover:bg-red-800 border-red-700"
                            onClick={handleFileSelect}
                        >
                            + Add File
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-red-900 text-white hover:bg-red-800 border-red-700"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-red-900 text-white hover:bg-red-800 border-red-700"
                            onClick={handleTranspile}
                            disabled={isTranspiling || !cCode.trim()}
                        >
                            {isTranspiling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Transpiling...
                                </>
                            ) : (
                                'Transpile'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-red-900 text-white hover:bg-red-800 border-red-700"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-4">
                    <Tabs defaultValue="c" className="h-full">
                        <TabsList className="bg-red-950">
                            <TabsTrigger value="c" className="text-white data-[state=active]:bg-red-900">
                                C Code
                            </TabsTrigger>
                            {showRustTab && (
                                <TabsTrigger value="rust" className="text-white data-[state=active]:bg-red-900">
                                    Rust Code
                                </TabsTrigger>
                            )}
                        </TabsList>
                        <TabsContent value="c" className="h-[calc(100%-40px)]">
                            <Textarea
                                value={cCode}
                                onChange={(e) => setCCode(e.target.value)}
                                placeholder="Enter your C code here..."
                                className="h-full bg-neutral-800 text-white border-red-900 focus-visible:ring-red-900"
                            />
                        </TabsContent>
                        <TabsContent value="rust" className="h-[calc(100%-40px)]">
                            <Textarea
                                value={rustCode}
                                onChange={(e) => setRustCode(e.target.value)}
                                placeholder="Transpiled Rust code will appear here..."
                                className="h-full bg-neutral-800 text-white border-red-900 focus-visible:ring-red-900"
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {showAnalytics && <Analytics cCode={cCode} rustCode={rustCode} />}
            </div>
        </div>
    );
};

export default CodeEditor;