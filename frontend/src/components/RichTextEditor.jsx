import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

const ToolbarButton = ({ onClick, active, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-2.5 py-1.5 border rounded-md text-xs sm:text-sm font-semibold transition-colors ${
      active
        ? 'bg-slate-900 border-slate-900 text-white'
        : 'bg-white border-gray-300 text-slate-700 hover:bg-slate-50'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  onImageUpload,
}) => {
  const imageInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      Image.configure({
        inline: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content rich-text-input min-h-28 sm:min-h-32 px-3 sm:px-4 py-3 text-slate-900',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const editorHtml = editor.getHTML();
    if (value !== editorHtml) {
      editor.commands.setContent(value || '', {
        emitUpdate: false,
      });
    }
  }, [value, editor]);

  const triggerImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !editor || !onImageUpload) return;

    try {
      setUploadingImage(true);
      const imageUrl = await onImageUpload(file);
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      }
    } finally {
      setUploadingImage(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-gray-200 bg-slate-50">
        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </ToolbarButton>
        <ToolbarButton
          title="Bullet List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          title="Numbered List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </ToolbarButton>
        <ToolbarButton
          title="Insert Image"
          disabled={uploadingImage}
          onClick={triggerImagePicker}
        >
          {uploadingImage ? 'Uploading...' : 'Image'}
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelection}
      />
    </div>
  );
};

export default RichTextEditor;
