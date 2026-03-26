import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useRef } from 'react'

// ── Toolbar button ────────────────────────────────────────────────────────────
function Btn({ active, title, onClick, children, style }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`re-btn${active ? ' re-btn-active' : ''}`}
      style={style}
    >
      {children}
    </button>
  )
}

const TEXT_COLORS = [
  { label: 'Black',  value: '#121212' },
  { label: 'Red',    value: '#D02020' },
  { label: 'Blue',   value: '#1040C0' },
  { label: 'Green',  value: '#1A6030' },
  { label: 'Orange', value: '#C05010' },
  { label: 'Purple', value: '#6030A0' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#FDE68A' },
  { label: 'Green',  value: '#BBF7D0' },
  { label: 'Blue',   value: '#BFDBFE' },
  { label: 'Pink',   value: '#FBCFE8' },
  { label: 'Orange', value: '#FED7AA' },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function RichEditor({ value, onChange, placeholder }) {
  const colorPickerRef = useRef(null)
  const highlightPickerRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: { class: 're-content', 'data-placeholder': placeholder || 'Start writing…' },
    },
  })

  // Sync external value changes (e.g. loading from server)
  useEffect(() => {
    if (!editor) return
    if (value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  return (
    <div className="re-wrapper">
      {/* ── Toolbar ── */}
      <div className="re-toolbar">
        {/* Heading / paragraph */}
        <div className="re-group">
          <select
            className="re-select"
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1'
              : editor.isActive('heading', { level: 2 }) ? 'h2'
              : editor.isActive('heading', { level: 3 }) ? 'h3'
              : 'p'
            }
            onChange={(e) => {
              const v = e.target.value
              if (v === 'p') editor.chain().focus().setParagraph().run()
              else editor.chain().focus().setHeading({ level: parseInt(v[1]) }).run()
            }}
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>

        <div className="re-divider" />

        {/* Bold / Italic / Underline / Strike */}
        <div className="re-group">
          <Btn active={editor.isActive('bold')} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
            <strong>B</strong>
          </Btn>
          <Btn active={editor.isActive('italic')} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <em>I</em>
          </Btn>
          <Btn active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <u>U</u>
          </Btn>
          <Btn active={editor.isActive('strike')} title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}>
            <s>S</s>
          </Btn>
        </div>

        <div className="re-divider" />

        {/* Text colour */}
        <div className="re-group re-color-group" ref={colorPickerRef}>
          <Btn title="Text colour" onClick={() => colorPickerRef.current?.classList.toggle('open')}>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 12 }}>A</span>
              <span style={{ height: 3, width: 14, background: editor.getAttributes('textStyle').color || '#121212' }} />
            </span>
          </Btn>
          <div className="re-color-picker">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                className="re-color-swatch"
                style={{ background: c.value }}
                onClick={() => { editor.chain().focus().setColor(c.value).run(); colorPickerRef.current?.classList.remove('open') }}
              />
            ))}
            <button
              type="button"
              title="Reset colour"
              className="re-color-swatch re-color-reset"
              onClick={() => { editor.chain().focus().unsetColor().run(); colorPickerRef.current?.classList.remove('open') }}
            >✕</button>
          </div>
        </div>

        {/* Highlight */}
        <div className="re-group re-color-group" ref={highlightPickerRef}>
          <Btn title="Highlight" onClick={() => highlightPickerRef.current?.classList.toggle('open')}>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: 12 }}>H</span>
              <span style={{ height: 3, width: 14, background: '#FDE68A' }} />
            </span>
          </Btn>
          <div className="re-color-picker">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                className="re-color-swatch"
                style={{ background: c.value }}
                onClick={() => { editor.chain().focus().setHighlight({ color: c.value }).run(); highlightPickerRef.current?.classList.remove('open') }}
              />
            ))}
            <button
              type="button"
              title="Remove highlight"
              className="re-color-swatch re-color-reset"
              onClick={() => { editor.chain().focus().unsetHighlight().run(); highlightPickerRef.current?.classList.remove('open') }}
            >✕</button>
          </div>
        </div>

        <div className="re-divider" />

        {/* Lists */}
        <div className="re-group">
          <Btn active={editor.isActive('bulletList')} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            ≡
          </Btn>
          <Btn active={editor.isActive('orderedList')} title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1.
          </Btn>
          <Btn active={editor.isActive('blockquote')} title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            "
          </Btn>
        </div>

        <div className="re-divider" />

        {/* Alignment */}
        <div className="re-group">
          <Btn active={editor.isActive({ textAlign: 'left' })} title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()}>⇤</Btn>
          <Btn active={editor.isActive({ textAlign: 'center' })} title="Align centre" onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</Btn>
          <Btn active={editor.isActive({ textAlign: 'right' })} title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()}>⇥</Btn>
        </div>

        <div className="re-divider" />

        {/* Undo / Redo */}
        <div className="re-group">
          <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} style={{ opacity: editor.can().undo() ? 1 : 0.3 }}>↩</Btn>
          <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} style={{ opacity: editor.can().redo() ? 1 : 0.3 }}>↪</Btn>
        </div>
      </div>

      {/* ── Editor area ── */}
      <EditorContent editor={editor} className="re-editor-area" />
    </div>
  )
}
