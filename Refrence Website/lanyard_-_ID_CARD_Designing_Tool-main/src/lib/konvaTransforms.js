export function getImageTransformUpdates(node, minWidth = 20, minHeight = 20) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  const updates = {
    x: node.x(),
    y: node.y(),
    width: Math.max(minWidth, node.width() * scaleX),
    height: Math.max(minHeight, node.height() * scaleY),
    rotation: node.rotation(),
  };

  node.scaleX(1);
  node.scaleY(1);

  return updates;
}

export function getTextTransformUpdates(node, baseWidth, baseFontSize, minWidth = 60, minFontSize = 6) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  const updates = {
    x: node.x(),
    y: node.y(),
    width: Math.max(minWidth, baseWidth * scaleX),
    fontSize: Math.max(minFontSize, baseFontSize * scaleY),
    rotation: node.rotation(),
  };

  node.scaleX(1);
  node.scaleY(1);

  return updates;
}
