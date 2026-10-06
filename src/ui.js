// Servizato UI kit for React Native: the same look as the web apps' styles.css,
// as small components. Shared by the customer, provider and technician apps.
import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, StyleSheet, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './icons.js';
import { syncLabel } from './backend.js';

export const C = {
  ink: '#0E1A2B', ink2: '#3B4556', muted: '#586274', line: '#E4E7EC', line2: '#D5DAE1', line3: '#EEF0F3',
  bg: '#F5F6F8', surface: '#FFFFFF', blue: '#1E4FD8', blueDark: '#163BA6', blueSoft: '#E8EEFD', blueLine: '#9DB5F2',
  green: '#0F7A4A', greenText: '#0B5E39', greenSoft: '#E4F4EC', warmText: '#7A3D0A', warmSoft: '#FDF0E3',
  star: '#E8890C', red: '#A3330B', redSoft: '#FBE9E4', navy2: '#1F2D44', faint: '#C3CAD6', disabled: '#C9D1DC',
};

/* ---------- text ---------- */

const TS = StyleSheet.create({
  body: { fontSize: 14, color: C.ink },
  pageTitle: { fontSize: 24, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  hero: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: C.ink, letterSpacing: -0.4 },
  section: { fontSize: 18, fontWeight: '800', color: C.ink },
  sectionSm: { fontSize: 16, fontWeight: '800', color: C.ink },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  cardDesc: { fontSize: 13, lineHeight: 19, color: C.muted },
  muted: { fontSize: 13, color: C.muted },
  label: { fontSize: 12, fontWeight: '600', color: C.muted },
  meta: { fontSize: 12, fontWeight: '600', color: C.ink2 },
  strong: { fontSize: 14, fontWeight: '700', color: C.ink },
  faint: { fontSize: 12, fontWeight: '600', color: C.faint },
  good: { fontSize: 14, fontWeight: '600', color: C.greenText },
  empty: { fontSize: 14, color: C.muted },
  hint: { fontSize: 12, color: C.muted },
  error: { fontSize: 13, fontWeight: '700', color: C.red },
  jobTime: { fontSize: 13, fontWeight: '800', color: C.blueDark },
  big: { fontSize: 34, fontWeight: '800', color: C.ink, letterSpacing: -0.6 },
  bigRating: { fontSize: 40, fontWeight: '800', color: C.ink, lineHeight: 44 },
});

/** <T v="muted">…</T>  (v = one of the text styles above) */
export function T({ v = 'body', style, children, ...rest }) {
  return <Text style={[TS[v], style]} {...rest}>{children}</Text>;
}

/* ---------- layout ---------- */

export const Row = ({ gap = 12, align = 'center', style, children }) => (
  <View style={[{ flexDirection: 'row', alignItems: align, gap }, style]}>{children}</View>
);
export const RowBetween = ({ gap = 10, align = 'center', style, children }) => (
  <View style={[{ flexDirection: 'row', alignItems: align, justifyContent: 'space-between', gap }, style]}>{children}</View>
);
export const Wrap = ({ gap = 8, style, children }) => (
  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>{children}</View>
);
export const Stack = ({ gap = 10, style, children }) => <View style={[{ gap }, style]}>{children}</View>;
export const Grow = ({ gap = 3, style, children }) => <View style={[{ flex: 1, minWidth: 0, gap }, style]}>{children}</View>;
export const Hr = () => <View style={{ height: 1, backgroundColor: C.line3, marginVertical: 2 }} />;

export function Screen({ children }) {
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{children}</KeyboardAvoidingView>;
}

export function Content({ children, style }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ padding: 20, paddingBottom: 28, gap: 20 }, style]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function TopBar({ title, sub, onBack, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.topbar, { paddingTop: 12 + insets.top }]}>
      {onBack && <IconBtn name="back" size={20} label="Back" onPress={onBack} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function PageHead({ children, plain }) {
  const insets = useSafeAreaInsets();
  return <View style={[plain ? { paddingHorizontal: 20 } : s.pageHead, { paddingTop: (plain ? 18 : 20) + insets.top }]}>{children}</View>;
}

export function CloseRow({ onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 14 + insets.top }}>
      <IconBtn name="close" size={20} variant="outline" label="Close" onPress={onClose} />
    </View>
  );
}

export function BottomBar({ children, gap = 6 }) {
  const insets = useSafeAreaInsets();
  return <View style={[s.bottombar, { paddingBottom: 16 + insets.bottom, gap }]}>{children}</View>;
}

/* ---------- surfaces ---------- */

export function Card({ on, onPress, style, children, gap }) {
  const st = [s.card, on && { borderColor: C.blueLine }, gap != null && { gap }, style];
  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [...st, pressed && { opacity: 0.85 }]}>{children}</Pressable>;
  }
  return <View style={st}>{children}</View>;
}

export function Note({ tone = 'info', icon = 'info', children }) {
  const t = {
    info: { bg: C.blueSoft, fg: '#1A3A8F', w: '400' },
    good: { bg: C.greenSoft, fg: C.greenText, w: '700' },
    danger: { bg: C.redSoft, fg: C.red, w: '700' },
  }[tone];
  return (
    <View style={[s.note, { backgroundColor: t.bg, alignItems: tone === 'good' ? 'center' : 'flex-start' }]}>
      <Icon name={icon} size={18} color={t.fg} style={{ marginTop: tone === 'good' ? 0 : 1 }} />
      <Text style={{ flex: 1, color: t.fg, fontSize: tone === 'good' ? 14 : 13, lineHeight: 19, fontWeight: t.w }}>{children}</Text>
    </View>
  );
}

export function Banner({ icon = 'inbox', text, action, onAction }) {
  return (
    <View style={[s.note, { backgroundColor: C.warmSoft, alignItems: 'center' }]}>
      <Icon name={icon} size={18} color={C.warmText} />
      <Text style={{ flex: 1, color: C.warmText, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>{text}</Text>
      {action && <Btn variant="outline" small onPress={onAction}>{action}</Btn>}
    </View>
  );
}

export function DemoBox({ children }) {
  return <View style={s.demoBox}>{children}</View>;
}

export function ConfirmBox({ text, keepLabel = 'Keep', confirmLabel, onKeep, onConfirm }) {
  return (
    <View style={s.confirmBox}>
      <Text style={{ color: C.red, fontSize: 14, fontWeight: '600' }}>{text}</Text>
      <Row gap={8}>
        <Btn variant="outline" style={{ flex: 1 }} onPress={onKeep}>{keepLabel}</Btn>
        <Btn variant="danger" style={{ flex: 1 }} onPress={onConfirm}>{confirmLabel}</Btn>
      </Row>
    </View>
  );
}

/* ---------- buttons ---------- */

const BTN = {
  primary: { bg: C.blue, fg: '#fff', border: C.blue },
  outline: { bg: '#fff', fg: C.blue, border: C.blue },
  soft: { bg: C.blueSoft, fg: C.blueDark, border: C.blueSoft },
  light: { bg: '#fff', fg: C.ink, border: '#fff' },
  ghost: { bg: 'transparent', fg: C.ink2, border: 'transparent' },
  danger: { bg: C.red, fg: '#fff', border: C.red },
  linkDanger: { bg: 'transparent', fg: C.red, border: 'transparent' },
};

const isPlain = (c) => typeof c === 'string' || typeof c === 'number';
const isText = (c) => isPlain(c) || (Array.isArray(c) && c.every(isPlain));

export function Btn({ variant = 'primary', lg, small, icon, iconRight, disabled, onPress, style, children }) {
  const v = BTN[variant];
  const off = disabled && variant === 'primary';
  const fg = off ? '#fff' : v.fg;
  return (
    <Pressable
      accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: off ? C.disabled : v.bg, borderColor: off ? C.disabled : v.border },
        lg && s.btnLg, small && { minHeight: 36, paddingHorizontal: 12 },
        disabled && variant !== 'primary' && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {icon && <Icon name={icon} size={18} color={fg} />}
      {isText(children)
        ? <Text style={{ color: fg, fontSize: lg ? 16 : small ? 13 : 15, fontWeight: lg ? '800' : '700' }}>{children}</Text>
        : children}
      {iconRight && <Icon name={iconRight} size={18} color={fg} />}
    </Pressable>
  );
}

export function IconBtn({ name, size = 20, variant = 'plain', label, onPress }) {
  const v = {
    plain: { bg: C.bg, fg: C.ink, border: C.bg },
    outline: { bg: '#fff', fg: C.blue, border: C.line },
    solid: { bg: C.blue, fg: '#fff', border: C.blue },
  }[variant];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({ pressed }) => [s.iconBtn, { backgroundColor: v.bg, borderColor: v.border }, pressed && { opacity: 0.7 }]}>
      <Icon name={name} size={size} color={v.fg} />
    </Pressable>
  );
}

export function Chip({ on, icon, onPress, children }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={[s.chip, on && { backgroundColor: C.ink, borderColor: C.ink }]}>
      {icon && <Icon name={icon} size={14} color={on ? '#fff' : C.ink} />}
      <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#fff' : C.ink }}>{children}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }) {
  return (
    <View style={{ backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.line }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}>
        {children}
      </ScrollView>
    </View>
  );
}

export function Switch({ on, onPress, label }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: !!on }} accessibilityLabel={label} hitSlop={8}
      style={[s.switch, { backgroundColor: on ? C.green : C.disabled }]}>
      <View style={[s.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </Pressable>
  );
}

/** A radio-style option row (payment method, technician pick …). */
export function Option({ on, disabled, onPress, left, title, sub, children }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ checked: !!on, disabled: !!disabled }}
      style={[s.method, on && { borderColor: C.blue, backgroundColor: '#F3F6FE' }, disabled && { opacity: 0.55 }]}>
      {left}
      <Grow>
        {title ? <T v="strong">{title}</T> : null}
        {sub ? <T v="muted" style={{ fontSize: 12 }}>{sub}</T> : null}
        {children}
      </Grow>
      <View style={[s.radio, on && { borderColor: C.blue, backgroundColor: C.blue }]}>
        {on && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
      </View>
    </Pressable>
  );
}

/* ---------- small pieces ---------- */

const BADGE = {
  '': { bg: C.line3, fg: C.ink2 }, good: { bg: C.greenSoft, fg: C.greenText }, warm: { bg: C.warmSoft, fg: C.warmText },
  blue: { bg: C.blueSoft, fg: C.blueDark }, bad: { bg: C.redSoft, fg: C.red },
};
export function Badge({ tone = '', icon, children }) {
  const b = BADGE[tone] || BADGE[''];
  return (
    <View style={[s.badge, { backgroundColor: b.bg }]}>
      {icon && <Icon name={icon} size={13} color={b.fg} />}
      <Text style={{ fontSize: 12, fontWeight: tone ? '700' : '600', color: b.fg }}>{children}</Text>
    </View>
  );
}

export function SrcBadge({ source }) {
  if (source !== 'customer' && source !== 'provider') return null;
  return (
    <View style={s.srcBadge}>
      <Icon name={source === 'customer' ? 'mobile' : 'inbox'} size={12} color={C.greenText} />
      <Text style={{ fontSize: 11, fontWeight: '800', color: C.greenText }}>{source === 'customer' ? 'Customer app' : 'Provider app'}</Text>
    </View>
  );
}

export function Avatar({ text, round = true, lg }) {
  const size = lg ? 56 : 48;
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: round ? size / 2 : 14 }]}>
      <Text style={{ color: C.blue, fontSize: lg ? 20 : 16, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}

export function CatIcon({ name, sm }) {
  const size = sm ? 38 : 44;
  return (
    <View style={[s.catIcon, { width: size, height: size, borderRadius: sm ? 10 : 12 }]}>
      <Icon name={name} size={sm ? 18 : 22} color={C.blue} />
    </View>
  );
}

export function Rating({ value, size = 14, label }) {
  return (
    <Row gap={4}>
      <Icon name="star" filled size={size} color={C.star} />
      <Text style={{ fontWeight: '700', color: C.ink, fontSize: 13 }}>{label ?? value.toFixed(1)}</Text>
    </Row>
  );
}

export function Meta({ icon, children, style }) {
  return (
    <Row gap={6} style={style}>
      {icon && <Icon name={icon} size={14} color={C.ink2} />}
      <Text style={TS.meta}>{children}</Text>
    </Row>
  );
}

export function BillRow({ label, sub, value, total, good }) {
  return (
    <RowBetween gap={12} align="flex-start">
      <View style={{ flex: 1 }}>
        <Text style={total ? { fontSize: 17, fontWeight: '800', color: C.ink } : { fontSize: 14, color: C.ink2 }}>{label}</Text>
        {sub ? <T v="muted" style={{ fontSize: 12 }}>{sub}</T> : null}
      </View>
      <Text style={total ? { fontSize: 17, fontWeight: '800', color: C.ink } : { fontSize: 14, fontWeight: '600', color: good ? C.greenText : C.ink }}>{value}</Text>
    </RowBetween>
  );
}

export function StatGrid({ children }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}

export function Stat({ label, value, sub, subMuted, dark, onPress, right }) {
  const body = (
    <>
      <Text style={{ fontSize: 12, fontWeight: '600', color: dark ? C.faint : C.muted }}>{label}</Text>
      <Row gap={6}><Text style={{ fontSize: 22, fontWeight: '800', color: dark ? '#fff' : C.ink }}>{value}</Text>{right}</Row>
      {sub ? <Text style={{ fontSize: 12, fontWeight: subMuted ? '400' : '700', color: subMuted ? (dark ? C.faint : C.muted) : dark ? '#8FE3B5' : C.greenText }}>{sub}</Text> : null}
    </>
  );
  const st = [s.stat, dark && { backgroundColor: C.ink, borderColor: C.ink }];
  return onPress
    ? <Pressable onPress={onPress} style={({ pressed }) => [...st, pressed && { opacity: 0.85 }]}>{body}</Pressable>
    : <View style={st}>{body}</View>;
}

export function Bars({ values, labels, fmt, label }) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 150, paddingTop: 8 }} accessibilityLabel={label}>
      {values.map((v, i) => {
        const last = i === values.length - 1;
        return (
          <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.ink2 }} numberOfLines={1}>{v ? fmt(v) : ''}</Text>
            <View style={{ width: '100%', maxWidth: 34, height: Math.max(4, Math.round((v / max) * 96)), borderTopLeftRadius: 6, borderTopRightRadius: 6, borderRadius: 2, backgroundColor: last ? C.blue : '#BFD0F8' }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted }}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ListGroup({ children }) {
  const items = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  return (
    <View style={s.listGroup}>
      {items.map((c, i) => <View key={i} style={i > 0 && { borderTopWidth: 1, borderColor: C.line3 }}>{c}</View>)}
    </View>
  );
}

export function ListLink({ icon, left, title, sub, right, onPress }) {
  const body = (
    <>
      {left || (icon && <Icon name={icon} color={C.blue} />)}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 12, color: C.muted }}>{sub}</Text> : null}
      </View>
      {right !== undefined ? right : <Icon name="chevronRight" size={18} color={C.ink} />}
    </>
  );
  return onPress
    ? <Pressable onPress={onPress} style={({ pressed }) => [s.listLink, pressed && { backgroundColor: C.bg }]}>{body}</Pressable>
    : <View style={s.listLink}>{body}</View>;
}

/** steps: [{ title, sub, time, state: 'done'|'current'|'todo' }] */
export function Timeline({ steps }) {
  return (
    <View style={{ marginTop: 14 }}>
      {steps.map((st, i) => {
        const last = i === steps.length - 1;
        const dot = st.state === 'done' ? { backgroundColor: C.green, borderColor: C.green }
          : st.state === 'current' ? { backgroundColor: C.blue, borderColor: '#C7D5F9' } : { backgroundColor: '#fff', borderColor: C.line2 };
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 14, paddingBottom: last ? 0 : 18 }}>
            {!last && <View style={{ position: 'absolute', left: 10, top: 24, bottom: 2, width: 2, backgroundColor: st.state === 'done' ? C.green : C.line2 }} />}
            <View style={[s.tlDot, dot]}>{st.state === 'done' && <Icon name="check" size={12} color="#fff" />}</View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: st.state === 'current' ? '800' : '600', color: st.state === 'todo' ? C.muted : C.ink }}>{st.title}</Text>
              {st.sub ? <Text style={{ fontSize: 12, color: C.muted }}>{st.sub}</Text> : null}
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>{st.time}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Illustrated route (not a real map). Full-bleed at the top of <Content>. */
export function MapMock({ chip }) {
  const lines = [];
  for (let i = 1; i < 14; i += 1) lines.push(<View key={'h' + i} style={{ position: 'absolute', left: 0, right: 0, top: i * 30, height: 1, backgroundColor: '#C9D6EE' }} />);
  for (let i = 1; i < 16; i += 1) lines.push(<View key={'v' + i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 30, width: 1, backgroundColor: '#C9D6EE' }} />);
  return (
    <View style={{ height: 180, margin: -20, marginBottom: 0, backgroundColor: '#DCE6F7', overflow: 'hidden' }}>
      {lines}
      <View style={{ position: 'absolute', left: '25%', top: '62%', width: '52%', borderTopWidth: 3, borderStyle: 'dashed', borderColor: C.blue, transform: [{ rotate: '-24deg' }], transformOrigin: 'left center' }} />
      <View style={[s.mapPin, { left: '25%', top: '62%', marginLeft: -20, marginTop: -20, backgroundColor: C.blue }]}><Icon name="wrench" size={18} color="#fff" /></View>
      <View style={[s.mapPin, { left: '72%', top: '14%', marginLeft: -20, backgroundColor: C.ink }]}><Icon name="home" size={18} color="#fff" /></View>
      <View style={s.mapChip}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue }} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink }}>{chip}</Text>
      </View>
    </View>
  );
}

export function Success({ title, sub }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={34} color={C.green} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: C.ink, textAlign: 'center' }}>{title}</Text>
      {sub ? <T v="muted" style={{ textAlign: 'center' }}>{sub}</T> : null}
    </View>
  );
}

export function Empty({ icon, title, sub, action, onAction }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 12 }}>
      <Icon name={icon} size={32} color={C.muted} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{title}</Text>
      <T v="muted" style={{ textAlign: 'center' }}>{sub}</T>
      {action && <Btn style={{ marginTop: 8 }} onPress={onAction}>{action}</Btn>}
    </View>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, backgroundColor: C.line3 }}>
      {options.map((o) => (
        <Pressable key={o.id} onPress={() => onChange(o.id)} accessibilityRole="tab" accessibilityState={{ selected: value === o.id }}
          style={{ flex: 1, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: value === o.id ? '#fff' : 'transparent' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: value === o.id ? C.ink : C.muted }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Grid of proof photos ({label, src}) or placeholders (strings). */
export function ProofGrid({ photos, placeholders }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {photos?.length
        ? photos.map((p) => <Image key={p.label} source={{ uri: p.src }} style={s.proof} accessibilityLabel={p.label + ' photo'} />)
        : (placeholders || []).map((l) => (
          <View key={l} style={[s.proof, { alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
            <Icon name="image" color={C.muted} /><Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>{l}</Text>
          </View>
        ))}
    </View>
  );
}

export function Input({ style, sm, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput placeholderTextColor="#8A94A6" onFocus={() => setFocus(true)} onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
      {...rest} style={[s.input, sm && { height: 40, width: 96, textAlign: 'right', fontWeight: '700' }, focus && { borderColor: C.blue }, style]} />
  );
}

export function TextArea({ rows = 3, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput multiline textAlignVertical="top" placeholderTextColor="#8A94A6" onFocus={() => setFocus(true)}
      {...rest} onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
      style={[s.textarea, { minHeight: 24 + rows * 21 }, focus && { borderColor: C.blue }, style]} />
  );
}

/** Dropdown: groups = [{ label, options: [{ value, label }] }] */
export function Select({ label, value, groups, onChange }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = groups.flatMap((g) => g.options).find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink2 }}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={[s.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} accessibilityRole="button">
        <Text style={{ fontSize: 15, color: C.ink }}>{current?.label}</Text>
        <Icon name="chevronDown" size={18} color={C.ink2} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(14,26,43,0.4)' }} onPress={() => setOpen(false)} />
        <View style={{ maxHeight: '70%', backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 8 }}>
          <RowBetween style={{ padding: 16, paddingBottom: 8 }}>
            <T v="sectionSm">{label}</T>
            <IconBtn name="close" size={18} label="Close" onPress={() => setOpen(false)} />
          </RowBetween>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 6 }}>
            {groups.map((g) => (
              <View key={g.label || 'all'} style={{ gap: 6 }}>
                {g.label ? <T v="label" style={{ marginTop: 8 }}>{g.label}</T> : null}
                {g.options.map((o) => (
                  <Option key={o.value} on={o.value === value} title={o.label} onPress={() => { setOpen(false); if (o.value !== value) onChange(o.value); }} />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export function SyncStatus() {
  const st = syncLabel();
  const dot = { ok: '#1e9e5a', warn: '#e0a100', error: '#c0392b', muted: '#9aa0a6' }[st.tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(127,127,127,0.08)' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      <Text style={{ flex: 1, fontSize: 13, color: st.tone === 'error' ? '#c0392b' : C.ink }}>{st.text}</Text>
    </View>
  );
}

export function TabBar({ tabs, current, onTab }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabbar, { paddingBottom: 10 + insets.bottom }]}>
      {tabs.map((t) => {
        const on = current === t.id;
        return (
          <Pressable key={t.id} onPress={() => onTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={s.tab}>
            <Icon name={t.icon} color={on ? C.blue : C.muted} />
            <Text style={{ fontSize: 11, fontWeight: on ? '700' : '600', color: on ? C.blue : C.muted }}>{t.label}</Text>
            {t.badge > 0 && (
              <View style={s.tabBadge}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{t.badge}</Text></View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toast({ text }) {
  const insets = useSafeAreaInsets();
  if (!text) return null;
  return (
    <View pointerEvents="none" style={[s.toast, { top: 12 + insets.top }]} accessibilityLiveRegion="polite">
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.line },
  pageHead: { gap: 14, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.line },
  bottombar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.surface, borderTopWidth: 1, borderColor: C.line },
  card: { padding: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16 },
  note: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  demoBox: { gap: 10, padding: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line2, borderRadius: 14 },
  confirmBox: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: C.redSoft },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1.5 },
  btnLg: { minHeight: 54, width: '100%', borderRadius: 14 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.line2, backgroundColor: '#fff' },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3 },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#B9C0CB', alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, alignSelf: 'flex-start' },
  srcBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#E8F7EF', alignSelf: 'flex-start' },
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft },
  catIcon: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft },
  stat: { flexBasis: '47%', flexGrow: 1, gap: 4, padding: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16 },
  listGroup: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden' },
  listLink: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16 },
  tlDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  mapPin: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  mapChip: { position: 'absolute', left: 16, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#fff' },
  proof: { flex: 1, height: 92, borderRadius: 12, backgroundColor: '#E3E7ED' },
  input: { minWidth: 0, height: 46, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: '#fff', fontSize: 15, color: C.ink },
  textarea: { minWidth: 0, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: C.line2, backgroundColor: '#fff', fontSize: 14, lineHeight: 21, color: C.ink },
  tabbar: { flexDirection: 'row', paddingTop: 6, paddingHorizontal: 8, backgroundColor: C.surface, borderTopWidth: 1, borderColor: C.line },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 48, paddingTop: 6 },
  tabBadge: { position: 'absolute', top: 2, left: '50%', marginLeft: 6, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', left: 20, right: 20, zIndex: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.ink },
});
