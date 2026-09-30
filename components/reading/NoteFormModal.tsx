import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/theme';

type NoteFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
};

export function NoteFormModal({ visible, onClose, onSave }: NoteFormModalProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (content.trim().length === 0) {
      setError('노트를 입력해 주세요.');
      return;
    }

    onSave(content.trim());
    setContent('');
    setError('');
    onClose();
  };

  return (
    <SheetModal visible={visible} title="노트 추가" onClose={onClose}>
      <TextField
        label="노트"
        value={content}
        onChangeText={setContent}
        placeholder="읽으면서 남기고 싶은 생각"
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
