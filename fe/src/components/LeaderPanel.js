import React from 'react';
import { useSelector } from 'react-redux';

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

import * as selectors from '../store/selectors';

function LeaderPanel() {
  const currPlayer = useSelector(selectors.currPlayer);
  const socket = useSelector(selectors.socket);

  if (!currPlayer || !currPlayer.isLeader) {
    return <div/>;
  }

  const startGame = e => {
    e.preventDefault();
    socket.emit('startGame');
  };

  const endGame = e => {
    e.preventDefault();
    socket.emit('endGame');
  };

  return (
    <div>
      <ButtonGroup aria-label="Basic example">
        <Button onClick={startGame}>Start game</Button>
        <Button onClick={endGame}>End game</Button>
      </ButtonGroup>
    </div>
  );
};

export default LeaderPanel;