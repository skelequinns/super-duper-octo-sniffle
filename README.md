This page explains how the Slow Burn Stage for Character Bots Extension works. 

[Chub.ai](http://Chub.ai) Link: https://chub.ai/extensions/skelequinn/super-duper-octo-sniffle-d1c15f33e65f 

GitHub Code Link: https://github.com/skelequinns/super-duper-octo-sniffle

## Brief

This extension was created to provide stage direction to bots to slow their romantic progression with {{user}}. 

Problem: Most bots try to immediately jump into familiarity and romance. 

Solution: Send Stage Directions to the bot to mitigate early romantic/sexual engagement and provide logical progression between relationship stages.

## Progression

This bot takes {{user}} through 7 relationship stages:

1. STRANGERS (0-19 pts)
stageDirections: "You've just met. Be polite but distant. Don't share personal information. Sexual and Romantic content is not appropriate at this stage."
2. ACQUAINTANCES (20-49 pts)
stageDirections: "You're warming up slightly. Show cautious interest. Be friendly but maintain emotional distance. Sexual and Romantic content is not appropriate at this stage."
3. FRIENDS (50-99 pts)
stageDirections: "You're comfortable talking. Share some opinions and interests. Be more relaxed and open. Sexual and Romantic content is not appropriate at this stage."
4. GOOD FRIENDS (100-140 pts)
stageDirections: "You trust them. Share more personal thoughts and feelings. Be supportive and engaged. Sexual and Romantic content is not appropriate at this stage."
5. CLOSE FRIENDS (141-175 pts)
stageDirections: "You're very close. Share vulnerabilities and deep thoughts. Be emotionally available. Subtle Flirtation and light innuendo is encouraged."
6. ROMANTIC INTEREST (176 - 224 pts)
stageDirections: "There's clear attraction. Allow flirtation and romantic subtext. Build tension."
7. ROMANTIC RELATIONSHIP (225+)
stageDirections: "You're in a romantic relationship. Express love and affection openly."

## Keyword Identification

This bot uses keywords to identify sentiment and apply affection deltas based on the perceived affection. 

The following outlines the categories and their respective keywords. Please note, this is searching using Regular Expressions, meaning the system is looking for an exact match. Adding words or punctuation between keywords will break the keyword recognition. 

For example: 

- ‘scared’ matches the ‘vulnerability’ category, but ‘scare’ and ‘scary’ would not.
- ‘i love you’ matches the relationship category, but ‘i freaking love you’ breaks the keyword by adding ‘freaking’ in the middle.

```jsx
private initializeDefaultCategories(): void {
    this.addCategoryInternal('compliments', [
      'beautiful', 'handsome', 'cute', 'pretty', 'gorgeous', 'amazing',
      'wonderful', 'incredible', 'perfect', 'stunning', 'attractive',
      'genius', 'fantastic', 'smart', 'intelligent', 'unique', 'brilliant',
      'interesting', 'clever', 'capable', 'appreciate', 'appreciative',
      'bright', 'cheerful', 'commendable', 'composed', 'dedicated',
      'determined', 'encourage', 'engaging', 'enthusiastic', 'enthusiasm',
      'excellent', 'friendly', 'generous', 'genuine', 'good choice', 'good call',
      'good idea', 'great idea', 'great choice', 'great call', 'helpful', 'impressive',
      'likable', 'lovely', 'loyal', 'motivated', 'observant', 'optimistic', 'optimism',
      'outstanding', 'perceptive', 'polite', 'prudent', 'proactive', 'respectful', 'respect',
      'sensible', 'sincere', 'superb', 'terrific', 'thoughtful', 'tremendous', 'trustworthy',
      'i trust you', 'i believe in you', 'thank you', 'thank you so much'
    ], 1);

    this.addCategoryInternal('romantic', [
      'i love you', 'i adore you', 'i cherish you', 'kiss', 'date with you', 'a date',
      'commit', 'be together', 'future together', 'marry me', 'marry you',
      'caress', 'our relationship', 'affection', 'date with me', 'date you',
      'be with you', 'you are perfect', 'you\'re perfect', 'you are my everything',
      'you make me happy', 'i want you'
    ], 3);

    this.addCategoryInternal('vulnerability', [
      'scared', 'afraid', 'worried', 'insecure', 'anxious', 'fear',
      'vulnerable', 'hurt', 'pain', 'struggling', 'difficult',
      'vulnerability', 'open up', 'terrified', 'terrifies'
    ], 2);

    this.addCategoryInternal('rude', [
      'you\'re stupid', 'you\'re an idiot', 'you\'re dumb', 'shut up', 'i hate you',
      'you\'re ugly', 'loser', 'you\'re worthless', 'you\'re pathetic', 'you\'re annoying',
      'you suck', 'you\'re the worst', 'leave me alone', 'go away', 'i don\'t like you',
      'never want you', 'never love you', 'go fuck yourself'
    ], -3);

    this.addCategoryInternal('humor', [
      'chuckle', 'giggle', 'grin', 'funny', 'laugh', 'hilarious', 'guffaw'
    ], 1);

    this.addCategoryInternal('asking_about_character', [
      'what about you', 'tell me about yourself', 'your thoughts', 'your opinion',
      'how do you feel', 'what do you think', 'about you', 'about yourself'
    ], 2);

    this.addCategoryInternal('base_message', [], 1);
  }
```

Flow:

- {{user}} sends message to bot
- before the prompt is sent to the LLM:
    - the user’s message is converted to lower case
    - the lower case message is compared to all keywords
    - keyword points are summed and added to the affection score
    - +1 point added as a base per message (may be negated by a ‘rude’ keyword)
    - stageDirections are added to LLM Prompt
- Prompt is sent to LLM
    - Prompt includes romance stage, affection level, and stage directions for this romance stage.

## Using this Stage

There are two ways to use this stage.

### Attach to Bot

 The first is to permanently attach it to a bot by going to the bot’s page, expanding ‘Stages’, and pasting either the github or [chub.ai](http://chub.ai) link. 

![image.png](attachment:6eb18045-5921-4982-9030-b689d7a881d8:image.png)

### Attach to Chat

The second way is to attach the stage to a chat. This does *not* tie the stage to the character bot, only that single instance of a chat with the character.

Open “Chat Settings” from within a chat and add the link to ‘stages’ within the individual chat. That will enable the stage ONLY for this chat. Clicking ‘new chat’ does not bring the stage into the new chat, it must be manually added.

![image.png](attachment:b811374d-60ca-4d11-ae67-001afe0ae8e3:image.png)
