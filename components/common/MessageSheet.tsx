import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { readerTheme } from '@/constants/readerTheme';
import { View } from 'react-native';

type MessageAction = {
  label: string;
  onPress: () => void;
  primary?: boolean;
};

type MessageSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  actions?: MessageAction[];
};

export function MessageSheet({
  visible,
  title,
  message,
  onClose,
  actions,
}: MessageSheetProps) {
  const buttons = actions?.length
    ? actions
    : [{ label: '확인', onPress: onClose, primary: true }];

  return (
    <SheetModal
      visible={visible}
      title={title}
      description={message}
      onClose={onClose}
      footer={
        <View style={{ gap: 8 }}>
          {buttons.map((action) => (
            <PrimaryButton
              key={action.label}
              label={action.label}
              variant={action.primary === false ? 'secondary' : 'primary'}
              onPress={action.onPress}
              primaryColor={readerTheme.primary}
              onPrimaryColor={readerTheme.onPrimary}
            />
          ))}
        </View>
      }
    >
      <View />
    </SheetModal>
  );
}
