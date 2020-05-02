function Card({ id, type }) {
  this.id = id;
  this.type = type;
}

Card.prototype = {
  getLabel: function() {
    return Card.labels[this.type];
  },

  getNumber: function() {
    return Card.numbers[this.type];
  },
}

// Static properties

Card.GUARD = 0;
Card.PRIEST = 1;
Card.BARON = 2;
Card.HANDMAID = 3;
Card.PRINCE = 4;
Card.KING = 5;
Card.COUNTESS = 6;
Card.PRINCESS = 7;
Card.ASSASSIN = 7;
Card.JESTER = 7;
Card.CARDINAL = 7;
Card.BARONESS = 7;
Card.SYCOPHANT = 7;
Card.COUNT = 7;
Card.CONSTABLE = 7;
Card.DOWAGER_QUEEN = 7;
Card.BISHOP = 7;

Card.labels = {
  [Card.GUARD]: 'Guard',
  [Card.PRIEST]: 'Priest',
  [Card.BARON]: 'Baron',
  [Card.HANDMAID]: 'Handmaid',
  [Card.PRINCE]: 'Prince',
  [Card.KING]: 'King',
  [Card.COUNTESS]: 'Countess',
  [Card.PRINCESS]: 'Princess',
  [Card.ASSASSIN]: 'Assassin',
  [Card.JESTER]: 'Jester',
  [Card.CARDINAL]: 'Cardinal',
  [Card.BARONESS]: 'Baroness',
  [Card.SYCOPHANT]: 'Sycophant',
  [Card.COUNT]: 'Count',
  [Card.CONSTABLE]: 'Constable',
  [Card.DOWAGER_QUEEN]: 'Dowager Queen',
  [Card.BISHOP]: 'Bishop',
};

Card.numbers = {
  [Card.GUARD]: 1,
  [Card.PRIEST]: 2,
  [Card.BARON]: 3,
  [Card.HANDMAID]: 4,
  [Card.PRINCE]: 5,
  [Card.KING]: 6,
  [Card.COUNTESS]: 7,
  [Card.PRINCESS]: 8,
  [Card.ASSASSIN]: 0,
  [Card.JESTER]: 0,
  [Card.CARDINAL]: 2,
  [Card.BARONESS]: 3,
  [Card.SYCOPHANT]: 4,
  [Card.COUNT]: 5,
  [Card.CONSTABLE]: 6,
  [Card.DOWAGER_QUEEN]: 7,
  [Card.BISHOP]: 9,
};

module.exports = Card;
