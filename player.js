function Player({ id, name }) {
  this.id = id;
  this.name = name;
  this.hand = [];
  this.discardPile = [];
  this.numTokens = 0;
  this.isKnockedOut = false;
  this.handmaidActive = false;
  this.connected = true;
  // The player who receives a token of affection of this player wins the round
  this.jesterRecipientId = null;
}

Player.prototype = {
  addCardToHand: function(card) { this.hand.push(card); },

  discardCardById: function(cardId) {
    const cardIdx = this.hand.findIndex(card => card.id === cardId);

    if (cardIdx === -1) {
      throw `Tried to discard card but it isn't in hand`;
    }

    const discardedCards = this.hand.splice(cardIdx, 1);
    this.discardPile = this.discardPile.concat(discardedCards);
  },

  resetForNewRound: function() {
    this.hand = [];
    this.discardPile = [];
    this.isKnockedOut = false;
    this.jesterRecipientId = null;
  },

  // Take the player out of the round
  knockOut: function() {
    this.discardPile = this.discardPile.concat(this.hand);
    this.hand = [];
    this.isKnockedOut = true;

    // If the player has a Constable in their discard, award a token
    if (this.hasInDiscard(cards.CONSTABLE)) { ++this.numTokens; };
  },

  getCard: function(cardId) { return this.hand.find(card => card.id === cardId); },

  hasCard: function(cardType) { return !!this.hand.find(card => card.type === cardType); },

  setHandmaid: function(enabled) { this.handmaidActive = enabled; },

  hasInDiscard: function(cardType) {
    return !!this.discardPile.find(card => card.type === cardType);
  },

  getFinalCardNumber: function() {
    const numCountsInDiscard = this.discardPile.filter(card => card.type === cards.COUNT).length;
    return this.hand[0].getNumber() + numCountsInDiscard;
  },

  serialize: function ({ includeHand }) {
    const {
      discardPile,
      hand,
      handmaidActive,
      id,
      isKnockedOut,
      name,
      numTokens,
    } = this;

    return {
      discardPile,
      hand: includeHand ? hand : undefined,
      handmaidActive,
      id,
      isKnockedOut,
      name,
      numTokens,
    }
  },
}

module.exports = Player;
