import { useState } from 'react';

import {
  GripVertical,
  Trash2,
  Type,
  Video,
  Image as ImageIcon,
  Code,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import type {
  LessonBlock,
  BlockType,
} from '@/features/courses/api/courses-api';
import { cn } from '@/lib/utils';

interface BlockEditorProps {
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addBlock = (type: BlockType) => {
    const newBlock: LessonBlock = {
      id: generateId(),
      type,
      content: '',
      orderIndex: blocks.length,
      metadata: type === 'code' ? { language: 'javascript' } : {},
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<LessonBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Bounds check
    if (targetIndex < 0 || targetIndex >= blocks.length) {
      return;
    }

    const newBlocks = [...blocks];

    // Use splice to move elements to avoid direct index assignment warnings
    // Remove the item from the current index
    const [movedItem] = newBlocks.splice(index, 1);

    // Insert the item at the target index
    if (movedItem) {
      newBlocks.splice(targetIndex, 0, movedItem);
    }

    // Reassign order indices using map to avoid direct object property injection
    const reordered = newBlocks.map((block, i) => ({
      ...block,
      orderIndex: i,
    }));

    onChange(reordered);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    const newBlocks = [...blocks];

    // Use splice to extract the dragged item directly
    const [draggedItem] = newBlocks.splice(draggedIndex, 1);

    // Insert at new position if item exists
    if (draggedItem) {
      newBlocks.splice(index, 0, draggedItem);
    }

    // Update order indices safely using map
    const reordered = newBlocks.map((block, i) => ({
      ...block,
      orderIndex: i,
    }));

    // Update parent state immediately for dynamic feel
    onChange(reordered);

    // Update local tracker
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()} // Allow dropping
            className={cn(
              'group relative flex gap-4 p-4 border border-border rounded-xl bg-card transition-all',
              draggedIndex === index
                ? 'opacity-50 border-dashed border-primary'
                : 'hover:shadow-md',
            )}
          >
            <div className="flex flex-col gap-2 items-center justify-center pt-2">
              <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveBlock(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 'down')}
                  disabled={index === blocks.length - 1}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                  {getBlockIcon(block.type)}
                  {block.type} Block
                </span>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {renderBlockInput(block, (updates) => {
                void updateBlock(block.id, updates);
              })}
            </div>
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
          <p className="text-muted-foreground">
            Start adding content blocks to build your lesson
          </p>
        </div>
      )}

      <div className="sticky bottom-4 z-10 p-2 bg-background/80 backdrop-blur-md border border-border rounded-xl shadow-lg flex gap-2 justify-center">
        <ToolboxButton
          icon={Type}
          label="Text"
          onClick={() => addBlock('text')}
        />
        <ToolboxButton
          icon={Video}
          label="Video"
          onClick={() => addBlock('video')}
        />
        <ToolboxButton
          icon={ImageIcon}
          label="Image"
          onClick={() => addBlock('image')}
        />
        <ToolboxButton
          icon={Code}
          label="Code"
          onClick={() => addBlock('code')}
        />
      </div>
    </div>
  );
}

// ... ToolboxButton, getBlockIcon, renderBlockInput ...
function ToolboxButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 hover:border-primary hover:text-primary"
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case 'text':
      return <Type className="w-3 h-3" />;
    case 'video':
      return <Video className="w-3 h-3" />;
    case 'image':
      return <ImageIcon className="w-3 h-3" />;
    case 'code':
      return <Code className="w-3 h-3" />;
    default:
      return <Type className="w-3 h-3" />;
  }
}

function renderBlockInput(
  block: LessonBlock,
  onChange: (updates: Partial<LessonBlock>) => void,
) {
  switch (block.type) {
    case 'text':
      return (
        <MarkdownEditor
          value={block.content}
          onChange={(val) => {
            onChange({ content: val });
          }}
          placeholder="Write your lesson content here..."
        />
      );
    case 'video':
      return (
        <div className="space-y-2">
          <Input
            value={block.content}
            onChange={(e) => {
              onChange({ content: e.target.value });
            }}
            placeholder="Paste video URL (YouTube, Vimeo, or MP4)"
          />
          <p className="text-xs text-muted-foreground">
            Or upload a video file via the upload tab
          </p>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2">
          <ImageUpload
            value={block.content}
            onChange={(url) => onChange({ content: url ?? '' })}
            className="w-full h-48"
          />
          <Input
            value={block.metadata?.caption ?? ''}
            onChange={(e) => {
              onChange({
                metadata: { ...block.metadata, caption: e.target.value },
              });
            }}
            placeholder="Add a caption (optional)"
            className="text-sm"
          />
        </div>
      );
    case 'code':
      return (
        <div className="space-y-2 border border-input rounded-lg overflow-hidden">
          <div className="bg-muted px-3 py-1 border-b border-input flex gap-2">
            <select
              value={block.metadata?.language ?? 'javascript'}
              onChange={(e) => {
                onChange({
                  metadata: { ...block.metadata, language: e.target.value },
                });
              }}
              className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </div>
          <textarea
            value={block.content}
            onChange={(e) => {
              onChange({ content: e.target.value });
            }}
            className="w-full min-h-[150px] p-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm focus:outline-none"
            placeholder="// Write code here"
            spellCheck={false}
          />
        </div>
      );
    default:
      return null;
  }
}
