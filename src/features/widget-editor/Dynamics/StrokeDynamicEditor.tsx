import React from 'react';
import type { DynamicRule, WidgetCustomProperty } from '../../../types/domain';
import { FillDynamicEditor } from './FillDynamicEditor';

interface StrokeDynamicEditorProps {
  rule: DynamicRule;
  variable: WidgetCustomProperty;
  onChange: (updates: Partial<DynamicRule>) => void;
}

export const StrokeDynamicEditor: React.FC<StrokeDynamicEditorProps> = (props) => {
  return <FillDynamicEditor {...props} />;
};
