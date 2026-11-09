import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/theme';

export interface DraftIndex {
  page: number;
  title: string;
  quote: string;
}

type IndexFormModalProps = {
  visible: boolean;
  initialPage: number;
  onClose: () => void;
  onSave: (draft: DraftIndex) => void;
};

export function IndexFormModal({ visible, initialPage, onClose, onSave }: IndexFormModalProps) {
  const [page, setPage] = useState(String(initialPage));
  const [title, setTitle] = useState('');
  const [quote, setQuote] = useState('');
  const [error, setError] = useState('');

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

    onSave({ page: parsedPage, title: title.trim(), quote: quote.trim() });
    setTitle('');
    setQuote('');
    setError('');
    onClose();
  };

  return (
    <SheetModal visible={visible} title="인덱스 추가" onClose={onClose}>
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="저장" onPress={handleSave} />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    color: colors.warning,
  },
});
