import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../utils/theme';
import { AppButton, AppCard, AppInput, AppText } from '../components/design-system';
import { ChatbotWelcomeIllustration } from '../components/illustrations';
import {
  askFirstAidAssistant,
  CHATBOT_MIN_QUERY_LENGTH,
  getChatbotReadiness,
} from '../utils/chatbotApi';

const QUICK_PROMPTS = [
  { key: 'burn', query: 'What should I do for a burn?' },
  { key: 'bleeding', query: 'How do I stop heavy bleeding?' },
  { key: 'fainting', query: 'What should I do if someone faints?' },
  { key: 'choking', query: 'Someone is choking and cannot breathe. What should I do?' },
];

const buildAssistantError = (error, t) => {
  const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
  const isNetwork = error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';

  if (error?.code === 'CHATBOT_QUERY_TOO_SHORT') {
    return t(
      'chatbot.errors.tooShort',
      'Please describe the first-aid situation with a little more detail.'
    );
  }

  if (isTimeout) {
    return t(
      'chatbot.errors.timeout',
      'The assistant did not respond in time. Please check the connection and try again.'
    );
  }

  if (isNetwork) {
    return t(
      'chatbot.errors.network',
      'The first-aid assistant service is unreachable right now. Please try again when the service is online.'
    );
  }

  return (
    error?.response?.data?.detail?.[0]?.msg ||
    error?.response?.data?.detail ||
    error?.message ||
    t('chatbot.errors.generic', 'The assistant could not answer right now. Please try again.')
  );
};

const getServiceStatusCopy = (status, t) => {
  if (status === 'ready') {
    return t('chatbot.serviceReady', 'Assistant service ready');
  }

  if (status === 'offline') {
    return t('chatbot.serviceOffline', 'Assistant service offline');
  }

  return t('chatbot.serviceChecking', 'Checking assistant service');
};

export default function ChatbotScreen() {
  const { t } = useTranslation();
  const { colors, radius, shadows, isRTL } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, radius, shadows, isRTL),
    [colors, radius, shadows, isRTL]
  );
  const scrollRef = useRef(null);

  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [serviceStatus, setServiceStatus] = useState('checking');
  const [serviceInfo, setServiceInfo] = useState(null);
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

  const checkServiceStatus = useCallback(async() => {
    setServiceStatus('checking');

    try {
      const readiness = await getChatbotReadiness();
      setServiceInfo(readiness);
      setServiceStatus(readiness?.status === 'ready' ? 'ready' : 'offline');
    } catch (error) {
      setServiceInfo(null);
      setServiceStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkServiceStatus();
  }, [checkServiceStatus]);

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 50);

    return () => clearTimeout(scrollTimer);
  }, [messages.length, isSending]);

  const sendMessage = async(value, displayValue = null) => {
    const content = (value ?? draft).trim();
    if (!content || isSending) return;
    if (content.length < CHATBOT_MIN_QUERY_LENGTH) {
      setDraftError(
        t(
          'chatbot.errors.tooShort',
          'Please describe the first-aid situation with a little more detail.'
        )
      );
      return;
    }

    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: `u-${timestamp}`, role: 'user', text: displayValue || content },
    ]);
    setDraft('');
    setDraftError('');
    setIsSending(true);

    try {
      const result = await askFirstAidAssistant(content);
      if (serviceStatus !== 'ready') {
        setServiceStatus('ready');
      }
      setMessages((current) => [
        ...current,
        {
          id: `a-${timestamp + 1}`,
          role: 'assistant',
          text:
            result.answer ||
            t(
              'chatbot.emptyAnswer',
              'I could not find a reliable first-aid answer for that question.'
            ),
          confidence: result.confidence,
          answerMode: result.answerMode,
          topicPrediction: result.topicPrediction,
        },
      ]);
    } catch (error) {
      if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        setServiceStatus('offline');
      }
      setMessages((current) => [
        ...current,
        {
          id: `a-${timestamp + 1}`,
          role: 'assistant',
          text: buildAssistantError(error, t),
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftChange = (value) => {
    setDraft(value);
    if (draftError) {
      setDraftError('');
    }
  };

  const isInitialState =
    messages.length === 1 && messages[0].id === 'welcome' && !isSending;
  const visibleMessages = isInitialState ? [] : messages;
  const submitDisabled = isSending || draft.trim().length < CHATBOT_MIN_QUERY_LENGTH;
  const serviceStatusColor =
    serviceStatus === 'ready'
      ? colors.success
      : serviceStatus === 'offline'
        ? colors.error
        : colors.textSecondary;
  const serviceStatusIcon =
    serviceStatus === 'ready' ? 'check-circle' : serviceStatus === 'offline' ? 'wifi-off' : 'clock';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
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
          {t(
            'chatbot.subtitle',
            'Fast basic first-aid guidance. This does not replace emergency care or a doctor.'
          )}
        </AppText>
      </View>

      <AppCard style={styles.warningCard}>
        <View style={styles.warningRow}>
          <Feather name="alert-triangle" size={16} color={colors.warning} />
          <AppText variant="bodySmall" color={colors.textSecondary} style={{ flex: 1 }}>
            {t(
              'chatbot.disclaimer',
              'Emergency warning signs such as breathing trouble, severe bleeding, seizures, chest pain, or loss of consciousness need urgent medical help.'
            )}
          </AppText>
        </View>
        <View style={styles.statusRow}>
          <Feather
            name={serviceStatusIcon}
            size={15}
            color={serviceStatusColor}
          />
          <AppText variant="labelSmall" color={serviceStatusColor} style={{ flex: 1 }}>
            {getServiceStatusCopy(serviceStatus, t)}
            {serviceInfo?.documents ? ` - ${serviceInfo.documents}` : ''}
          </AppText>
          {serviceStatus === 'offline' ? (
            <TouchableOpacity
              onPress={checkServiceStatus}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel={t('chatbot.retry', 'Retry')}
            >
              <AppText variant="labelSmall" color={colors.primary}>
                {t('chatbot.retry', 'Retry')}
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppCard>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {isInitialState ? (
          <AppCard style={styles.welcomeCard} elevation={2}>
            <View style={styles.welcomeContent}>
              <ChatbotWelcomeIllustration size={120} />
              <AppText variant="headerSmall" align="center" style={{ marginTop: 6 }}>
                {t('chatbot.welcomeTitle', 'How can I help you today?')}
              </AppText>
              <AppText
                variant="bodySmall"
                color={colors.textSecondary}
                align="center"
                style={{ marginTop: 6, maxWidth: 280 }}
              >
                {t(
                  'chatbot.welcomeSubtitle',
                  'Pick a quick topic below or describe a first-aid situation in your own words.'
                )}
              </AppText>
            </View>
          </AppCard>
        ) : null}

        <View style={styles.prompts}>
          {QUICK_PROMPTS.map((prompt) => {
            const promptLabel = t(`chatbot.prompts.${prompt.key}`, prompt.key);

            return (
              <TouchableOpacity
                key={prompt.key}
                style={[styles.promptChip, isSending ? styles.disabledPrompt : null]}
                onPress={() => sendMessage(prompt.query, promptLabel)}
                disabled={isSending}
                activeOpacity={0.76}
                accessibilityRole="button"
                accessibilityLabel={promptLabel}
              >
                <AppText variant="labelMedium" color={colors.text}>
                  {promptLabel}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {visibleMessages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <AppCard
              key={message.id}
              style={[
                styles.messageCard,
                isUser ? styles.userMessage : styles.assistantMessage,
                message.isError ? styles.errorMessage : null,
              ]}
            >
              <AppText
                variant="labelSmall"
                color={isUser ? 'rgba(255,255,255,0.74)' : colors.textSecondary}
              >
                {isUser ? t('chatbot.you', 'You') : t('chatbot.assistant', 'Assistant')}
              </AppText>
              <AppText
                variant="bodyMedium"
                color={isUser ? '#FFFFFF' : colors.text}
                style={{ marginTop: 6 }}
              >
                {message.text}
              </AppText>
              {!isUser && message.topicPrediction ? (
                <View style={styles.metaRow}>
                  <AppText variant="labelSmall" color={colors.textSecondary}>
                    {t('chatbot.topic', 'Topic')}: {message.topicPrediction}
                  </AppText>
                  {typeof message.confidence === 'number' ? (
                    <AppText variant="labelSmall" color={colors.textSecondary}>
                      {t('chatbot.confidence', 'Confidence')}:{' '}
                      {Math.round(message.confidence * 100)}%
                    </AppText>
                  ) : null}
                </View>
              ) : null}
            </AppCard>
          );
        })}

        {isSending ? (
          <AppCard style={[styles.messageCard, styles.assistantMessage]}>
            <AppText variant="labelSmall" color={colors.textSecondary}>
              {t('chatbot.assistant', 'Assistant')}
            </AppText>
            <AppText variant="bodyMedium" color={colors.text} style={{ marginTop: 6 }}>
              {t('chatbot.thinking', 'Checking first-aid guidance...')}
            </AppText>
          </AppCard>
        ) : null}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppInput
          placeholder={t('chatbot.placeholder', 'Describe the first-aid situation...')}
          value={draft}
          onChangeText={handleDraftChange}
          editable={!isSending}
          error={draftError}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
          autoCapitalize="sentences"
          autoCorrect
          style={{ flex: 1, marginBottom: 0 }}
        />
        <AppButton
          title={t('chatbot.send', 'Send')}
          onPress={() => sendMessage()}
          loading={isSending}
          disabled={submitDisabled}
          icon={<Feather name="send" size={16} color="#FFFFFF" />}
          style={{ minWidth: 108 }}
        />
      </View>
    </KeyboardAvoidingView>
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
    statusRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    retryButton: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: radius.full,
      backgroundColor: colors.primaryMuted,
    },
    messages: {
      flex: 1,
      marginTop: 12,
    },
    welcomeCard: {
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 12,
    },
    welcomeContent: {
      alignItems: 'center',
      paddingVertical: 8,
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
    disabledPrompt: {
      opacity: 0.56,
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
    errorMessage: {
      borderColor: colors.error,
    },
    metaRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 10,
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
