const _ = require('lodash');

const Card = require('./card');
const Game = require('./game');
const User = require('./user');
const { cards } = require('./constants');

let game;
let players;

const mockBroadcast = jest.fn();
const mockBroadcastSystemMessage = jest.fn();
const mockEmitToUser = jest.fn();

beforeEach(() => {
  users = {
    '1': new User('1'),
    '2': new User('2'),
    '3': new User('3'),
  };
  game = new Game({
    broadcast: mockBroadcast,
    broadcastSystemMessage: mockBroadcastSystemMessage,
    emitToUser: mockEmitToUser,
    users,
  });
  game.setup();
});

describe('newRound', () => {
  it('creates a deck', () => {
    game.newRound();
    expect(game.deck).toHaveLength(15);
  });

  it('deals cards', () => {
    game.newRound();
    Object.values(game.players).forEach(player => {
      const numCards = (player.id === game.activePlayerId) ? 2 : 1;
      expect(player.hand).toHaveLength(numCards);
      expect(player.hand[0].type).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('removeUser', () => {
  it('removes the user from player list', () => {
    const id = '123'
    game.players = { [id]: {} };
    game.spectatorIds = [id];
    game.removeUser(id);
    expect(game.players[id].connected).toEqual(false);
    expect(game.spectatorIds.find(spectatorId => spectatorId === id)).toBeFalsy();
  });
});

describe('nextTurn', () => {
  const subject = () => game.nextTurn();

  it('changes the player turn', () => {
    subject();
    const { activePlayerId } = game;
    subject();
    const newActivePlayerId = game.activePlayerId;
    expect(newActivePlayerId).not.toEqual(activePlayerId);
  });

  it('adds a card to the hand of the player', () => {
    const oldPlayers = _.cloneDeep(game.players);
    subject();
    const oldHand = oldPlayers[game.activePlayerId].hand;
    const newHand = game.players[game.activePlayerId].hand;
    expect(newHand.length).toBeGreaterThan(oldHand.length);
  });

  describe('when a player has been knocked out', () => {
    beforeEach(() => {
      const secondPlayerId = game.playerOrder[1];
      game.players[secondPlayerId].isKnockedOut = true;
    });

    it('skips the knocked out player', () => {
      const thirdPlayerId = game.playerOrder[2];
      subject();
      expect(game.activePlayerId).toEqual(thirdPlayerId);
    });
  });
});

describe('playCard', () => {
  it('plays the card', () => {
    game.playerOrder = ['1', '2'];
    game.playerOrderCursor = 1;
    game.activePlayerId = '1';
    game.players['1'].hand = [
      new Card({ id: 0, type: cards.HANDMAID }),
      new Card({ id: 1, type: cards.GUARD }),
    ];
    game.playCard(game.activePlayerId, 0);
    const player = game.players['1'];
    expect(player.hand).toHaveLength(1);
    expect(player.discardPile.find(discardCard => discardCard.id === 0)).toBeTruthy();
  });

  describe('when targeting self with prince and previously played handmaid', () => {
    it('counts as a legal move', () => {
      game.playerOrder = ['1', '2'];
      game.playerOrderCursor = 1;
      game.activePlayerId = '1';
      const player = game.players['1'];
      player.hand = [
        new Card({ id: 0, type: cards.PRINCE }),
        new Card({ id: 1, type: cards.GUARD }),
      ];
      player.discardPile = [
        new Card({ id: 2, type: cards.HANDMAID }),
      ];
      player.handmaidActive = true;
      game.playCard('1', 0, { targetPlayerId: '1' });
      expect(player.hand.find(card => card.id === 1)).toBeFalsy();
      expect(player.discardPile.find(card => card.id === 1)).toBeTruthy();
    });
  });

  describe('illegal moves', () => {
    describe('when both Countess and King are in hand', () => {
      it('prohibits playing the King', () => {
        game.activePlayerId = '1';
        game.players['1'].hand = [
          new Card({ id: 0, type: cards.COUNTESS }),
          new Card({ id: 1, type: cards.KING }),
        ];
        game.playCard(game.activePlayerId, 1);
        const player = game.players[game.activePlayerId];
        expect(player.hand).toHaveLength(2);
        expect(player.hand.find(card => card.type === cards.KING)).toBeTruthy();
        expect(player.hand.find(card => card.type === cards.COUNTESS)).toBeTruthy();
      });
    });

    describe('targeting the handmaid', () => {
      beforeEach(() => {
        game.activePlayerId = '1';
        game.players['1'].hand = [
          new Card({ id: 0, type: cards.GUARD }),
          new Card({ id: 1, type: cards.KING }),
        ];
        game.players['2'].hand = [
          new Card({ id: 2, type: cards.PRINCESS }),
        ];
        game.players['2'].handmaidActive = true;
      });

      it('has no effect', () => {
        game.playCard('1', 0, { targetPlayerId: '2' });
        const activePlayerHand = game.players['1'].hand;
        expect(activePlayerHand.find(card => card.type === cards.GUARD)).toBeTruthy();
        expect(activePlayerHand.find(card => card.type === cards.KING)).toBeTruthy();
        expect(game.players['2'].hand[0].type).toEqual(cards.PRINCESS);
      });
    });

    describe('targeting a knocked out player', () => {
      beforeEach(() => {
        game.activePlayerId = '1';
        game.players['1'].hand = [
          new Card({ id: 0, type: cards.GUARD }),
          new Card({ id: 1, type: cards.KING }),
        ];
        game.players['2'].isKnockedOut = true;
      });

      it('has no effect', () => {
        game.playCard('1', 1, { targetPlayerId: '2' });
        expect(game.players['1'].hand[0].type).toEqual(cards.GUARD);
        expect(game.players['1'].hand[1].type).toEqual(cards.KING);
      });
    });
  });
});

describe('serializeForPlayer', () => {
  it('serializes correctly', () => {
    const { players, roundNum, state } = game.serializeForPlayer('1');
    expect(roundNum).toEqual(game.roundNum);
    expect(state).toEqual(game.state);
    expect(players['1'].hand).toBeTruthy();
    // Shouldn't reveal other players' hands
    expect(players['2'].hand).toBeUndefined();
    expect(players['3'].hand).toBeUndefined();
  });
});

describe('endRound', () => {
  it('assigns a token to the winner', () => {
    game.players['1'].hand = [new Card({ id: 100, type: cards.GUARD})];
    game.players['2'].hand = [new Card({ id: 101, type: cards.PRINCESS})];
    game.players['3'].hand = [new Card({ id: 102, type: cards.GUARD})];
    game.endRound();
    expect(game.players['1'].numTokens).toEqual(0);
    expect(game.players['2'].numTokens).toEqual(1);
    expect(game.players['3'].numTokens).toEqual(0);
  });
});

describe('getAlivePlayers', () => {
  const subject = () => game.getAlivePlayers();

  it('gets all alive players', () => {
    expect(subject()).toHaveLength(3);
  });
});

describe('performCardEffect', () => {
  describe('when all other players have a handmaid', () => {
    it('has no effect', () => {
      game.activePlayerId = '1';
      const card = new Card({ id: 0, type: cards.PRINCE });
      game.players['1'].hand = [card];
      game.players['2'].handmaidActive = true;
      game.players['3'].hand = [
        new Card({ id: 2, type: cards.PRINCESS }),
      ];
      game.players['3'].handmaidActive = true;
      const success = game.performCardEffect(card, { targetPlayerId: '3' });
      expect(success).toEqual(false);
      expect(game.players['3'].hand).toHaveLength(1);
      expect(game.players['3'].hand[0].type).toEqual(cards.PRINCESS);
      expect(game.players['1'].hand[0].type).toEqual(cards.PRINCE);
    });

    describe('and the active player had handmaid status from previous turn', () => {
      it('removes the active player\'s handmaid status', () => {
        game.activePlayerId = '1';
        const card = new Card({ id: 0, type: cards.GUARD });
        game.players['1'].hand = [card];
        game.players['1'].handmaidActive = true;
        game.players['2'].handmaidActive = true;
        game.players['3'].handmaidActive = true;
        const success = game.performCardEffect(card);
        expect(success).toEqual(false);
        expect(game.players['1'].handmaidActive).toEqual(false);
      });
    });
  });

  describe('when one player has a handmaid', () => {
    describe('and one player doesn\'t have a handmaid but they are already knocked out', () => {
      it('has no effect', () => {
        game.activePlayerId = '1';
        const card = new Card({ id: 0, type: cards.PRINCE });
        game.players['1'].hand = [card];
        game.players['2'].handmaidActive = true;
        game.players['2'].hand = [
          new Card({ id: 2, type: cards.PRINCESS }),
        ];
        game.players['3'].handmaidActive = false;
        game.players['3'].isKnockedOut = true;

        const success = game.performCardEffect(card, { targetPlayerId: '2' });
        expect(success).toEqual(false);
        expect(game.players['2'].hand).toHaveLength(1);
        expect(game.players['2'].hand[0].type).toEqual(cards.PRINCESS);
        expect(game.players['1'].hand[0].type).toEqual(cards.PRINCE);
      });
    });
  });

  describe('when handmaid is in discard but didn\'t have its effect applied', () => {
    it('does not protect the player', () => {
      game.activePlayerId = '1';
      const { players } = game;
      players['1'].discardPile = new Card({ id: 100, type: cards.HANDMAID });
      players['1'].hand = [new Card({ id: 101, type: cards.PRINCESS })];
      players['1'].handmaidActive = false;
      const priestCard = new Card({ id: 102, type: cards.PRINCE });
      players['2'].hand[0] = new Card(priestCard);
      const success = game.performCardEffect(priestCard, { targetPlayerId: '2' });
      expect(success).toEqual(true);
      expect(players['2'].hand[0].id).not.toEqual(101);
    });
  });

  describe('guard', () => {
    describe('when the guess is correct', () => {
      it('knocks out the player', () => {
        game.activePlayerId = '1';
        game.players['3'].hand = [new Card({ id: 1, type: cards.BARON })];
        const guardCard = new Card({ id: 0, type: cards.GUARD });
        const effectData = { targetPlayerId: '3', guardNumberGuess: 3 };
        game.performCardEffect(guardCard, effectData);
        expect(game.players['3'].isKnockedOut).toEqual(true);
      });
    });

    describe('when the guess is correct', () => {
      it('doesn\'t knock out the player', () => {
        game.activePlayerId = '1';
        game.players['3'].hand = [new Card({ id: 1, type: cards.BARON })];
        const guardCard = new Card({ id: 0, type: cards.GUARD });
        const effectData = { targetPlayerId: '3', guardNumberGuess: 8 };
        game.performCardEffect(guardCard, effectData);
        expect(game.players['3'].isKnockedOut).toEqual(false);
      });
    });
  });

  describe('baron', () => {
    it('knocks out the player with the lower card', () => {
      const baronCard = new Card({ id: 1, type: cards.BARON });
      game.players['1'].hand = [
        new Card({ id: 0, type: cards.PRINCESS }),
        baronCard,
      ];
      game.players['2'].hand = [
        new Card({ id: 2, type: cards.KING }),
      ];
      game.activePlayerId = '1';
      success = game.performCardEffect(baronCard, { targetPlayerId: '2' });
      expect(success).toEqual(true);
      expect(game.players['1'].isKnockedOut).toEqual(false);
      expect(game.players['2'].isKnockedOut).toEqual(true);
    });

    describe('when the cards are equal', () => {
      it('doesn\'t kill anyone', () => {
        const baronCard = new Card({ id: 100, type: cards.BARON });
        game.players['1'].hand = [
          new Card({ id: 0, type: cards.PRINCE }),
          baronCard,
        ];
        game.players['2'].hand = [
          new Card({ id: 2, type: cards.PRINCE }),
        ];
        game.activePlayerId = '1';
        success = game.performCardEffect(baronCard, { targetPlayerId: '2' });
        expect(success).toEqual(true);
        expect(game.players['1'].isKnockedOut).toEqual(false);
        expect(game.players['2'].isKnockedOut).toEqual(false);
      });
    });

    describe('when the baron is the first card in the hand', () => {
      it('knocks out the player with the lower card', () => {
        const baronCard = new Card({ id: 1, type: cards.BARON });
        game.players['1'].hand = [
          baronCard,
          new Card({ id: 0, type: cards.PRINCESS }),
        ];
        game.players['2'].hand = [
          new Card({ id: 2, type: cards.KING }),
        ];
        game.activePlayerId = '1';
        success = game.performCardEffect(baronCard, { targetPlayerId: '2' });
        expect(success).toEqual(true);
        expect(game.players['1'].isKnockedOut).toEqual(false);
        expect(game.players['2'].isKnockedOut).toEqual(true);
      });
    });
  });

  describe('handmaid', () => {
    it('sets handmaid status to active', () => {
      game.activePlayerId = '1';
      const handmaidCard = new Card({ id: 2, type: cards.HANDMAID });
      const player = game.players['1'];
      player.hand = [handmaidCard];
      expect(player.handmaidActive).toEqual(false);
      game.performCardEffect(handmaidCard);
      expect(player.handmaidActive).toEqual(true);
    });

    describe('when the only other remaining player has played a handmaid', () => {
      it('sets handmaid status to active', () => {
        game.activePlayerId = '1';
        game.players['2'].discardPile.push(new Card({ id: 100, type: cards.HANDMAID }));
        game.players['2'].handmaidActive = true;
        game.players['3'].isKnockedOut = true;
        const handmaidCard = new Card({ id: 101, type: cards.HANDMAID });
        const activePlayer = game.players['1'];
        activePlayer.hand = [handmaidCard];
        expect(activePlayer.handmaidActive).toEqual(false);
        const success = game.performCardEffect(handmaidCard);
        expect(success).toEqual(true);
        expect(activePlayer.handmaidActive).toEqual(true);
      });
    });
  });

  describe('prince', () => {
    let targetedCard;
    let targetedCardType;

    subject = () => {
      targetedCard = new Card({ id: 100, type: targetedCardType });
      game.activePlayerId = '1';
      game.players['3'].hand = [targetedCard];
      game.performCardEffect(
        new Card({ id: 101, type: cards.PRINCE }),
        { targetPlayerId: '3' },
      );
    };

    describe('for a non-Princess card', () => {
      beforeEach(() => {
        targetedCardType = cards.BARON;
      });

      it('moves the hand card to the discard pile', () => {
        subject();
        const targetedPlayer = game.players['3'];
        expect(targetedPlayer.discardPile).toContain(targetedCard);
        expect(targetedPlayer.hand).toHaveLength(1);
        expect(targetedPlayer.hand).not.toContain(targetedCard);
      });

      it('doesn\'t knock the player out of the game', () => {
        subject();
        const targetedPlayer = game.players['3'];
        expect(targetedPlayer.isKnockedOut).toEqual(false);
      });
    });

    describe('when all other alive players have a Handmaid', () => {
      describe('and targeting self', () => {
        it('discards own card', () => {
          const activePlayer = game.players['1'];
          game.activePlayerId = '1';
          const card = new Card({ id: 100, type: cards.PRINCE });
          activePlayer.hand = [
            card,
            new Card({ id: 101, type: cards.GUARD }),
          ];
          game.players['2'].handmaidActive = true;
          game.players['3'].handmaidActive = true;
          const success = game.performCardEffect(card, { targetPlayerId: '1' });
          expect(success).toEqual(true);

          expect(activePlayer.discardPile.find(
            discardCard => discardCard.id === 101),
          ).toBeTruthy();

          expect(activePlayer.hand.find(
            handCard => handCard.id === 101
          )).toBeFalsy();
        });
      });
    });

    describe('when the hand card is the Princess', () => {
      beforeEach(() => {
        targetedCardType = cards.PRINCESS;
      });

      it('knocks the player out of the game', () => {
        subject();
        expect(game.players['3'].isKnockedOut).toEqual(true);
      });
    });

    describe('when there are no cards left in the deck', () => {
      beforeEach(() => {
        targetedCardType = cards.HANDMAID;
      });

      it('draws the burn card', () => {
        const { burnCard } = game;
        game.deckCursor = game.deck.length;
        subject();
        expect(game.players['3'].hand[0].id).toEqual(burnCard.id);
      });
    });
  });

  describe('king', () => {
    it('switches cards with the target player', () => {
      game.activePlayerId = '1';
      const baronCard = new Card({ id: 0, type: cards.BARON });
      const kingCard = new Card({ id: 1, type: cards.KING });
      const guardCard = new Card({ id: 2, type: cards.GUARD });

      game.players['1'].hand = [baronCard, kingCard];
      game.players['3'].hand = [guardCard];

      game.performCardEffect(kingCard, { targetPlayerId: 3 })
      expect(game.players['1'].hand[0].type).toEqual(cards.GUARD);
      expect(game.players['3'].hand[0].type).toEqual(cards.BARON);
    });

    describe('when king is the first card in hand', () => {
      it('switches cards with the target player', () => {
        game.activePlayerId = '1';
        const baronCard = new Card({ id: 0, type: cards.BARON });
        const kingCard = new Card({ id: 1, type: cards.KING });
        const guardCard = new Card({ id: 2, type: cards.GUARD });
        const activePlayer = game.players['1'];

        activePlayer.hand = [kingCard, baronCard];
        game.players['3'].hand = [guardCard];

        game.performCardEffect(kingCard, { targetPlayerId: 3 })
        // make sure we still have both the guard and the king
        expect(activePlayer.hand.find(card => card.type === cards.GUARD)).toBeTruthy();
        expect(activePlayer.hand.find(card => card.type === cards.KING)).toBeTruthy();
        expect(game.players['3'].hand[0].type).toEqual(cards.BARON);
      });
    });

    describe('when player has princess', () => {
      it('switches cards with the target player', () => {
        game.activePlayerId = '1';
        const princessCard = new Card({ id: 100, type: cards.PRINCESS });
        const kingCard = new Card({ id: 101, type: cards.KING });
        const guardCard = new Card({ id: 102, type: cards.GUARD });

        game.players['1'].hand = [princessCard, kingCard];
        game.players['3'].hand = [guardCard];

        game.performCardEffect(kingCard, { targetPlayerId: 3 })
        expect(game.players['1'].hand[0].type).toEqual(cards.GUARD);
        expect(game.players['3'].hand[0].type).toEqual(cards.PRINCESS);
      });
    });
  });

  describe('princess', () => {
    it('knocks out the player', () => {
      game.activePlayerId = '1';
      const princessCard = new Card({ id: 2, type: cards.PRINCESS });
      const player = game.players['1'];
      player.hand = [princessCard];
      expect(player.isKnockedOut).toEqual(false);
      game.performCardEffect(princessCard);
      expect(player.isKnockedOut).toEqual(true);
    });
  });
});
