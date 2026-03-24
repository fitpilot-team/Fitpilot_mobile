type RecipeRichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  content?: RecipeRichTextNode[] | null;
};

export type RecipeRichTextBlock =
  | {
      type: 'heading';
      text: string;
      level: number;
    }
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'bulletList' | 'orderedList';
      items: string[];
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isRecipeRichTextNode = (value: unknown): value is RecipeRichTextNode =>
  isRecord(value);

const isRecipeRichTextNodeArray = (value: unknown): value is RecipeRichTextNode[] =>
  Array.isArray(value) && value.every(isRecipeRichTextNode);

const parseRecipeRichTextValue = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    return value;
  }
};

const getRecipeRichTextDocument = (value: unknown): RecipeRichTextNode | null => {
  const parsedValue = parseRecipeRichTextValue(value);

  if (isRecipeRichTextNode(parsedValue) && parsedValue.type === 'doc') {
    return parsedValue;
  }

  if (isRecipeRichTextNodeArray(parsedValue)) {
    return {
      type: 'doc',
      content: parsedValue,
    };
  }

  return null;
};

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

const listItemNodeToText = (node: RecipeRichTextNode) =>
  normalizePlainText(
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

const blockNodeToText = (node: RecipeRichTextNode, orderedIndex = 1): string => {
  if (node.type === 'paragraph' || node.type === 'heading') {
    return paragraphNodeToText(node);
  }

  if (node.type === 'listItem') {
    const content = listItemNodeToText(node);

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

const fallbackDescriptionToBlocks = (fallbackDescription?: string | null): RecipeRichTextBlock[] => {
  const normalizedDescription = normalizePlainText(fallbackDescription ?? '');

  if (!normalizedDescription) {
    return [];
  }

  return normalizedDescription
    .split(/\n{2,}/)
    .map((text) => normalizePlainText(text))
    .filter(Boolean)
    .map((text) => ({
      type: 'paragraph' as const,
      text,
    }));
};

export const getRecipeRichTextBlocks = (
  value: unknown,
  fallbackDescription?: string | null,
): RecipeRichTextBlock[] => {
  const document = getRecipeRichTextDocument(value);

  if (!document) {
    return fallbackDescriptionToBlocks(fallbackDescription);
  }

  const blocks = (document.content ?? []).flatMap((node): RecipeRichTextBlock[] => {
    if (node.type === 'heading') {
      const text = paragraphNodeToText(node);
      const rawLevel = typeof node.attrs?.level === 'number' ? node.attrs.level : 2;

      return text
        ? [{
            type: 'heading',
            text,
            level: Math.min(Math.max(rawLevel, 1), 6),
          }]
        : [];
    }

    if (node.type === 'paragraph') {
      const text = paragraphNodeToText(node);

      return text
        ? [{
            type: 'paragraph',
            text,
          }]
        : [];
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
      const items = (node.content ?? [])
        .map((itemNode) => listItemNodeToText(itemNode))
        .filter(Boolean);

      return items.length > 0
        ? [{
            type: node.type,
            items,
          }]
        : [];
    }

    const nestedText = blockNodeToText(node);

    return nestedText
      ? [{
          type: 'paragraph',
          text: nestedText,
        }]
      : [];
  });

  return blocks.length > 0 ? blocks : fallbackDescriptionToBlocks(fallbackDescription);
};

export const getRecipeRichTextPlainText = (
  value: unknown,
  fallbackDescription?: string | null,
) => {
  const document = getRecipeRichTextDocument(value);

  if (!document) {
    return normalizePlainText(fallbackDescription ?? '');
  }

  const text = normalizePlainText(
    (document.content ?? [])
      .map((node) => blockNodeToText(node))
      .filter(Boolean)
      .join('\n\n'),
  );

  return text || normalizePlainText(fallbackDescription ?? '');
};
