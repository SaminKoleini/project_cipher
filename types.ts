export interface Message {
  sender: 'user' | 'supervisor' | 'ai-assistant';
  text: string;
}

export interface PhishingChallenge {
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  is_phishing: boolean;
  explanation: string;
}

export interface Challenge {
  type: 'spot-the-phish' | 'password-strength' | 'text-response';
  prompt: string;
  validatorPrompt: string;
}

export interface Mission {
  id: number;
  title: string;
  briefing: string;
  learningObjective: string;
  supervisorPrompt: string;
  challenge: Challenge;
  challengeTriggerPhrase: string;
  caseCompleteTriggerPhrase?: string;
  trainingCompleteTriggerPhrase?: string;
}

export interface Case {
  id: number;
  title: string;
  description: string;
  missions: Mission[];
  summary: string;
}