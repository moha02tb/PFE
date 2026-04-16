import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../utils/theme';
import { AppButton, AppCard, AppInput, AppText } from '../components/design-system';

const QUICK_PROMPTS = ['burn', 'bleeding', 'fainting', 'choking'];

const buildReply = (message, t) => {
  const text = message.toLowerCase();
  if (text.includes('burn') || text.includes('brul') || text.includes('حرق')) {
    return t('chatbot.answers.burn', 'Cool the burn under clean running water for 10 to 20 minutes. Do not apply ice. Cover it with a clean non-stick cloth and seek urgent care if the burn is large, deep, or on the face, hands, feet, or genitals.');
  }
  if (text.includes('bleed') || text.includes('blood') || text.includes('saigne') || text.includes('نزيف')) {
    return t('chatbot.answers.bleeding', 'Apply firm direct pressure with a clean cloth, keep pressure steady, and raise the injured area if possible. If bleeding is heavy or does not stop quickly, call emergency services immediately.');
  }
  if (text.includes('faint') || text.includes('syncope') || text.includes('évan') || text.includes('إغم')) {
    return t('chatbot.answers.fainting', 'Lay the person flat, raise the legs slightly, loosen tight clothing, and make sure they can breathe. If they do not wake quickly, have trouble breathing, or were injured during the fall, call emergency services.');
  }
  if (text.includes('chok') || text.includes('étouff') || text.includes('اختناق')) {
    return t('chatbot.answers.choking', 'If the person cannot speak or breathe, call emergency services and start age-appropriate choking first aid immediately. Encourage coughing only if they can still breathe.');
  }
  return t('chatbot.answers.default', 'I can give basic first-aid guidance for burns, bleeding, choking, fainting, fever, and allergic reactions. For severe symptoms or danger signs, call emergency services immediately.');
};

export default function ChatbotScreen() {
  const { t } = useTranslation();
  const { colors, radius, shadows, isRTL } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, radius, shadows, isRTL), [colors, radius, shadows, isRTL]);

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: t(
        'chatbot.welcome',
        'I am a first-aid assistant. Ask about burns, bleeding, choking, fainting, fever, or allergic reactions. For severe danger signs, call emergency services immediately.'
      ),
    },
  ]);

  const sendMessage = (value) => {
    const content = (value ?? draft).trim();
    if (!content) return;
    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: 'user', text: content },
      { id: `a-${Date.now() + 1}`, role: 'assistant', text: buildReply(content, t) },
    ]);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Feather name="heart" size={16} color="#FFFFFF" />
          <AppText variant="labelMedium" color="#FFFFFF">
            {t('chatbot.badge', 'First Aid')}
          </AppText>
        </View>
        <AppText variant="headerLarge" color="#FFFFFF" style={{ marginTop: 14 }}>
          {t('chatbot.title', 'First Aid Assistant')}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.82)" style={{ marginTop: 8 }}>
          {t('chatbot.subtitle', 'Fast basic first-aid guidance. This does not replace emergency care or a doctor.')}
        </AppText>
      </View>

      <AppCard style={styles.warningCard}>
        <View style={styles.warningRow}>
          <Feather name="alert-triangle" size={16} color={colors.warning} />
          <AppText variant="bodySmall" color={colors.textSecondary} style={{ flex: 1 }}>
            {t('chatbot.disclaimer', 'Emergency warning signs such as breathing trouble, severe bleeding, seizures, chest pain, or loss of consciousness need urgent medical help.')}
          </AppText>
        </View>
      </AppCard>

      <ScrollView style={styles.messages} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.prompts}>
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => sendMessage(prompt)}>
              <AppText variant="labelMedium" color={colors.text}>
                {t(`chatbot.prompts.${prompt}`, prompt)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <AppCard key={message.id} style={[styles.messageCard, isUser ? styles.userMessage : styles.assistantMessage]}>
              <AppText variant="labelSmall" color={isUser ? 'rgba(255,255,255,0.74)' : colors.textSecondary}>
                {isUser ? t('chatbot.you', 'You') : t('chatbot.assistant', 'Assistant')}
              </AppText>
              <AppText variant="bodyMedium" color={isUser ? '#FFFFFF' : colors.text} style={{ marginTop: 6 }}>
                {message.text}
              </AppText>
            </AppCard>
          );
        })}
      </ScrollView>

      <View style={styles.composer}>
        <AppInput
          placeholder={t('chatbot.placeholder', 'Describe the first-aid situation...')}
          value={draft}
          onChangeText={setDraft}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <AppButton
          title={t('chatbot.send', 'Send')}
          onPress={() => sendMessage()}
          icon={<Feather name="send" size={16} color="#FFFFFF" />}
          style={{ minWidth: 108 }}
        />
      </View>
    </View>
  );
}

const createStyles = (colors, radius, shadows, isRTL) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundAccent,
    },
    hero: {
      marginHorizontal: 16,
      marginTop: 16,
      padding: 24,
      borderRadius: radius.xxl,
      backgroundColor: colors.primary,
      ...shadows.floating,
    },
    heroBadge: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    warningCard: {
      marginHorizontal: 16,
      marginTop: 12,
    },
    warningRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    messages: {
      flex: 1,
      marginTop: 12,
    },
    prompts: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    promptChip: {
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageCard: {
      marginHorizontal: 16,
      marginBottom: 12,
    },
    assistantMessage: {
      marginRight: isRTL ? 16 : 52,
      marginLeft: isRTL ? 52 : 16,
    },
    userMessage: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      marginLeft: isRTL ? 16 : 52,
      marginRight: isRTL ? 52 : 16,
    },
    composer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.backgroundAccent,
    },
  });
