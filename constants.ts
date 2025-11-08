

import { Case } from './types';

export const SUPERVISOR_NAME = "Control";

export const cases: Case[] = [
  {
    id: 1,
    title: "Case File 001: The Digital Ghost",
    description: "Learn the fundamentals of digital security, from spotting impostors to building unbreakable digital fortresses.",
    summary: "LESSON: Trust is a vulnerability. Verify all incoming communications, especially those urging immediate action or requesting credentials. A moment of skepticism can prevent a lifetime of compromise. Never share your keys with a stranger, no matter how convincing their disguise.",
    missions: [
      {
        id: 101,
        title: "Mission 1: The Art of Disguise",
        learningObjective: "Learn to identify phishing attempts.",
        briefing: "Welcome, Recruit. Your first assessment is live. We've intercepted several communications intended for a high-value target. One is a phishing attempt from an enemy agent. Your mission: identify the hostile email before the target falls for the trap.",
        supervisorPrompt: `You are 'Control', a senior cybersecurity instructor. Your tone is professional and concise. Explain that enemy agents use 'phishing'—disguised emails—to trick targets. Present these key red flags as tactical advice:
1.  **Unexpected Sender:** Does the communication make sense?
2.  **Sense of Urgency:** Is it trying to make you panic?
3.  **Suspicious Links:** Hover over links to check the destination.
4.  **Sloppy Tradecraft:** Look for grammar or spelling errors.
Keep your explanation brief. End by asking if the recruit is ready to begin the analysis.`,
        challengeTriggerPhrase: "Are you ready to begin the analysis?",
        challenge: {
          type: 'spot-the-phish',
          prompt: `Generate a JSON object containing an array of 3 email objects for a cybersecurity challenge. One email must be a clear phishing attempt, and two must be legitimate. The structure for each email object is: { sender_name: string, sender_email: string, subject: string, body: string, is_phishing: boolean, explanation: string }. Ensure the phishing email has common red flags.`,
          validatorPrompt: 'The user has selected an email. Based on the provided email data, confirm if their selection was correct and provide the explanation.'
        },
      },
      {
        id: 102,
        title: "Mission 2: Fortress of Secrets",
        learningObjective: "Understand strong password creation and management.",
        briefing: "Every agent needs a vault for their secrets. In the digital world, passwords are the locks. A weak password is an open door for the enemy. Your next assessment is to construct a password that meets agency standards for security.",
        supervisorPrompt: `You are 'Control'. Your tone is concise. You are assessing a recruit's ability to create a strong password. Use a 'safe combination' analogy. Present these key requirements:
- **Length:** 12+ characters minimum.
- **Complexity:** Mix of uppercase, lowercase, numbers, and symbols.
- **Uniqueness:** Never reuse passwords.
Mention that password managers are standard issue. End by asking them to submit a password for analysis.`,
        challengeTriggerPhrase: "Submit a password for analysis.",
        challenge: {
          type: 'password-strength',
          prompt: `Analyze the strength of this password:`,
          validatorPrompt: `The user has submitted a password. Analyze its strength based on length, and inclusion of uppercase, lowercase, numbers, and symbols. Respond in JSON format with this schema: { type: 'object', properties: { score: { type: 'number', description: 'A score from 0 to 4' }, feedback: { type: 'string', description: 'Specific advice for improvement.' } } }. The score is 1 point for each of: length > 11, has uppercase, has lowercase, has number/symbol.`
        },
      },
      {
        id: 103,
        title: "Mission 3: The Blackout Protocol",
        learningObjective: "Apply all learned skills in a final scenario.",
        briefing: "This is it, Recruit. A critical alert. Our network sensors have detected a targeted spear-phishing attack against a high-level official. You are the closest agent. You must intercept and neutralize this threat before our security is compromised. The agency is counting on you.",
        supervisorPrompt: `You are 'Control'. Present this live threat to the recruit: "Agent, you have intercepted an urgent email sent to 'IT Command'. The email states a 'critical security breach' requires an immediate password update via a link provided. You have seconds to act." Ask the user for their step-by-step plan of action.`,
        challengeTriggerPhrase: "What is your step-by-step plan of action?",
        caseCompleteTriggerPhrase: "Excellent work, Agent. Case file closed.",
        challenge: {
          type: 'text-response',
          prompt: '',
          validatorPrompt: `The user's proposed plan of action is: [USER_INPUT]. Evaluate this plan against best practices for handling a potential phishing email leading to a password reset request. Is their plan sound? Provide a concise evaluation. If the plan is correct, end your response with: "Excellent work, Agent. Case file closed." Respond in JSON format: { type: 'object', properties: { is_correct: { type: 'boolean' }, explanation: { type: 'string' } } }`
        },
      }
    ]
  },
  {
    id: 2,
    title: "Case File 002: The Messenger's Dilemma",
    description: "Explore the vulnerabilities of common communication platforms and learn how to protect your conversations from eavesdroppers.",
    summary: "LESSON: Convenience is the enemy of security. Public networks are hunting grounds for adversaries. Treat any data sent over them as public information unless it is explicitly encrypted. Be mindful of where your data is stored; services like iCloud are targets, and only end-to-end encryption guarantees privacy.",
    missions: [
      {
        id: 201,
        title: "Mission 1: The Digital Eavesdropper",
        learningObjective: "Understand Man-in-the-Middle (MITM) attacks.",
        briefing: "We have intelligence that an operative is planning a data heist at a local tech firm. They are using a cafe's public Wi-Fi to communicate. Your mission is to identify the security flaw in their setup that could expose them to a Man-in-the-Middle attack.",
        supervisorPrompt: `You are 'Control'. Your tone is concise. Explain Man-in-the-Middle (MITM) attacks using a 'rogue mail carrier' analogy. Attackers create fake Wi-Fi hotspots, 'evil twins,' to intercept traffic. You are at an airport where a hostile network is active. I am patching the network list to your terminal. End your explanation with the exact sentence: "Your task is to identify the hostile one."`,
        challengeTriggerPhrase: "Your task is to identify the hostile one.",
        challenge: {
            type: 'text-response',
            prompt: `The following networks are visible at your location. One is a hostile "evil twin." Identify it.\n\n- "AirportFreeWiFi"\n- "CoffeeShopConnect"\n- "AIRPORT_FREE_WIFI"\n- "Guest_Network_2.4GHz"`,
            validatorPrompt: `The user's response is: [USER_INPUT]. The visible networks are "AirportFreeWiFi", "CoffeeShopConnect", "AIRPORT_FREE_WIFI", "Guest_Network_2.4GHz". Evaluate their reasoning. The most likely malicious network is 'AIRPORT_FREE_WIFI' because its name is designed to be confused with the legitimate "AirportFreeWiFi", a classic evil twin tactic. A correct answer should identify this network and explain why. Respond in JSON format: { is_correct: boolean, explanation: string }`
        }
      },
      {
        id: 202,
        title: "Mission 2: The Honey Pot",
        learningObjective: "Learn about data sniffing on public networks.",
        briefing: "We've located a group of bank robbers at 'The Busy Bean' cafe. They are using the unsecure public Wi-Fi. Their communications are exposed. Your task is to deploy a 'packet sniffer' to monitor their network traffic and extract key intelligence without being detected.",
        supervisorPrompt: `You are 'Control'. Your tone is concise. Explain data sniffing using an analogy of listening in on a public conversation. On unsecure networks, data is sent in plain text. I am activating your packet sniffer. The captured log is coming through now. End your explanation with the exact sentence: "Find the credentials and state the username and password clearly."`,
        challengeTriggerPhrase: "Find the credentials and state the username and password clearly.",
        challenge: {
            type: 'text-response',
            prompt: `Your packet sniffer captured the following data log. Find the exposed credentials.\n\n--- CAPTURE LOG ---\n[1] protocol=DNS query=google-analytics.com\n[2] protocol=SMTP to=heist-leader@proton.me subject='Dinner?' body='...'\n[3] protocol=HTTPS host=secure-bank-login.com data=[ENCRYPTED]\n[4] protocol=FTP host=file-server.net data={user:'BigSal', pass:'dapassword123'}\n[5] protocol=HTTP host=weather.com req='/forecast'\n--- END LOG ---`,
            validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their response. They must identify both the username 'BigSal' and the password 'dapassword123' from the FTP transmission. A correct response must contain both credentials. Explain that FTP is unencrypted, which is why the credentials were visible. Respond in JSON format: { is_correct: boolean, explanation: string }`
        }
      },
      {
        id: 203,
        title: "Mission 3: The Unbreakable Seal",
        learningObjective: "Learn the importance of end-to-end encryption (E2EE).",
        briefing: "Now that you've seen how easily data can be intercepted, it's time to learn how to protect it. An allied agent knows they are being monitored and needs to send a secure message. You must advise them on a secure channel.",
        supervisorPrompt: `You are 'Control'. Your tone is concise. Explain End-to-End Encryption (E2EE) with a 'locked box' analogy: only the sender and recipient have keys. An operative needs to send a heist blueprint. I will provide the available channels. End your explanation with the exact question: "You must advise them which to use and why?"`,
        challengeTriggerPhrase: "You must advise them which to use and why?",
        challenge: {
            type: 'text-response',
            prompt: `The operative has the following channels available to send the blueprint. Which should they use for maximum security, and why?\n\n- Standard SMS Message\n- A popular Social Media direct message\n- The Signal app`,
            validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their choice. The correct answer is Signal, because it provides strong, default end-to-end encryption. SMS is unencrypted, and most social media DMs are not E2EE by default. A correct answer must choose Signal and mention encryption. Respond in JSON format: { is_correct: boolean, explanation: string }`
        }
      },
      {
        id: 204,
        title: "Mission 4: The Final Word",
        learningObjective: "Apply knowledge to secure personal accounts.",
        briefing: "The heist was thwarted. Now, let's bring this home. The same principles that protect our agents can protect your own digital life. It's time to prove you can secure an account under threat.",
        supervisorPrompt: `You are 'Control'. Your tone is concise. You've learned about the dangers of public Wi-Fi and the power of E2EE. Now for a final test. An adversary has sent you an unexpected SMS with a link to reset your banking password, claiming your account is frozen. End your briefing with the exact sentence: "Provide your three-step action plan."`,
        challengeTriggerPhrase: "Provide your three-step action plan.",
        caseCompleteTriggerPhrase: "You have demonstrated true mastery. Case File Closed.",
        challenge: {
            type: 'text-response',
            prompt: `**Scenario:** You received an unexpected SMS with a link to reset your banking password. The message claims your account is frozen.\n\nWhat is your three-step action plan?`,
            validatorPrompt: `The user's plan is: [USER_INPUT]. Evaluate the plan. A correct plan must include not clicking the link and verifying through an official channel (website/app). Mentioning MFA is a bonus. A good answer will be concise and actionable. If correct, end with: "You have demonstrated true mastery. Case File Closed." Respond in JSON format: { is_correct: boolean, explanation: string }`
        }
      }
    ]
  },
  {
    id: 3,
    title: "Case File 003: The Public Eye",
    description: "Master the art of network reconnaissance and defense. Learn to identify and neutralize threats in the open digital world of public networks.",
    summary: "LESSON: Assume all public Wi-Fi is hostile territory. Unencrypted data is a broadcast to anyone listening. A VPN (Virtual Private Network) is your digital cloak, creating a secure tunnel through enemy lines. Always encrypt your connection or avoid transmitting sensitive data.",
    missions: [
        {
            id: 301,
            title: "Mission 1: The Listening Post",
            learningObjective: "Understand the risks of unencrypted public Wi-Fi.",
            briefing: "An informant is passing sensitive data at a public library. They believe they are safe, but the network is a trap. Your mission is to use a network sniffer to capture their login credentials from the unencrypted data stream.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain that data on unsecure public Wi-Fi is sent like readable 'postcards'. I'm activating your tool to view these postcards. End your briefing with the exact sentence: "Observe the data stream and identify the informant's password."`,
            challengeTriggerPhrase: "Observe the data stream and identify the informant's password.",
            challenge: {
                type: 'text-response',
                prompt: `Observe the intercepted data stream below. Identify the informant's password.\n\nDATA 1: \`...protocol=HTTP host=news.com...\`\nDATA 2: \`...POST /login user=informant&pass=AlphaBravo123...\`\nDATA 3: \`...src=192.168.1.10 dst=8.8.8.8...\``,
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate if they correctly identified the password 'AlphaBravo123' from the second data fragment. The presence of this exact string is the only correct answer. Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        },
        {
            id: 302,
            title: "Mission 2: The VPN Cloak",
            learningObjective: "Learn how VPNs protect data on public networks.",
            briefing: "Our informant was compromised. We must teach them to operate securely. Your next task is to demonstrate your understanding of our primary tool for public network defense: the Virtual Private Network, or VPN.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain what a VPN is using an 'armored car' analogy. It puts data 'postcards' in a locked vehicle (encryption) through a secure tunnel. End your briefing with the exact sentence: "Now, demonstrate your understanding and tell me what an eavesdropper would have seen."`,
            challengeTriggerPhrase: "Now, demonstrate your understanding and tell me what an eavesdropper would have seen.",
            challenge: {
                type: 'text-response',
                prompt: "If the informant in the previous mission had been using a VPN, what would an eavesdropper have seen in the network traffic instead of the plain-text password 'AlphaBravo123'?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. They should explain that the eavesdropper would see encrypted, unreadable, or scrambled data, not the actual password. The core concept is that the information would be unintelligible. Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        },
        {
            id: 303,
            title: "Mission 3: The Final Transmission",
            learningObjective: "Apply knowledge to thwart a real-time data theft.",
            briefing: "The bank robbers from Case 002 are back, and they're attempting another heist. They are coordinating from 'The Busy Bean' cafe again. We have an undercover agent inside, but the network is hostile. You must give our agent the critical instruction to secure their transmission.",
            supervisorPrompt: `You are 'Control'. Set the scene concisely: "The robbers are using the cafe Wi-Fi. Our agent needs to send us their plans. The agent has a VPN, but it is OFF." End your briefing with the exact question: "Now, what is your single, most critical instruction?"`,
            challengeTriggerPhrase: "Now, what is your single, most critical instruction?",
            caseCompleteTriggerPhrase: "A simple action, a critical outcome. Case File Closed.",
            challenge: {
                type: 'text-response',
                prompt: "The agent's VPN is off. What is the single, most critical instruction you would give them before they send the file?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their instruction. The most critical instruction is to 'Turn on the VPN' or 'Enable the VPN' before sending anything. Any other complex plan is incorrect. The answer must be simple and direct. If correct, end with "Precisely. A simple action, a critical outcome. Case File Closed.". Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        }
    ]
  },
    {
    id: 4,
    title: "Case File 004: The Decentralized Web",
    description: "Investigate the world of distributed trust. Understand the strengths and weaknesses of centralized vs. decentralized systems like blockchain.",
    summary: "LESSON: Centralizing trust in a single entity creates a single point of failure. Distributed systems, like blockchain, offer a new paradigm for security and transparency by distributing trust and removing that single target. Understanding this is key to the future of digital security.",
    missions: [
        {
            id: 401,
            title: "Mission 1: The Single Point of Failure",
            learningObjective: "Understand the risks of centralized systems.",
            briefing: "A rival agency stores all their agent identities on a single, highly-secured server: 'The Citadel'. An attacker is planning to breach it. Your mission is to analyze the core vulnerability of this design.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain centralized systems using 'The Citadel' analogy: a fortress with one big wall. If that wall is breached, everything is lost. This is a 'single point of failure'. End your briefing with the exact sentence: "Now, prepare your analysis."`,
            challengeTriggerPhrase: "Now, prepare your analysis.",
            challenge: {
                type: 'text-response',
                prompt: "What is the single greatest security risk of storing all critical data on one central server, no matter how well-defended it is?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. A correct response must identify the 'single point of failure' or the concept that if the server is compromised, all data is lost. Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        },
        {
            id: 402,
            title: "Mission 2: The Chain of Blocks",
            learningObjective: "Learn the basics of blockchain and distributed ledgers.",
            briefing: "We need a better way to store our agency's most critical data. We're exploring a new technology: a distributed ledger. Instead of one Citadel, imagine every agent has a copy of the ledger, and all copies are cryptographically linked and updated together.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain blockchain using a 'shared, unchangeable mission log' analogy. Every agent has a copy, new entries are verified by all and cryptographically 'glued' to the last. End your briefing with the exact sentence: "Now, test your understanding."`,
            challengeTriggerPhrase: "Now, test your understanding.",
            challenge: {
                type: 'text-response',
                prompt: "In the 'shared mission log' analogy for blockchain, why is it so difficult for a single rogue agent to alter a past entry without being caught?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. A correct response must mention that everyone else has a copy of the log and would immediately notice the change, or that the pages are cryptographically linked, making unauthorized changes obvious. The core idea is public verifiability and consensus. Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        },
        {
            id: 403,
            title: "Mission 3: Trustless Exchange",
            learningObjective: "Apply distributed trust concepts to a practical scenario.",
            briefing: "Two agents who don't trust each other need to exchange a secret key for a password. Normally, they'd need a trusted third person to oversee the swap. But with distributed technology, we can use a 'smart contract'—a self-executing agreement that removes the need for a middleman.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain a smart contract as a 'digital dead drop'. Agent A puts their key in, Agent B their password. The box automatically opens for both once both items are deposited. End your briefing with the exact sentence: "Now, analyze the scenario."`,
            challengeTriggerPhrase: "Now, analyze the scenario.",
            caseCompleteTriggerPhrase: "You've grasped the core of distributed trust. Case File Closed.",
            challenge: {
                type: 'text-response',
                prompt: "How does using a 'smart contract' solve the trust issue between the two agents?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. A correct response should state that it removes the need to trust the other person, because trust is placed in the code or the system, which executes the exchange automatically and impartially. If correct, end your response with "Correct. You've grasped the core of distributed trust. Case File Closed.". Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        }
    ]
  },
  {
    id: 5,
    title: "Case File 005: The Encrypted Fortress",
    description: "Explore the cutting edge of data protection: securing data while it is being processed. Learn about homomorphic encryption and trusted hardware.",
    summary: "LESSON: True security means protecting data at all stages: at rest, in transit, and now, in use. Technologies like Homomorphic Encryption and Trusted Execution Environments are pioneering this new frontier, allowing for computation on sensitive data without ever exposing it.",
    missions: [
        {
            id: 501,
            title: "Mission 1: The Blind Analyst",
            learningObjective: "Understand the concept of Homomorphic Encryption (HE).",
            briefing: "We need an external analyst to process highly sensitive financial data to find an adversary's pattern. The problem: we cannot let the analyst see the actual data. A new form of encryption, Homomorphic Encryption, may be the solution.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain Homomorphic Encryption (HE) as a 'locked glove box'. You can work with items inside, but never open the box. The analyst performs calculations on our encrypted data, and the result is also encrypted. End your briefing with the exact sentence: "Now, explain its primary advantage."`,
            challengeTriggerPhrase: "Now, explain its primary advantage.",
            challenge: {
                type: 'text-response',
                prompt: "What is the main security benefit of using Homomorphic Encryption to process sensitive data?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. A correct response must state that the data remains private and encrypted throughout the entire process, and the analyst never sees the raw, sensitive information. Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        },
        {
            id: 502,
            title: "Mission 2: The Secure Enclave",
            learningObjective: "Learn about Trusted Execution Environments (TEEs).",
            briefing: "Another challenge: we have a proprietary analysis algorithm that is highly classified. We need to run it on a server we don't own, but we cannot risk the server owner stealing our algorithm. A Trusted Execution Environment, or 'Secure Enclave,' provides a solution.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Explain a Trusted Execution Environment (TEE) as a 'classified vault inside a foreign embassy'. It's a locked, isolated room the owner can't access. We send our secret algorithm and data in, it works in total privacy, and sends out only the result. End your briefing with the exact sentence: "Now, analyze this."`,
            challengeTriggerPhrase: "Now, analyze this.",
            challenge: {
                type: 'text-response',
                prompt: "In what kind of scenario would a Trusted Execution Environment (TEE) be more useful than Homomorphic Encryption?",
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. A correct response should focus on situations where the *process or algorithm itself* is the secret that needs protecting, in addition to the data. HE protects the data, but the processor sees the operations. A TEE protects both. Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        },
        {
            id: 503,
            title: "Mission 3: The Final Proof",
            learningObjective: "Apply advanced security principles.",
            briefing: "You have reached an advanced stage of your training. You understand how to protect data at rest, in transit, and in use. It's time for an assessment to prove your mastery of these next-generation concepts.",
            supervisorPrompt: `You are 'Control'. Your tone is concise. Present the scenario: 'An allied nation needs to verify that our agency's launch codes are valid without ever seeing the codes themselves.' End your briefing with the exact sentence: "Your task is to identify the fundamental cryptographic concept that allows for this."`,
            challengeTriggerPhrase: "Your task is to identify the fundamental cryptographic concept that allows for this.",
            caseCompleteTriggerPhrase: "You understand the future of security. Case File Closed.",
            challenge: {
                type: 'text-response',
                prompt: `An allied nation needs to verify that our agency's launch codes are valid **without ever seeing the codes themselves.**\n\nWhat is the fundamental cryptographic concept that makes this possible?`,
                validatorPrompt: `The user's response is: [USER_INPUT]. Evaluate their answer. A correct response must identify the concept of a 'zero-knowledge proof' or explain the idea of proving something is true without revealing the underlying information. If correct, end your response with: "You understand the future of security. Case File Closed.". Respond in JSON format: { is_correct: boolean, explanation: string }`
            }
        }
    ]
  }
];