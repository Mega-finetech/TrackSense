import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type OtpInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onComplete?: (value: string) => void;
  onResend?: () => void | Promise<void>;
  error?: string;
  disabled?: boolean;
  submitting?: boolean;
  length?: number;
  resendSeconds?: number;
};

/**
 * Six square code inputs that share one controlled value. Auto-advance,
 * backspace navigation, paste distribution and completion all run here so the
 * verification and reset screens only own their API calls.
 */
export function OtpInput({
  value, onChangeText, onComplete, onResend, error, disabled, submitting,
  length = 6, resendSeconds = 60,
}: OtpInputProps) {
  const { colors, dark } = useTheme();
  const refs = useRef<Array<TextInput | null>>([]);
  const submitted = useRef('');
  const [focused, setFocused] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(resendSeconds);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(current => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  useEffect(() => {
    if (value.length < length) { submitted.current = ''; return; }
    if (value.length !== length || disabled || submitting || value === submitted.current) return;
    submitted.current = value;
    onComplete?.(value);
  }, [value, length, disabled, submitting, onComplete]);

  useEffect(() => { if (error) submitted.current = ''; }, [error]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  function apply(index: number, text: string) {
    const entered = text.replace(/\D/g, '');
    const next = digits.slice();
    if (!entered) {
      next[index] = '';
      onChangeText(next.join(''));
      return;
    }
    for (let offset = 0; offset < entered.length && index + offset < length; offset++) {
      next[index + offset] = entered[offset];
    }
    onChangeText(next.join(''));
    const last = Math.min(index + entered.length, length - 1);
    refs.current[last]?.focus();
  }

  function backspace(index: number) {
    if (index === 0) return;
    const previous = index - 1;
    const next = digits.slice();
    next[previous] = '';
    onChangeText(next.join(''));
    refs.current[previous]?.focus();
  }

  const locked = !!disabled || !!submitting;
  const canResend = remaining === 0 && !!onResend && !resending && !locked;

  async function resend() {
    if (!canResend || !onResend) return;
    setResending(true);
    try {
      await onResend();
      setRemaining(resendSeconds);
    } catch {
      // The parent renders the inline error; leaving the timer at zero lets
      // the user try again immediately.
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.group}>
      <View style={styles.row} accessibilityLabel="6-digit verification code">
        {digits.map((digit, index) => {
          const active = focused === index;
          return (
            <TextInput
              key={index}
              ref={input => { refs.current[index] = input; }}
              accessibilityLabel={`Code digit ${index + 1}`}
              value={digit}
              onChangeText={text => apply(index, text)}
              onFocus={() => setFocused(index)}
              onBlur={() => setFocused(current => current === index ? null : current)}
              onKeyPress={event => {
                if (event.nativeEvent.key === 'Backspace' && !digit && index > 0) backspace(index);
              }}
              editable={!locked}
              maxLength={length}
              keyboardType="number-pad"
              inputMode="numeric"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              selectTextOnFocus
              autoFocus={index === 0}
              placeholder="•"
              placeholderTextColor={colors.muted}
              selectionColor={colors.accent}
              style={[
                styles.box,
                {
                  color: colors.text,
                  backgroundColor: dark ? '#1E1E1E' : colors.surface,
                  borderColor: active ? colors.accent : dark ? '#2A2A2A' : colors.border,
                },
                active && styles.focused,
                !!error && styles.invalid,
              ]}
            />
          );
        })}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>
      )}
      {!!onResend && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canResend ? 'Resend Code' : `Resend code in ${remaining} seconds`}
          accessibilityState={{ disabled: !canResend, busy: resending }}
          disabled={!canResend}
          onPress={resend}
          style={styles.resend}
        >
          <Text style={{ color: canResend ? colors.primary : colors.muted, fontSize: 13, fontWeight: '600' }}>
            {remaining > 0 ? `Resend code in ${remaining}s` : resending ? 'Sending...' : 'Resend Code'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  row: { flexDirection: 'row', gap: 8, width: '100%' },
  box: {
    flex: 1, minWidth: 0, height: 56, borderRadius: 12, borderWidth: 1.5,
    textAlign: 'center', fontSize: 22, fontWeight: '700', paddingVertical: 0,
  },
  focused: { borderWidth: 2 },
  invalid: { borderColor: '#FF4D4D' },
  error: { color: '#FF4D4D', fontSize: 12, lineHeight: 18 },
  resend: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
