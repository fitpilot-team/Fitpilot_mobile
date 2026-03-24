type RecipeRichTextNode = {
  type?: string;
  text?: string;
  content?: RecipeRichTextNode[] | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isRecipeRichTextNode = (value: unknown): value is RecipeRichTextNode =>
  isRecord(value);

const normalizePlainText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const inlineNodeToText = (node: RecipeRichTextNode): string => {
  if (node.type === 'text') {
    return typeof node.text === 'string' ? node.text : '';
  }

  if (node.type === 'hardBreak') {
    return '\n';
  }

  return '';
};

const paragraphNodeToText = (node: RecipeRichTextNode) =>
  normalizePlainText((node.content ?? []).map(inlineNodeToText).join(''));

const blockNodeToText = (node: RecipeRichTextNode, orderedIndex = 1): string => {
  if (node.type === 'paragraph' || node.type === 'heading') {
    return paragraphNodeToText(node);
  }

  if (node.type === 'listItem') {
    const content = normalizePlainText(
      (node.content ?? [])
        .map((child) => {
          if (child.type === 'paragraph' || child.type === 'heading') {
            return paragraphNodeToText(child);
          }

          return blockNodeToText(child);
        })
        .filter(Boolean)
        .join('\n'),
    );

    if (!content) {
      return '';
    }

    return `${orderedIndex}. ${content.replace(/\n/g, '\n   ')}`;
  }

  if (node.type === 'bulletList') {
    return normalizePlainText(
      (node.content ?? [])
        .map((child) => {
          const content = blockNodeToText(child);
          return content.replace(/^\d+\.\s/, '- ');
        })
        .filter(Boolean)
        .join('\n'),
    );
  }

  if (node.type === 'orderedList') {
    return normalizePlainText(
      (node.content ?? [])
        .map((child, index) => blockNodeToText(child, index + 1))
        .filter(Boolean)
        .join('\n'),
    );
  }

  return normalizePlainText(
    (node.content ?? [])
      .map((child) => blockNodeToText(child))
      .filter(Boolean)
      .join('\n'),
  );
};

export const getRecipeRichTextPlainText = (
  value: unknown,
  fallbackDescription?: string | null,
) => {
  if (!isRecipeRichTextNode(value) || value.type !== 'doc') {
    return normalizePlainText(fallbackDescription ?? '');
  }

  const text = normalizePlainText(
    (value.content ?? [])
      .map((node) => blockNodeToText(node))
      .filter(Boolean)
      .join('\n\n'),
  );

  return text || normalizePlainText(fallbackDescription ?? '');
};
