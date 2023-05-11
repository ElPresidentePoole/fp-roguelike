import * as readline from 'node:readline';
import chalk from 'chalk';
import randomFloat from './random.js';
import process from 'node:process';

function merge(obj1, obj2) {
  // Given obj1 and obj2, return a copy of obj1 overriden by obj2's fields.
  // idk how to explain this too good
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
  return Object.assign({}, obj1, obj2);
}

function pythonicRange(upper) {
  return Array.from({length: upper}, (_, idx) => idx);
}

function replaceAtIndex(s, idx, r) {
  return s.substring(0, idx) + r + s.substring(idx + r.length);
}

function isCollision(state, pos) {
  return state.floor[pos.y][pos.x] !== '.';
}

function isGold(state, pos) {
  // Objects with the same fields and the same values aren't "equal" in JS, either with strict or loose equality (==/===)
  // To work around this, I convert our objects to a JSON string and check if those are equal.
  // console.log(`${JSON.stringify(pos)} === ${JSON.stringify(state.gold_pos)}`);
  return JSON.stringify(pos) === JSON.stringify(state.gold_pos);
}

function buildFloor(size_w, size_h) {
  function buildNorthRow() { return replaceAtIndex('#'.repeat(size_w), size_w/2, 'N'); }
  function buildSouthRow() { return replaceAtIndex('#'.repeat(size_w), size_w/2, 'S'); }
  function buildHalfwayRow() { return 'W' + '.'.repeat(size_w-2) + 'E'; }

  function buildRow(idx) {
    if (idx == 0) return buildNorthRow();
    else if (idx == size_h-1) return buildSouthRow();
    else return idx == size_h/2 ? buildHalfwayRow() : '#' + '.'.repeat(size_w-2) + '#';
  }
  return Array.from({length: size_h}, (_, idx) => buildRow(idx) );
}

function randomFreePosition(state) {
  // TODO: make an Array of all possible x and y values, minus the ones occupied by the player (or gobbos!)
  let final_rngi = state.rngi;
  const rf1 = randomFloat(final_rngi)
  final_rngi = rf1.rngi;
  const rf2 = randomFloat(final_rngi)
  final_rngi = rf2.rngi;
  const final_state = merge(state, { rngi: final_rngi });
  return { state: final_state, pos: { x: 1+Math.floor(rf1.value * (state.floor[0].length-2)), y: 1+Math.floor(rf2.value * (state.floor.length-2)) } };
}

function initialState() {
  return ({
    floor: buildFloor(18, 18),
    player_pos: { x: 9, y: 9 },
    // goblins_pos: [], // TODO: come back to these gobbos when we got gold!
    gold_pos: { x: 8, y: 8 },
    gold_collected: 0,
    rngi: 0, // rng index
  });
}

function handleAction(state, action) {
  let player_final_position = { x: state.player_pos.x, y: state.player_pos.y };
  switch (action) {
    case 'up':    player_final_position.y--; break;
    case 'left':    player_final_position.x--; break;
    case 'down':  player_final_position.y++; break;
    case 'right': player_final_position.x++; break;
  }
  if (isCollision(state, player_final_position)) {
    return state;
  } else {
    if (isGold(state, player_final_position)) {
      const { state: new_state, pos: free_pos } = randomFreePosition(state);
      return merge(state, { gold_collected: state.gold_collected+1, player_pos: player_final_position, gold_pos: free_pos, rngi: new_state.rngi } );
    } else {
      return merge(state, { player_pos: player_final_position });
    }
  }
}

// function goblinsRunTowardsPlayer(state) {
//   const goblins_new_pos = state.goblins_pos.map((pos) => {
//     if (state.player_pos.x < pos.x) return { x: pos.x-1, y: pos.y };
//     else if (state.player_pos.x > pos.x) return { x: pos.x+1, y: pos.y };
//     else if (state.player_pos.y < pos.y) return { x: pos.x, y: pos.y-1 };
//     else if (state.player_pos.y > pos.y) return { x: pos.x, y: pos.y+1 };
//   });

//   return merge(state, { goblins_pos: goblins_new_pos });
// }

function turn(state, player_input) {
  state = handleAction(state, player_input); // TODO: invalid moves shouldn't skip turns, maybe add a callback on_valid_move?
  // state = goblinsRunTowardsPlayer(state);
  show(state);
  return state;
}

function show(state) {
  // console.clear();
  state.floor.forEach((row, idx) => {
    let row_buffer = row + '';
    const goblins_on_this_row = state.goblins_pos.filter((pos) => pos.y == idx);
    goblins_on_this_row.forEach((pos) => { row_buffer = replaceAtIndex(row_buffer, pos.x, 'g'); });
    if (idx == state.gold_pos.y) row_buffer = replaceAtIndex(row_buffer, state.gold_pos.x, '$');
    if (idx == state.player_pos.y) row_buffer = replaceAtIndex(row_buffer, state.player_pos.x, '@');
    console.log(row_buffer);
  });
  console.log(chalk.green(`You are at ${state.player_pos.x}, ${state.player_pos.y}`));
  console.log(chalk.yellow(`Gold: ${state.gold_collected}`));
  console.log(chalk.red(`Gold is at: ${state.gold_pos.x}, ${state.gold_pos.y}`)); // why does this print fine but the others are [object Object]?
}

function main() {
  // Something here is blocking main from returning.
  // I mean, like, good, I want that.  But I'm not sure /what/ it is lol.
  let state = initialState();
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name == 'c') process.exit();
    switch (key.name.toUpperCase()) {
      case 'W': case 'K': case 'UP':    state = turn(state, 'up');  break;
      case 'A': case 'H': case 'LEFT':  state = turn(state, 'left');  break;
      case 'S': case 'J': case 'DOWN':  state = turn(state, 'down');  break;
      case 'D': case 'L': case 'RIGHT': state = turn(state, 'right'); break;
    }
  });
  show(state);
}

main();
