import { spinePalette } from '@/constants/colors';

/** 인덱스 색상으로 고를 수 있는 값. 책등 팔레트의 차분한 톤을 그대로 쓴다. */
export const INDEX_COLOR_OPTIONS: readonly string[] = spinePalette;

export const MAX_INDEX_TAGS = 5;
export const MAX_INDEX_TAG_LENGTH = 12;

/** 폼 입력 영역이 화면 높이에서 차지할 수 있는 최대 비율. 키보드가 올라와도 저장 버튼이 밀려나지 않게 한다. */
export const INDEX_FORM_MAX_HEIGHT_RATIO = 0.55;

export const INDEX_SWATCH_SIZE = 28;
export const INDEX_DOT_SIZE = 12;
