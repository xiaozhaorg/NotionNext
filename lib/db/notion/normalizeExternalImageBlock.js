export function normalizeExternalImageBlock(blockValue) {
  if (!blockValue || typeof blockValue !== 'object') return
  if (blockValue.type !== 'image') return

  const externalUrl = blockValue.image?.external?.url
  const fileUrl = blockValue.image?.file?.url

  if (externalUrl && typeof externalUrl === 'string') {
    if (!blockValue.properties) blockValue.properties = {}
    if (!blockValue.properties.source) blockValue.properties.source = [[]]
    if (!blockValue.properties.source[0]) blockValue.properties.source[0] = []
    blockValue.properties.source[0][0] = externalUrl
  } else if (fileUrl && typeof fileUrl === 'string') {
    if (!blockValue.properties) blockValue.properties = {}
    if (!blockValue.properties.source) blockValue.properties.source = [[]]
    if (!blockValue.properties.source[0]) blockValue.properties.source[0] = []
    blockValue.properties.source[0][0] = fileUrl
  }
}