import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, 
  Youtube as YoutubeIcon, Type, Highlighter, Undo, Redo, 
  Heading1, Heading2, Heading3, Palette, Eraser
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuButton = ({ 
  onClick, 
  active, 
  disabled, 
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-1.5 rounded-lg transition-all",
      active 
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm" 
        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    )}
  >
    {children}
  </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-4',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-2xl w-full aspect-video my-4',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYoutube = useCallback(() => {
    const url = window.prompt('YouTube URL');
    if (url) {
      editor?.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-zinc-200 dark:border-zinc-700">
          <MenuButton 
            onClick={() => editor.chain().focus().undo().run()} 
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().redo().run()} 
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={16} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-zinc-200 dark:border-zinc-700">
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-zinc-200 dark:border-zinc-700">
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            active={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            active={editor.isActive('strike')}
            title="Strike"
          >
            <Strikethrough size={16} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-zinc-200 dark:border-zinc-700">
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            active={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-zinc-200 dark:border-zinc-700">
          <MenuButton onClick={setLink} active={editor.isActive('link')} title="Insert Link">
            <LinkIcon size={16} />
          </MenuButton>
          <MenuButton onClick={addImage} title="Insert Image">
            <ImageIcon size={16} />
          </MenuButton>
          <MenuButton onClick={addYoutube} title="Insert YouTube Video">
            <YoutubeIcon size={16} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative group">
            <MenuButton onClick={() => {}} title="Text Color">
              <Palette size={16} />
            </MenuButton>
            <div className="absolute hidden group-hover:flex top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-xl shadow-xl z-20 gap-1 grid grid-cols-4">
              {['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="relative group">
            <MenuButton onClick={() => {}} title="Highlight Color">
              <Highlighter size={16} />
            </MenuButton>
            <div className="absolute hidden group-hover:flex top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded-xl shadow-xl z-20 gap-1 grid grid-cols-4">
              {['#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fed7aa', '#fecaca', '#f3f4f6', 'transparent'].map(color => (
                <button
                  key={color}
                  onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                  className="w-5 h-5 rounded border border-black/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <MenuButton 
            onClick={() => {
              editor.chain().focus().unsetAllMarks().run();
              editor.chain().focus().clearNodes().run();
            }} 
            title="Clear Formatting"
          >
            <Eraser size={16} />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-6 min-h-[400px] prose prose-zinc dark:prose-invert max-w-none focus:outline-none">
        <EditorContent editor={editor} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap {
          outline: none !important;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
      `}} />
    </div>
  );
};
