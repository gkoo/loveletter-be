const Card = require('./card');
const Player = require('./player');

let player;

beforeEach(() => {
  player = new Player({ id: '1' });
});

describe('discard', () => {
  beforeEach(() => {
    player.hand = [
      new Card({ id: 8, type: Card.GUARD }),
      new Card({ id: 9, type: Card.PRIEST }),
    ];
  });

  it('moves a card from hand to discardPile', () => {
    const cardToDiscardId = 9;
    player.discardCardById(cardToDiscardId);
    expect(player.hand).toHaveLength(1);
    expect(player.hand[0].id).toEqual(8);
    expect(player.discardPile).toHaveLength(1);
    expect(player.discardPile[0].id).toEqual(cardToDiscardId);
  });
});

describe('getFinalCardNumber', () => {
  const subject = () => player.getFinalCardNumber();

  beforeEach(() => {
    player.hand.push(new Card({ id: 100, type: cards.KING }));
  });

  describe('without Count in the discard', () => {
    it('returns the raw number', () => {
      expect(subject()).toEqual(6);
    });
  });

  describe('with a Count in the discard', () => {
    beforeEach(() => {
      player.discardPile.push(new Card({ id: 101, type: cards.COUNT }));
    });

    it('adds one to the raw number', () => {
      expect(subject()).toEqual(7);
    });
  });

  describe('with two Counts in the discard', () => {
    beforeEach(() => {
      player.discardPile.push(new Card({ id: 101, type: cards.COUNT }));
      player.discardPile.push(new Card({ id: 102, type: cards.COUNT }));
    });

    it('adds one to the raw number', () => {
      expect(subject()).toEqual(8);
    });
  });
});
