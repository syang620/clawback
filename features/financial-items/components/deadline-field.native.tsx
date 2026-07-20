import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import type { DeadlineFieldProps } from '@/features/financial-items/components/deadline-field.types';
import {
  calendarDateToLocalNoon,
  formatCalendarDateDisplay,
  localDateToCalendarDate,
  localNoonForDate,
} from '@/lib/dates';

const PICKER_HEIGHT = 330;

export function DeadlineField({
  disabled = false,
  error,
  fallbackDate,
  onChange,
  value,
}: DeadlineFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedDate, setStagedDate] = useState(() =>
    localNoonForDate(fallbackDate),
  );
  const displayValue = formatCalendarDateDisplay(value) ?? value.trim();
  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const openPicker = () => {
    if (disabled) return;
    setStagedDate(
      calendarDateToLocalNoon(value) ?? localNoonForDate(fallbackDate),
    );
    setIsOpen(true);
  };

  const commitDate = (date: Date) => {
    if (disabled) return;
    const nextValue = localDateToCalendarDate(date);
    if (!nextValue) return;
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <View>
      <Text className="text-sm font-extrabold text-ink">
        Deadline <Text className="font-semibold text-slate">(required)</Text>
      </Text>
      <Pressable
        accessibilityHint={
          error ?? 'Opens a native calendar. The selected date has no time.'
        }
        accessibilityLabel={`Deadline, required${displayValue ? `, ${displayValue}` : ', no date selected'}${error ? `. Error: ${error}` : ''}`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        className={`mt-2 min-h-12 flex-row items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 ${
          error ? 'border-risk' : 'border-line'
        }`}
        disabled={disabled}
        onPress={openPicker}
      >
        <Text
          className={
            displayValue ? 'text-base text-ink' : 'text-base text-slate'
          }
        >
          {displayValue || 'Select a date'}
        </Text>
        <Text className="text-sm font-extrabold text-brand">Calendar</Text>
      </Pressable>
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-1.5 text-sm font-semibold leading-5 text-risk"
        >
          {error}
        </Text>
      )}

      {isAndroid && isOpen && (
        <DateTimePicker
          mode="date"
          negativeButton={{ label: 'Cancel' }}
          onDismiss={() => setIsOpen(false)}
          onValueChange={(_event, selectedDate) => commitDate(selectedDate)}
          positiveButton={{ label: 'Use date' }}
          presentation="dialog"
          value={stagedDate}
        />
      )}

      {!isAndroid && (
        <Modal
          animationType="fade"
          onRequestClose={() => {
            if (!disabled) setIsOpen(false);
          }}
          presentationStyle="overFullScreen"
          transparent
          visible={isOpen}
        >
          <View className="flex-1 justify-center bg-black/40 px-5 py-8">
            <View
              accessibilityLabel="Select deadline"
              accessibilityViewIsModal
              className="mx-auto w-full max-w-lg rounded-3xl bg-surface p-5"
            >
              <Text
                accessibilityRole="header"
                className="text-xl font-black text-ink"
              >
                Select deadline
              </Text>
              <DateTimePicker
                disabled={disabled}
                display="inline"
                mode="date"
                onValueChange={(_event, selectedDate) => {
                  if (!disabled) setStagedDate(localNoonForDate(selectedDate));
                }}
                style={{ height: PICKER_HEIGHT, width: '100%' }}
                value={stagedDate}
              />
              <View className="mt-3 flex-row flex-wrap justify-end gap-3">
                <Pressable
                  accessibilityLabel="Cancel deadline selection"
                  accessibilityRole="button"
                  accessibilityState={{ disabled }}
                  className="min-h-11 justify-center rounded-xl px-4"
                  disabled={disabled}
                  onPress={() => setIsOpen(false)}
                >
                  <Text className="font-extrabold text-slate">Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Use selected deadline"
                  accessibilityRole="button"
                  accessibilityState={{ disabled }}
                  className="min-h-11 justify-center rounded-xl bg-brand px-5"
                  disabled={disabled}
                  onPress={() => commitDate(stagedDate)}
                >
                  <Text className="font-extrabold text-white">Use date</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
