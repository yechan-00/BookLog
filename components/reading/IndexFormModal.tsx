import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/theme';

export interface DraftIndex {
  page: number;
  quote: string;
  memo: string;
}

type IndexFormModalProps = {
  visible: boolean;
  initialPage: number;
  onClose: () => void;
  onSave: (draft: DraftIndex) => void;
};

export function IndexFormModal({ visible, initialPage, onClose, onSave }: IndexFormModalProps) {
  const [page, setPage] = useState(String(initialPage));
  const [quote, setQuote] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const parsedPage = Number(page);
    if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
      setError('페이지를 숫자로 입력해 주세요.');
      return;
    }

    if (quote.trim().length === 0) {
      setError('기억하고 싶은 문장을 입력해 주세요.');
      return;
    }

    onSave({ page: parsedPage, quote: quote.trim(), memo: memo.trim() });
    setQuote('');
    setMemo('');
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
        label="문장"
        value={quote}
        onChangeText={setQuote}
        placeholder="기억하고 싶은 문장"
        multiline
      />
      <TextField
        label="메모"
        value={memo}
        onChangeText={setMemo}
        placeholder="짧은 메모, 없어도 됩니다"
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
