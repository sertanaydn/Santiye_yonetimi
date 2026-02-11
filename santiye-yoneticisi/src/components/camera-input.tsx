
'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CameraInputProps {
    onPhotoTaken: (file: File) => void;
}

export function CameraInput({ onPhotoTaken }: CameraInputProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview
            const url = URL.createObjectURL(file);
            setPreview(url);
            onPhotoTaken(file);
        }
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-6 bg-neutral-50 text-center cursor-pointer hover:bg-neutral-100 transition h-48 flex flex-col items-center justify-center gap-2"
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="h-full object-contain mx-auto" />
                ) : (
                    <>
                        <span className="text-4xl">📷</span>
                        <span className="text-neutral-500 font-medium">Fotoğraf Çek / Yükle</span>
                        <span className="text-xs text-neutral-400">İrsaliye veya Fiş</span>
                    </>
                )}
            </div>

            {/* Hidden Input triggering native camera on mobile */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {preview && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full text-red-500"
                    onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                >
                    Fotoğrafı Kaldır
                </Button>
            )}
        </div>
    );
}
