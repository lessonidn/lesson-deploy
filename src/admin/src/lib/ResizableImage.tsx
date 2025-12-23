import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { Rnd } from 'react-rnd'

export default function ResizableImage(props: ReactNodeViewProps) {
  const { node, updateAttributes } = props
  const { src, width = 200, height = 150 } = node.attrs

  return (
    <NodeViewWrapper className="resizable-image">
      <Rnd
        default={{ x: 0, y: 0, width, height }}
        bounds="parent"
        onResizeStop={(_, __, ref) => {
          updateAttributes({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
          })
        }}
      >
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </Rnd>
    </NodeViewWrapper>
  )
}