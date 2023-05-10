import * as readline from 'node:readline';
import process from 'node:process';

let State = initialState();

function merge(obj1, obj2) {
  // Given obj1 and obj2, return a copy of obj1 overriden by obj2's fields.
  // idk how to explain this too good
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
  return Object.assign({}, obj1, obj2);
}

function isCollision(pos) {
  return State.floor[pos.y][pos.x] !== '.';
}

function buildFloor(size_w, size_h) {
  return Array.from({length: size_h}, (_, idx) => (idx == 0 || idx == size_h-1) ? '#'.repeat(size_w) : '#' + '.'.repeat(size_w-2) + '#' );
}

function initialState() {
  return ({
    floor: buildFloor(18, 18),
    player_pos: { x: 1, y: 1 },
  });
}

function handleAction(action) {
  let player_final_position = { x: State.player_pos.x, y: State.player_pos.y };
  switch (action) {
    case 'up':    player_final_position.y--; break;
    case 'left':    player_final_position.x--; break;
    case 'down':  player_final_position.y++; break;
    case 'right': player_final_position.x++; break;
  }
  State.player_pos = isCollision(player_final_position) ? State.player_pos : merge(State.player_pos, player_final_position);

  show();
}

function show() {
  console.clear();
  State.floor.forEach((row, idx) => {
    if (idx == State.player_pos.y) {
      console.log(`${row.slice(0, State.player_pos.x)}@${row.slice(State.player_pos.x+1, row.length)}`);
    } else {
      console.log(row);
    }
  });
  console.log(State.player_pos);
}

function main() {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name == 'c') process.exit();
    switch (key.name.toUpperCase()) {
      case 'W': case 'K': case 'UP':    handleAction('up'); break
      case 'A': case 'H': case 'LEFT':  handleAction('left'); break
      case 'S': case 'J': case 'DOWN':  handleAction('down'); break
      case 'D': case 'L': case 'RIGHT': handleAction('right'); break
    }
  });
  show();
}

main();
