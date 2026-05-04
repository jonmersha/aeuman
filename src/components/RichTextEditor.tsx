import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, 
  Youtube as YoutubeIcon, Type, Highlighter, Undo, Redo, 
  Heading1, Heading2, Heading3, Palette, Eraser, X, Check, Code,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
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
  const [activeMenu, setActiveMenu] = useState<'link' | 'image' | 'video' | 'color' | 'highlight' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [sourceCode, setSourceCode] = useState(content);

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
          class: 'rounded-2xl w-full aspect-video my-4 border border-zinc-200 dark:border-zinc-800 shadow-xl',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[400px]',
      },
      transformPastedHTML(html) {
        // Remove weird Word styles that might break things, but keep basic formatting
        return html.replace(/<style([\s\S]*?)<\/style>/gi, '');
      },
    },
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setSourceCode(html);
    },
  });

  // Keep source in sync if changed from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setSourceCode(content);
    }
  }, [content, editor]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSourceCode(val);
    onChange(val);
    editor?.commands.setContent(val);
  };

  const handleLinkSubmit = () => {
    if (inputValue === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: inputValue }).run();
    }
    setActiveMenu(null);
    setInputValue('');
  };

  const handleImageSubmit = () => {
    if (inputValue) {
      editor?.chain().focus().setImage({ src: inputValue }).run();
    }
    setActiveMenu(null);
    setInputValue('');
  };

  const handleVideoSubmit = () => {
    if (inputValue) {
      editor?.commands.setYoutubeVideo({ src: inputValue });
    }
    setActiveMenu(null);
    setInputValue('');
  };

  if (!editor) return null;

  return (
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm flex flex-col relative h-[600px]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 shrink-0">
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
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            active={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            active={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            active={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
            active={editor.isActive({ textAlign: 'justify' })}
            title="Align Justify"
          >
            <AlignJustify size={16} />
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
          <MenuButton 
            onClick={() => {
              const prev = editor.getAttributes('link').href;
              setInputValue(prev || '');
              setActiveMenu('link');
            }} 
            active={editor.isActive('link')} 
            title="Insert Link"
          >
            <LinkIcon size={16} />
          </MenuButton>
          <MenuButton onClick={() => setActiveMenu('image')} title="Insert Image">
            <ImageIcon size={16} />
          </MenuButton>
          <MenuButton onClick={() => setActiveMenu('video')} title="Insert YouTube Video">
            <YoutubeIcon size={16} />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1">
          <MenuButton onClick={() => setActiveMenu('color')} title="Text Color" active={activeMenu === 'color'}>
            <Palette size={16} />
          </MenuButton>

          <MenuButton onClick={() => setActiveMenu('highlight')} title="Highlight Color" active={activeMenu === 'highlight'}>
            <Highlighter size={16} />
          </MenuButton>

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

        <div className="ml-auto pl-2 border-l border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
          <MenuButton 
            onClick={() => setShowSource(!showSource)} 
            active={showSource}
            title="Toggle Source Code"
          >
            <Code size={16} />
          </MenuButton>
        </div>
      </div>

      {/* Floating Menus (Overlays) */}
      {activeMenu && (
        <div className="absolute top-[48px] left-0 right-0 z-40 p-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-b border-black/10 flex items-center gap-3 animate-in slide-in-from-top duration-200">
          {activeMenu === 'link' || activeMenu === 'image' || activeMenu === 'video' ? (
            <>
              <div className="flex-1 relative">
                <input 
                  autoFocus
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Enter ${activeMenu} URL...`}
                  onKeyDown={(e) => e.key === 'Enter' && (activeMenu === 'link' ? handleLinkSubmit() : activeMenu === 'image' ? handleImageSubmit() : handleVideoSubmit())}
                  className="w-full bg-white/10 dark:bg-black/5 border border-white/20 dark:border-black/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 shadow-inner"
                />
              </div>
              <button 
                onClick={activeMenu === 'link' ? handleLinkSubmit : activeMenu === 'image' ? handleImageSubmit : handleVideoSubmit}
                className="p-2 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                <Check size={16} />
              </button>
            </>
          ) : activeMenu === 'color' ? (
            <div className="flex flex-wrap gap-2 py-1">
              {['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setActiveMenu(null);
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 py-1">
              {['#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fed7aa', '#fecaca', '#f3f4f6', 'transparent'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    if (color === 'transparent') {
                      editor.chain().focus().unsetHighlight().run();
                    } else {
                      editor.chain().focus().setHighlight({ color }).run();
                    }
                    setActiveMenu(null);
                  }}
                  className="w-6 h-6 rounded-lg border-2 border-white/20 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                >
                  {color === 'transparent' && <Eraser size={12} className="mx-auto" />}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => { setActiveMenu(null); setInputValue(''); }}
            className="p-2 hover:bg-white/10 dark:hover:bg-black/5 rounded-xl transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative flex-1 overflow-y-auto">
        {showSource ? (
          <textarea
            value={sourceCode}
            onChange={handleSourceChange}
            className="w-full h-full p-6 font-mono text-sm bg-zinc-950 text-zinc-300 focus:outline-none resize-none"
            spellCheck={false}
          />
        ) : (
          <div className="p-6">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap {
          outline: none !important;
          min-height: 400px;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
        }
        .tiptap ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
        }
        .tiptap a {
          color: #8b5cf6 !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .tiptap img {
          display: block;
          margin: 1.5rem auto;
          border-radius: 1rem;
        }
        .tiptap mark {
          background-color: #fef08a;
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
        .dark .tiptap mark {
          background-color: #854d0e;
          color: #fef08a;
        }
        .tiptap u {
          text-decoration: underline !important;
        }
        .tiptap strong {
          font-weight: bold !important;
        }
        .tiptap em {
          font-style: italic !important;
        }
      `}} />
    </div>
  );
};

