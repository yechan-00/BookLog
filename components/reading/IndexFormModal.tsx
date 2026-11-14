import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, type ScrollViewInstance } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { TextField } from '@/components/common/TextField';
import { IndexColorPicker } from '@/components/reading/IndexColorPicker';
import { IndexTagInput } from '@/components/reading/IndexTagInput';
import { INDEX_FORM_MAX_HEIGHT_RATIO } from '@/constants/bookIndex';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/theme';
import { addTag } from '@/utils/bookIndex';

export interface DraftIndex {
  page: number;
  title: string;
  quote: string;
  color: string | null;
  tags: string[];
}

type IndexFormModalProps = {
  visible: boolean;
  initialPage: number;
  onClose: () => void;
  onSave: (draft: DraftIndex) => void;
};

export function IndexFormModal({ visible, initialPage, onClose, onSave }: IndexFormModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [page, setPage] = useState(String(initialPage));
  const [title, setTitle] = useState('');
  const [quote, setQuote] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagText, setTagText] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);

  // 태그 칩은 입력창 아래에 쌓이므로, 추가될 때 끝까지 내려 방금 넣은 칩이 바로 보이게 한다.
  useEffect(() => {
    if (tags.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [tags.length]);

  const commitTag = () => {
    const result = addTag(tags, tagText);
    if (result.error !== null) {
      setError(result.error);
      return;
    }

    setTags(result.tags);
    setTagText('');
    setError('');
  };

  // 쉼표를 치면 그 앞의 글자까지를 태그로 확정하고, 마지막 조각은 계속 입력 중으로 둔다.
  const handleTagTextChange = (text: string) => {
    const pieces = text.split(',');
    if (pieces.length === 1) {
      setTagText(text);
      return;
    }

    let next = tags;
    let failure = '';
    let remaining = pieces[pieces.length - 1] ?? '';
    for (const piece of pieces.slice(0, -1)) {
      const result = addTag(next, piece);
      if (result.error !== null) {
        // 거부된 글자는 입력창에 남겨 두어 고쳐 쓸 수 있게 한다.
        failure = result.error;
        remaining = piece;
        break;
      }
      next = result.tags;
    }

    setTags(next);
    setError(failure);
    setTagText(remaining);
  };

  const handleRemoveTag = (tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
    setError('');
  };

  const handleSave = () => {
    const parsedPage = Number(page);
    if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
      setError('페이지를 숫자로 입력해 주세요.');
      return;
    }

    if (title.trim().length === 0) {
      setError('짧은 제목을 입력해 주세요.');
      return;
    }

    // 입력창에 남은 글자도 태그로 함께 저장한다. 추가 버튼을 안 누르고 저장해도 잃지 않도록.
    const finalTags = addTag(tags, tagText);
    if (finalTags.error !== null) {
      setError(finalTags.error);
      return;
    }

    onSave({ page: parsedPage, title: title.trim(), quote: quote.trim(), color, tags: finalTags.tags });
    setTitle('');
    setQuote('');
    setColor(null);
    setTags([]);
    setTagText('');
    setError('');
    onClose();
  };

  return (
    <SheetModal visible={visible} title="인덱스 추가" onClose={onClose} avoidKeyboard>
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: windowHeight * INDEX_FORM_MAX_HEIGHT_RATIO }}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="페이지"
          value={page}
          onChangeText={setPage}
          keyboardType="number-pad"
          placeholder="87"
        />
        <TextField
          label="제목"
          value={title}
          onChangeText={setTitle}
          placeholder="짧은 제목"
        />
        <TextField
          label="문장"
          value={quote}
          onChangeText={setQuote}
          placeholder="기억하고 싶은 문장, 없어도 됩니다"
          multiline
        />
        <IndexColorPicker value={color} onChange={setColor} />
        <IndexTagInput
          tags={tags}
          text={tagText}
          onChangeText={handleTagTextChange}
          onSubmit={commitTag}
          onRemove={handleRemoveTag}
        />
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="저장" onPress={handleSave} />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.warning,
  },
});
