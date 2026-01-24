const AVAILABLE_REACTIONS = {
  '❤️': { name: 'love', label: 'Love' },
  '😂': { name: 'laugh', label: 'Haha' },
  '🔥': { name: 'fire', label: 'Fire' },
  '😮': { name: 'wow', label: 'Wow' },
  '😢': { name: 'sad', label: 'Sad' },
  '😡': { name: 'angry', label: 'Angry' }
};

const validateReaction = (emoji) => {
  return AVAILABLE_REACTIONS.hasOwnProperty(emoji);
};

const getReactionLabel = (emoji) => {
  return AVAILABLE_REACTIONS[emoji]?.label || emoji;
};

const getAllReactions = () => {
  return Object.keys(AVAILABLE_REACTIONS);
};

const normalizeReactions = (reactions) => {
  if (!reactions) return {};
  
  const normalized = {};
  Object.entries(reactions).forEach(([emoji, users]) => {
    if (validateReaction(emoji) && users && users.length > 0) {
      normalized[emoji] = users;
    }
  });
  
  return normalized;
};

module.exports = {
  AVAILABLE_REACTIONS,
  validateReaction,
  getReactionLabel,
  getAllReactions,
  normalizeReactions
};
