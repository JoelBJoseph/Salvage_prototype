import { useState, useEffect } from "react";
import { FolderTree, Loader2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import FileDirectory from "./file-directory";
import Analytics from "./analytics";

interface SavedFile {
    id: number;
    name: string;
    content: string;
    type: "c" | "rust";
}

export default function CodeEditor({ userId, handleLogout }: { userId: number; handleLogout: () => void }) {
    const [cCode, setCCode] = useState<string>("");
    const [rustCode, setRustCode] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [showRustTab, setShowRustTab] = useState<boolean>(false);
    const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
    const [isTranspiling, setIsTranspiling] = useState<boolean>(false);
    const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

    // Load files from the backend
    useEffect(() => {
        const loadFiles = async () => {
            try {
                const response = await fetch(`/api/files?userId=${userId}`);
                if (!response.ok) {
                    throw new Error("Failed to load files");
                }
                const files = await response.json();
                setSavedFiles(files);
            } catch (error) {
                console.error("Error loading files:", error);
            }
        };
        loadFiles();
    }, [userId]);

    // Handle file selection
    const handleFileSelect = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".c";
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

    // Save file to the backend
    const handleSave = async () => {
        if (!fileName) {
            const name = prompt("Enter file name:");
            if (!name) return;
            setFileName(name);
        }

        const fileNameWithExtension = fileName.endsWith(".c") ? fileName : `${fileName}.c`;

        try {
            const response = await fetch("/api/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: fileNameWithExtension,
                    content: cCode,
                    type: "c",
                    userId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save file");
            }

            const newFile = await response.json();
            setSavedFiles((prev) => [...prev, newFile]);
        } catch (error) {
            console.error("Error saving file:", error);
        }
    };

    // Transpile C code to Rust
    const handleTranspile = async () => {
        if (!cCode.trim()) return;
        setIsTranspiling(true);
        try {
            const response = await fetch("/api/transpile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sourceCode: cCode,
                    fileName: fileName || "untitled.c",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to transpile");
            }

            const result = await response.json();
            if (result.success && result.rustCode) {
                setRustCode(result.rustCode);
                setShowRustTab(true);
                setShowAnalytics(true);

                const rustFileName = fileName.replace(".c", ".rs");
                const fileResponse = await fetch("/api/files", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: rustFileName,
                        content: result.rustCode,
                        type: "rust",
                        userId,
                    }),
                });

                if (fileResponse.ok) {
                    const newFile = await fileResponse.json();
                    setSavedFiles((prev) => [...prev, newFile]);
                }
            } else if (result.errors) {
                alert("Transpilation failed:\n" + result.errors.join("\n"));
            }
        } catch (error) {
            console.error("An error occurred during transpilation", error);
            alert("An error occurred during transpilation");
        } finally {
            setIsTranspiling(false);
        }
    };

    // Delete a file
    const handleDeleteFile = async (fileId: number) => {
        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete file");
            }

            setSavedFiles((prev) => prev.filter((file) => file.id !== fileId));
        } catch (error) {
            console.error("Error deleting file:", error);
        }
    };

    // Open a file
    const handleFileOpen = (selectedFileId: number) => {
        const selectedFile = savedFiles.find((file) => file.id === selectedFileId);
        if (selectedFile) {
            setFileName(selectedFile.name);
            if (selectedFile.type === "c") {
                setCCode(selectedFile.content);
                setShowRustTab(false);
                setShowAnalytics(false);
            } else {
                setRustCode(selectedFile.content);
                setShowRustTab(true);
                setShowAnalytics(true);
            }
        }
    };

    return (
        <div className="flex h-screen bg-neutral-900">
            <div className="w-64 border-r border-red-900 p-4 text-white">
                <div className="flex items-center gap-2 mb-4">
                    <FolderTree className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">Directory</span>
                </div>
                <ul>
                    {savedFiles.map((file) => (
                        <li key={file.id} className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => handleFileOpen(file.id)}
                                className="text-white hover:underline"
                            >
                                {file.name}
                            </button>
                            <Trash
                                className="h-4 w-4 text-red-500 cursor-pointer"
                                onClick={() => handleDeleteFile(file.id)}
                            />
                        </li>
                    ))}
                </ul>
            </div>

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
                                "Transpile"
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
}