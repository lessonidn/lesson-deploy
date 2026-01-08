import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { Rnd } from 'react-rnd'

export default function ResizableImage(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props
  const { src, width = 200, height = 150 } = node.attrs

  return (
    <NodeViewWrapper
      contentEditable={false}
      className="relative block my-2"
      style={{
        width: width,
        height: height,
      }}
    >
      <Rnd
        size={{ width, height }}
        enableResizing={{
          bottomRight: true,
        }}
        disableDragging // ✅ PENTING
        onResizeStop={(_, __, ref) => {
          updateAttributes({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
          })
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </Rnd>
    </NodeViewWrapper>
  )
}
