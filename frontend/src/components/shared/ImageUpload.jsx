"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, GripVertical, ImagePlus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

/**
 * ImageUpload — Combined image upload + management component.
 *
 * Props:
 *  - existingImages: string[] (URLs of existing images)
 *  - newFiles: File[] (newly selected files not yet uploaded)
 *  - onNewFilesChange: (files: File[]) => void
 *  - onExistingImagesReorder: (images: string[]) => void
 *  - onExistingImageDelete: (url: string) => void
 *  - maxFiles: number (default 10)
 */
export default function ImageUpload({
    existingImages = [],
    newFiles = [],
    onNewFilesChange,
    onExistingImagesReorder,
    onExistingImageDelete,
    maxFiles = 10,
}) {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'existing' | 'new', value: string | number }

    const totalCount = existingImages.length + newFiles.length;

    const handleFiles = useCallback((files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
        const remaining = maxFiles - totalCount;
        const toAdd = imageFiles.slice(0, Math.max(0, remaining));
        if (toAdd.length > 0) {
            onNewFilesChange([...newFiles, ...toAdd]);
        }
    }, [newFiles, onNewFilesChange, maxFiles, totalCount]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const confirmDeleteExisting = (url) => {
        setDeleteTarget({ type: "existing", value: url });
    };

    const confirmDeleteNew = (index) => {
        setDeleteTarget({ type: "new", value: index });
    };

    const executeDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "existing") {
            onExistingImageDelete(deleteTarget.value);
        } else {
            onNewFilesChange(newFiles.filter((_, i) => i !== deleteTarget.value));
        }
        setDeleteTarget(null);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const from = result.source.index;
        const to = result.destination.index;
        if (from === to) return;

        const reordered = [...existingImages];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        onExistingImagesReorder(reordered);
    };

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragOver
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/40 bg-surface-2 hover:bg-muted/50"
                    }`}
            >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${dragOver ? "bg-primary/10" : "bg-muted"
                    }`}>
                    <ImagePlus size={18} className={dragOver ? "text-primary" : "text-text-light"} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        {dragOver ? "Drop images here" : "Click or drag images to upload"}
                    </p>
                    <p className="text-[10px] text-text-light mt-0.5">
                        {totalCount}/{maxFiles} images · PNG, JPG, WebP
                    </p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
            </div>

            {/* Existing images — reorderable */}
            {existingImages.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">
                        Current Images (drag to reorder)
                    </p>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="existing-images" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar"
                                >
                                    {existingImages.map((url, i) => (
                                        <Draggable key={url} draggableId={url} index={i}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border group/img ${snapshot.isDragging ? "ring-2 ring-ring shadow-lg" : "border-[rgba(0,0,0,0.08)]"
                                                        }`}
                                                >
                                                    <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" />
                                                    {/* Grip handle */}
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="absolute top-0.5 left-0.5 p-0.5 rounded bg-black/40 text-white opacity-0 group-hover/img:opacity-100 transition-opacity cursor-grab"
                                                    >
                                                        <GripVertical size={10} />
                                                    </div>
                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); confirmDeleteExisting(url); }}
                                                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-primary-foreground opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-destructive"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    {/* First image indicator */}
                                                    {i === 0 && (
                                                        <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
                                                            COVER
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            )}

            {/* New files preview */}
            {newFiles.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">
                        New Images (pending upload)
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {newFiles.map((file, i) => (
                            <div key={`new-${i}-${file.name}`} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-primary/20 group/img bg-muted">
                                <Image
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); confirmDeleteNew(i); }}
                                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-primary-foreground opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-destructive"
                                >
                                    <X size={10} />
                                </button>
                                <span className="absolute bottom-0 inset-x-0 text-[8px] bg-primary/80 text-primary-foreground text-center py-0.5 truncate px-1">
                                    NEW
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirm delete dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                onConfirm={executeDelete}
                title="Remove this image?"
                description={deleteTarget?.type === "existing"
                    ? "This image will be permanently deleted from the server."
                    : "This image will be removed from your upload queue."
                }
                confirmText="Remove Image"
            />
        </div>
    );
}
