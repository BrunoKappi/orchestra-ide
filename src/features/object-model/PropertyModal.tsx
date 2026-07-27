import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DataType } from '../../types/domain';
import { useObjectModelStore } from '../../store/useObjectModelStore';
import { Modal } from '../../components/ui/Modal';

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must start with a letter or underscore and contain no spaces'),
  dataType: z.enum(['String', 'Boolean', 'Integer', 'Float', 'Date', 'Enum', 'Array', 'Object']),
  defaultValue: z.string(),
  description: z.string(),
  opcTagPath: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export const PropertyModal: React.FC = () => {
  const {
    isPropertyModalOpen,
    editingProperty,
    closePropertyModal,
    saveProperty,
  } = useObjectModelStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      dataType: 'String',
      defaultValue: '',
      description: '',
      opcTagPath: '',
    },
  });

  useEffect(() => {
    if (editingProperty) {
      reset({
        name: editingProperty.name,
        dataType: editingProperty.dataType as DataType,
        defaultValue: editingProperty.defaultValue,
        description: editingProperty.description,
        opcTagPath: editingProperty.opcTagPath || '',
      });
    } else {
      reset({
        name: '',
        dataType: 'String',
        defaultValue: '',
        description: '',
        opcTagPath: '',
      });
    }
  }, [editingProperty, reset, isPropertyModalOpen]);

  const onSubmit = (data: PropertyFormData) => {
    saveProperty(data as { name: string; dataType: DataType; defaultValue: string; description: string; opcTagPath?: string });
  };

  const isEditingInherited = editingProperty?.isInherited;

  return (
    <Modal
      isOpen={isPropertyModalOpen}
      onClose={closePropertyModal}
      title={
        editingProperty
          ? isEditingInherited
            ? 'Override Inherited Property'
            : 'Edit Property'
          : 'Add New Property'
      }
      subtitle={
        isEditingInherited
          ? `Editing this property will create a local override for property "${editingProperty.name}".`
          : 'Define a dynamic attribute for this template or instance.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Name Field */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Property Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Temperature"
            readOnly={isEditingInherited}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono"
          />
          {errors.name && (
            <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Data Type Selection */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Data Type <span className="text-rose-500">*</span>
          </label>
          <select
            {...register('dataType')}
            disabled={isEditingInherited}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-medium"
          >
            <option value="String">String (Text)</option>
            <option value="Boolean">Boolean (True/False)</option>
            <option value="Integer">Integer (Whole Number)</option>
            <option value="Float">Float (Decimal Number)</option>
            <option value="Date">Date (ISO Timestamp)</option>
            <option value="Enum">Enum (List of Options)</option>
            <option value="Array">Array (List)</option>
            <option value="Object">Object (JSON Data)</option>
          </select>
        </div>

        {/* Default Value */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Default Value
          </label>
          <input
            type="text"
            {...register('defaultValue')}
            placeholder="e.g. 25.0 or TANK-001"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* OPC Tag Path */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            OPC Tag Binding (Caminho OPC)
          </label>
          <input
            type="text"
            {...register('opcTagPath')}
            placeholder="e.g. OPC_UA_Refinery.Boiler_Area.PLC_Boiler_01.TE_101"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Brief explanation of what this property measures or controls..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-500"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closePropertyModal}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs transition-colors"
          >
            {editingProperty ? 'Save Changes' : 'Create Property'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
