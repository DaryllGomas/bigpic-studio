/** THE WEIGHING: dependency-free deterministic rules.
 * Port of weighing_kernel.py; all phases map to the named Python function.
 * Array return values replace Python tuples. State fields use camelCase.
 *
 * RNG contract: generation advances for every attempted tile; refill advances
 * once per empty cell in row-major order; each Fisher-Yates attempt consumes
 * 63 advances and starts from the original multiset. AI evaluates sorted action
 * IDs, consuming one roll per candidate. Random selection consumes one roll.
 * Previews never consume RNG or predict refill/cascades.
 *
 * All rule/evaluator arithmetic stays within Number's exact integer range.
 * Math.imul preserves low bits for the LCG and unsigned FNV-1a board hash.
 * Parameters are integers; measurement sample sizes must be positive.
 * Invalid actions preserve gameplay state but increment invalidActionCountI.
 */

export const boardW = 8;

export const boardH = 8;

export const boardCells = 64;

export const empty = (-1);

export const tileHeart = 0;

export const tileFeather = 1;

export const tileRa = 2;

export const tileNun = 3;

export const tileOsiris = 4;

export const tileSet = 5;

export const tileShu = 6;

export const tileCount = 7;

export const godFirstTile = tileRa;

export const godCount = 5;

export const burdenMax = 30;

export const heartPerTile = 2;

export const featherPerTile = 3;

export const chainDamageCap = 10;

export const chainReliefCap = 9;

export const vesselCap = 15;

export const cascadeWaveCap = 12;

export const actionCap = 48;

export const costRa = 8;

export const costNun = 9;

export const costOsiris = 8;

export const costSet = 5;

export const costShu = 10;

export const powerCosts = Object.freeze([costRa, costNun, costOsiris, costSet, costShu]);

export const liftRelief = 6;

export const soulKhat = 1;

export const soulSheut = 2;

export const soulRen = 3;

export const soulKa = 4;

export const soulBa = 5;

export const soulIb = 6;

export const soulAkh = 7;

export const soulPartNames = Object.freeze(["", "khat", "sheut", "ren", "ka", "ba", "ib", "akh"]);

export const fallbackBoard = Object.freeze([4, 0, 2, 1, 5, 4, 6, 0, 3, 0, 1, 3, 0, 1, 4, 3, 1, 4, 5, 0, 5, 4, 2, 0, 6, 2, 0, 0, 6, 4, 5, 5, 3, 6, 2, 4, 5, 3, 6, 4, 5, 0, 1, 2, 0, 1, 0, 2, 4, 2, 2, 0, 2, 6, 4, 4, 0, 5, 0, 2, 6, 4, 4, 5]);

export const actionNone = (-1);

export const actionSwapMin = 0;

export const actionSwapMax = 127;

export const actionFirstLightBase = 1000;

export const actionWaterBeneath = 1100;

export const actionGrainBase = 1200;

export const actionGrainLast = ((actionGrainBase + (boardCells * godCount)) - 1);

export const sunderingBlockSize = 4;

export const sunderingBlockPositions = 5;

export const actionSunderingBase = 1600;

export const actionSunderingLast = ((actionSunderingBase + (sunderingBlockPositions * sunderingBlockPositions)) - 1);

export const actionSundering = actionSunderingBase;

export const actionLift = 1700;

export const kindInvalid = (-1);

export const kindSwap = 0;

export const kindFirstLight = 1;

export const kindWaterBeneath = 2;

export const kindGrain = 3;

export const kindSundering = 4;

export const kindLift = 5;

export const finishNone = 0;

export const finishThreshold = 1;

export const finishActionCap = 2;

export const policyAi = 0;

export const policyNovice = 1;

export const policyCalibration = 2;

export const policyRandom = 3;

// Python: WeighingState
export class WeighingState {
  // Python: WeighingState.__init__
  constructor(seedI, firstActorI, soulPartsWonI) {
    this.board = Array.from({length: boardCells}, () => empty);
    this.clearMask = Array.from({length: boardCells}, () => 0);
    this.scratch = Array.from({length: boardCells}, () => empty);
    this.seedI = (seedI & 65535);
    this.burden = [0, 0];
    this.vessels = [Array.from({length: godCount}, () => 0), Array.from({length: godCount}, () => 0)];
    this.liftUsed = [0, 0];
    this.actionCountI = 0;
    this.actorI = ((firstActorI !== 0) ? 1 : 0);
    this.firstActorI = this.actorI;
    this.bonusUsedI = 0;
    this.chainActionCountI = 0;
    this.chainDamageI = 0;
    this.chainReliefI = 0;
    this.cumulativeHeartDamage = [0, 0];
    this.cumulativeGodTiles = [0, 0];
    this.winnerI = (-1);
    this.finishReasonI = finishNone;
    this.adjudicatedI = 0;
    if ((soulPartsWonI < 0)) {
      soulPartsWonI = 0;
    }
    if ((soulPartsWonI > soulAkh)) {
      soulPartsWonI = soulAkh;
    }
    this.soulPartsWon = soulPartsWonI;
    this.descentOpenI = ((this.soulPartsWon === soulAkh) ? 1 : 0);
    this.pendingHeartTilesI = 0;
    this.pendingFeatherTilesI = 0;
    this.pendingDirectReliefI = 0;
    this.pendingGodTiles = Array.from({length: godCount}, () => 0);
    this.primaryMaxRunI = 0;
    this.creditedWavesI = 0;
    this.cascadeWavesI = 0;
    this.cascadeOverflowI = 0;
    this.freeReshuffleCountI = 0;
    this.lastActionI = actionNone;
    this.lastActionKindI = kindInvalid;
    this.lastMoverI = (-1);
    this.lastHeartTilesI = 0;
    this.lastFeatherTilesI = 0;
    this.lastGodTilesI = 0;
    this.lastDamageI = 0;
    this.lastReliefI = 0;
    this.lastTotalClearI = 0;
    this.lastBonusAwardedI = 0;
    this.lastWasBonusI = 0;
    this.maxChainActionsI = 0;
    this.maxChainDamageI = 0;
    this.maxChainReliefI = 0;
    this.maxVesselI = 0;
    this.invalidActionCountI = 0;
    this.generationFallbackCountI = 0;
    this.actionHistory = [];
  }
}

// Python: rng_advance
export function rngAdvance(state) {
  state.seedI = ((Math.imul(25173, state.seedI) + 13849) & 65535);
  return state.seedI;
}

// Python: rng_roll_10000
export function rngRoll10000(state) {
  let seedI;
  seedI = rngAdvance(state);
  return Math.floor((seedI * 10000) / 65536);
}

// Python: rng_index
export function rngIndex(state, upperI) {
  let seedI;
  // Uniform integer in 0..upper_i-1 from one LCG advance.
  if ((upperI <= 1)) {
    rngAdvance(state);
    return 0;
  }
  seedI = rngAdvance(state);
  return Math.floor((seedI * upperI) / 65536);
}

// Python: draw_weighted_tile
export function drawWeightedTile(state) {
  let rollI;
  rollI = rngRoll10000(state);
  if ((rollI < 1800)) {
    return tileHeart;
  }
  if ((rollI < 2500)) {
    return tileFeather;
  }
  if ((rollI < 4000)) {
    return tileRa;
  }
  if ((rollI < 5500)) {
    return tileNun;
  }
  if ((rollI < 7000)) {
    return tileOsiris;
  }
  if ((rollI < 8500)) {
    return tileSet;
  }
  return tileShu;
}

// Python: board_hash
export function boardHash(board) {
  let hashI, tileI;
  // Stable FNV-1a 32-bit hash; never use Python's randomized hash().
  hashI = 2166136261;
  for (tileI of board) {
    hashI ^= (tileI + 2);
    hashI = Math.imul(hashI, 16777619) >>> 0;
  }
  return hashI;
}

// Python: action_id_to_swap
export function actionIdToSwap(actionI) {
  let cellI, directionI, xI, yI;
  if (((actionI < actionSwapMin) || (actionI > actionSwapMax))) {
    return [(-1), (-1)];
  }
  cellI = Math.floor(actionI / 2);
  directionI = (actionI & 1);
  xI = (cellI & 7);
  yI = (cellI >> 3);
  if ((directionI === 0)) {
    if ((xI >= 7)) {
      return [(-1), (-1)];
    }
    return [cellI, (cellI + 1)];
  }
  if ((yI >= 7)) {
    return [(-1), (-1)];
  }
  return [cellI, (cellI + 8)];
}

// Python: encode_swap
export function encodeSwap(cellI, directionI) {
  return ((cellI * 2) + directionI);
}

// Python: cell_has_match
export function cellHasMatch(board, cellI) {
  let runI, scanXI, scanYI, tileI, xI, yI;
  tileI = board[cellI];
  if ((tileI < 0)) {
    return 0;
  }
  xI = (cellI & 7);
  yI = (cellI >> 3);
  runI = 1;
  scanXI = (xI - 1);
  while (((scanXI >= 0) && (board[((yI * 8) + scanXI)] === tileI))) {
    runI += 1;
    scanXI -= 1;
  }
  scanXI = (xI + 1);
  while (((scanXI < 8) && (board[((yI * 8) + scanXI)] === tileI))) {
    runI += 1;
    scanXI += 1;
  }
  if ((runI >= 3)) {
    return 1;
  }
  runI = 1;
  scanYI = (yI - 1);
  while (((scanYI >= 0) && (board[((scanYI * 8) + xI)] === tileI))) {
    runI += 1;
    scanYI -= 1;
  }
  scanYI = (yI + 1);
  while (((scanYI < 8) && (board[((scanYI * 8) + xI)] === tileI))) {
    runI += 1;
    scanYI += 1;
  }
  return ((runI >= 3) ? 1 : 0);
}

// Python: scan_matches
export function scanMatches(board, clearMask) {
  let cellI, countI, markXI, markYI, maxRunI, runI, startI, tileI, xI, yI;
  // Mark the horizontal/vertical union; return unique count and max run.
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    clearMask[cellI] = 0;
  }
  maxRunI = 0;
  for (yI = 0; yI < 8; yI += 1) {
    xI = 0;
    while ((xI < 8)) {
      startI = xI;
      tileI = board[((yI * 8) + xI)];
      xI += 1;
      while (((xI < 8) && (tileI >= 0) && (board[((yI * 8) + xI)] === tileI))) {
        xI += 1;
      }
      runI = (xI - startI);
      if (((tileI >= 0) && (runI >= 3))) {
        if ((runI > maxRunI)) {
          maxRunI = runI;
        }
        markXI = startI;
        while ((markXI < xI)) {
          clearMask[((yI * 8) + markXI)] = 1;
          markXI += 1;
        }
      }
    }
  }
  for (xI = 0; xI < 8; xI += 1) {
    yI = 0;
    while ((yI < 8)) {
      startI = yI;
      tileI = board[((yI * 8) + xI)];
      yI += 1;
      while (((yI < 8) && (tileI >= 0) && (board[((yI * 8) + xI)] === tileI))) {
        yI += 1;
      }
      runI = (yI - startI);
      if (((tileI >= 0) && (runI >= 3))) {
        if ((runI > maxRunI)) {
          maxRunI = runI;
        }
        markYI = startI;
        while ((markYI < yI)) {
          clearMask[((markYI * 8) + xI)] = 1;
          markYI += 1;
        }
      }
    }
  }
  countI = 0;
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    countI += clearMask[cellI];
  }
  return [countI, maxRunI];
}

// Python: board_has_match
export function boardHasMatch(board) {
  let ignored, countI, scratchMask;
  scratchMask = Array.from({length: boardCells}, () => 0);
  [countI, ignored] = scanMatches(board, scratchMask);
  return ((countI > 0) ? 1 : 0);
}

// Python: is_legal_swap
export function isLegalSwap(board, actionI) {
  let cellAI, cellBI, legalI;
  [cellAI, cellBI] = actionIdToSwap(actionI);
  if ((cellAI < 0)) {
    return 0;
  }
  if ((board[cellAI] === board[cellBI])) {
    return 0;
  }
  [board[cellAI], board[cellBI]] = [board[cellBI], board[cellAI]];
  legalI = ((cellHasMatch(board, cellAI) || cellHasMatch(board, cellBI)) ? 1 : 0);
  [board[cellAI], board[cellBI]] = [board[cellBI], board[cellAI]];
  return legalI;
}

// Python: enumerate_legal_swaps
export function enumerateLegalSwaps(board) {
  let actionI, actions, cellI, xI, yI;
  actions = [];
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    xI = (cellI & 7);
    yI = (cellI >> 3);
    if ((xI < 7)) {
      actionI = encodeSwap(cellI, 0);
      if ((isLegalSwap(board, actionI) !== 0)) {
        actions.push(actionI);
      }
    }
    if ((yI < 7)) {
      actionI = encodeSwap(cellI, 1);
      if ((isLegalSwap(board, actionI) !== 0)) {
        actions.push(actionI);
      }
    }
  }
  return actions;
}

// Python: candidate_breaks_initial_triple
export function candidateBreaksInitialTriple(board, cellI, tileI) {
  let xI, yI;
  xI = (cellI & 7);
  yI = (cellI >> 3);
  if ((xI >= 2)) {
    if (((board[(cellI - 1)] === tileI) && (board[(cellI - 2)] === tileI))) {
      return 1;
    }
  }
  if ((yI >= 2)) {
    if (((board[(cellI - 8)] === tileI) && (board[(cellI - 16)] === tileI))) {
      return 1;
    }
  }
  return 0;
}

// Python: generate_stable_playable_board
export function generateStablePlayableBoard(state) {
  let acceptedI, attemptI, cellI, tileI, tryI;
  // 32 bounded whole-board attempts, then the verified fixed fallback.
  attemptI = 0;
  while ((attemptI < 32)) {
    for (cellI = 0; cellI < boardCells; cellI += 1) {
      state.board[cellI] = empty;
    }
    for (cellI = 0; cellI < boardCells; cellI += 1) {
      acceptedI = 0;
      tryI = 0;
      while (((tryI < 16) && (acceptedI === 0))) {
        tileI = drawWeightedTile(state);
        if ((candidateBreaksInitialTriple(state.board, cellI, tileI) === 0)) {
          state.board[cellI] = tileI;
          acceptedI = 1;
        }
        tryI += 1;
      }
      if ((acceptedI === 0)) {
        tileI = 0;
        while (((tileI < tileCount) && (acceptedI === 0))) {
          if ((candidateBreaksInitialTriple(state.board, cellI, tileI) === 0)) {
            state.board[cellI] = tileI;
            acceptedI = 1;
          }
          tileI += 1;
        }
      }
    }
    if ((boardHasMatch(state.board) === 0)) {
      if ((enumerateLegalSwaps(state.board).length > 0)) {
        return;
      }
    }
    attemptI += 1;
  }
  state.board.splice(0, state.board.length, ...fallbackBoard);
  state.generationFallbackCountI += 1;
}

// Python: new_game
export function newGame(seedI, firstActorI = 0, soulPartsWonI = 0) {
  let state;
  state = new WeighingState(seedI, firstActorI, soulPartsWonI);
  generateStablePlayableBoard(state);
  return state;
}

// Python: fisher_yates_once
export function fisherYatesOnce(state, values) {
  let indexI, otherI, shuffled;
  shuffled = values.slice(0);
  indexI = (boardCells - 1);
  while ((indexI > 0)) {
    otherI = rngIndex(state, (indexI + 1));
    [shuffled[indexI], shuffled[otherI]] = [shuffled[otherI], shuffled[indexI]];
    indexI -= 1;
  }
  return shuffled;
}

// Python: reshuffle_board
export function reshuffleBoard(state) {
  let attemptI, original, shuffled;
  original = state.board.slice(0);
  attemptI = 0;
  while ((attemptI < 64)) {
    shuffled = fisherYatesOnce(state, original);
    if ((boardHasMatch(shuffled) === 0)) {
      if ((enumerateLegalSwaps(shuffled).length > 0)) {
        state.board.splice(0, state.board.length, ...shuffled);
        return;
      }
    }
    attemptI += 1;
  }
  generateStablePlayableBoard(state);
}

// Python: gravity_phase
export function gravityPhase(state) {
  let cellI, readYI, tileI, writeYI, xI;
  for (xI = 0; xI < 8; xI += 1) {
    writeYI = 7;
    readYI = 7;
    while ((readYI >= 0)) {
      cellI = ((readYI * 8) + xI);
      tileI = state.board[cellI];
      if ((tileI !== empty)) {
        state.board[((writeYI * 8) + xI)] = tileI;
        writeYI -= 1;
      }
      readYI -= 1;
    }
    while ((writeYI >= 0)) {
      state.board[((writeYI * 8) + xI)] = empty;
      writeYI -= 1;
    }
  }
}

// Python: refill_phase
export function refillPhase(state) {
  let cellI, xI, yI;
  // Row-major empty-cell refill: top-to-bottom, then left-to-right.
  for (yI = 0; yI < 8; yI += 1) {
    for (xI = 0; xI < 8; xI += 1) {
      cellI = ((yI * 8) + xI);
      if ((state.board[cellI] === empty)) {
        state.board[cellI] = drawWeightedTile(state);
      }
    }
  }
}

// Python: action_kind
export function actionKind(actionI) {
  if ((actionSwapMin <= actionI && actionI <= actionSwapMax)) {
    return kindSwap;
  }
  if ((actionFirstLightBase <= actionI && actionI < (actionFirstLightBase + 8))) {
    return kindFirstLight;
  }
  if ((actionI === actionWaterBeneath)) {
    return kindWaterBeneath;
  }
  if ((actionGrainBase <= actionI && actionI <= actionGrainLast)) {
    return kindGrain;
  }
  if ((actionSunderingBase <= actionI && actionI <= actionSunderingLast)) {
    return kindSundering;
  }
  if ((actionI === actionLift)) {
    return kindLift;
  }
  return kindInvalid;
}

// Python: action_power_god_index
export function actionPowerGodIndex(kindI) {
  if ((kindI === kindFirstLight)) {
    return 0;
  }
  if ((kindI === kindWaterBeneath)) {
    return 1;
  }
  if ((kindI === kindGrain)) {
    return 2;
  }
  if ((kindI === kindSundering)) {
    return 3;
  }
  if ((kindI === kindLift)) {
    return 4;
  }
  return (-1);
}

// Python: decode_grain
export function decodeGrain(actionI) {
  let cellI, offsetI, tileI;
  offsetI = (actionI - actionGrainBase);
  if (((offsetI < 0) || (offsetI >= (boardCells * godCount)))) {
    return [(-1), (-1)];
  }
  cellI = Math.floor(offsetI / godCount);
  tileI = (godFirstTile + (offsetI % godCount));
  return [cellI, tileI];
}

// Python: encode_grain
export function encodeGrain(cellI, godTileI) {
  return ((actionGrainBase + (cellI * godCount)) + (godTileI - godFirstTile));
}

// Python: decode_sundering
export function decodeSundering(actionI) {
  let offsetI, topXI, topYI;
  offsetI = (actionI - actionSunderingBase);
  if (((offsetI < 0) || (offsetI >= (sunderingBlockPositions * sunderingBlockPositions)))) {
    return [(-1), (-1)];
  }
  topXI = (offsetI % sunderingBlockPositions);
  topYI = Math.floor(offsetI / sunderingBlockPositions);
  return [topXI, topYI];
}

// Python: encode_sundering
export function encodeSundering(topXI, topYI) {
  if (((topXI < 0) || (topXI >= sunderingBlockPositions))) {
    return actionNone;
  }
  if (((topYI < 0) || (topYI >= sunderingBlockPositions))) {
    return actionNone;
  }
  return ((actionSunderingBase + (topYI * sunderingBlockPositions)) + topXI);
}

// Python: validate_action
export function validateAction(state, actionI) {
  let actorI, cellI, godI, kindI, tileI, topXI, topYI;
  if (((state.winnerI >= 0) || (state.actionCountI >= actionCap))) {
    return 0;
  }
  kindI = actionKind(actionI);
  if ((kindI === kindInvalid)) {
    return 0;
  }
  if ((kindI === kindSwap)) {
    return isLegalSwap(state.board, actionI);
  }
  godI = actionPowerGodIndex(kindI);
  actorI = state.actorI;
  if ((state.vessels[actorI][godI] < powerCosts[godI])) {
    return 0;
  }
  if ((kindI === kindGrain)) {
    [cellI, tileI] = decodeGrain(actionI);
    if (((cellI < 0) || (state.board[cellI] === tileI))) {
      return 0;
    }
  }
  if ((kindI === kindSundering)) {
    [topXI, topYI] = decodeSundering(actionI);
    if (((topXI < 0) || (topYI < 0))) {
      return 0;
    }
  }
  if (((kindI === kindLift) && (state.liftUsed[actorI] !== 0))) {
    return 0;
  }
  return 1;
}

// Python: reset_action_work
export function resetActionWork(state, actionI, kindI) {
  let godI;
  state.pendingHeartTilesI = 0;
  state.pendingFeatherTilesI = 0;
  state.pendingDirectReliefI = 0;
  for (godI = 0; godI < godCount; godI += 1) {
    state.pendingGodTiles[godI] = 0;
  }
  state.primaryMaxRunI = 0;
  state.creditedWavesI = 0;
  state.cascadeWavesI = 0;
  state.lastActionI = actionI;
  state.lastActionKindI = kindI;
  state.lastMoverI = state.actorI;
  state.lastHeartTilesI = 0;
  state.lastFeatherTilesI = 0;
  state.lastGodTilesI = 0;
  state.lastDamageI = 0;
  state.lastReliefI = 0;
  state.lastTotalClearI = 0;
  state.lastBonusAwardedI = 0;
  state.lastWasBonusI = ((state.bonusUsedI !== 0) ? 1 : 0);
}

// Python: commit_action_phase
export function commitActionPhase(state, actionI, kindI) {
  let godI;
  resetActionWork(state, actionI, kindI);
  state.actionCountI += 1;
  state.chainActionCountI += 1;
  if ((state.chainActionCountI > state.maxChainActionsI)) {
    state.maxChainActionsI = state.chainActionCountI;
  }
  state.actionHistory.push(actionI);
  godI = actionPowerGodIndex(kindI);
  if ((godI >= 0)) {
    state.vessels[state.actorI][godI] -= powerCosts[godI];
  }
  if ((kindI === kindLift)) {
    state.liftUsed[state.actorI] = 1;
  }
}

// Python: dispatch_action_phase
export function dispatchActionPhase(state, actionI, kindI) {
  let ignored, blockXI, blockYI, cellAI, cellBI, cellI, countI, maxRunI, rowI, tileI, topXI, topYI, xI;
  // Mutate/mark the primary wave.  Return its unique marked count.
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    state.clearMask[cellI] = 0;
  }
  if ((kindI === kindSwap)) {
    [cellAI, cellBI] = actionIdToSwap(actionI);
    [state.board[cellAI], state.board[cellBI]] = [state.board[cellBI], state.board[cellAI]];
    [countI, maxRunI] = scanMatches(state.board, state.clearMask);
    state.primaryMaxRunI = maxRunI;
    return countI;
  }
  if ((kindI === kindFirstLight)) {
    rowI = (actionI - actionFirstLightBase);
    for (xI = 0; xI < 8; xI += 1) {
      state.clearMask[((rowI * 8) + xI)] = 1;
    }
    return 8;
  }
  if ((kindI === kindWaterBeneath)) {
    for (cellI = 0; cellI < boardCells; cellI += 1) {
      if ((state.board[cellI] === tileNun)) {
        state.board[cellI] = tileFeather;
      }
    }
    [countI, ignored] = scanMatches(state.board, state.clearMask);
    return countI;
  }
  if ((kindI === kindGrain)) {
    [cellI, tileI] = decodeGrain(actionI);
    state.board[cellI] = tileI;
    [countI, ignored] = scanMatches(state.board, state.clearMask);
    return countI;
  }
  if ((kindI === kindSundering)) {
    [topXI, topYI] = decodeSundering(actionI);
    for (blockYI = 0; blockYI < sunderingBlockSize; blockYI += 1) {
      for (blockXI = 0; blockXI < sunderingBlockSize; blockXI += 1) {
        cellI = ((((topYI + blockYI) * 8) + topXI) + blockXI);
        state.clearMask[cellI] = 1;
      }
    }
    return (sunderingBlockSize * sunderingBlockSize);
  }
  if ((kindI === kindLift)) {
    state.pendingDirectReliefI = liftRelief;
    return 0;
  }
  return 0;
}

// Python: credit_wave_phase
export function creditWavePhase(state) {
  let actorI, cellI, godI, nextI, tileI;
  actorI = state.actorI;
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    if ((state.clearMask[cellI] === 0)) {
      continue;
    }
    tileI = state.board[cellI];
    if ((tileI === tileHeart)) {
      state.pendingHeartTilesI += 1;
    } else {
      if ((tileI === tileFeather)) {
        state.pendingFeatherTilesI += 1;
      } else {
        if ((godFirstTile <= tileI && tileI < tileCount)) {
          godI = (tileI - godFirstTile);
          state.pendingGodTiles[godI] += 1;
          state.cumulativeGodTiles[actorI] += 1;
          nextI = (state.vessels[actorI][godI] + 1);
          if ((nextI > vesselCap)) {
            nextI = vesselCap;
          }
          state.vessels[actorI][godI] = nextI;
          if ((nextI > state.maxVesselI)) {
            state.maxVesselI = nextI;
          }
        }
      }
    }
  }
}

// Python: clear_wave_phase
export function clearWavePhase(state) {
  let cellI, countI;
  countI = 0;
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    if ((state.clearMask[cellI] !== 0)) {
      state.board[cellI] = empty;
      countI += 1;
    }
  }
  return countI;
}

// Python: resolve_waves_phase
export function resolveWavesPhase(state, primaryCountI) {
  let ignored, markedCountI, waveCountI;
  if ((primaryCountI <= 0)) {
    return;
  }
  waveCountI = 0;
  markedCountI = primaryCountI;
  while (((markedCountI > 0) && (waveCountI < cascadeWaveCap))) {
    waveCountI += 1;
    observeResolution(state, "wave");
    creditWavePhase(state);
    observeResolution(state, "credit");
    state.lastTotalClearI += clearWavePhase(state);
    observeResolution(state, "cleared");
    gravityPhase(state);
    observeResolution(state, "fallen");
    refillPhase(state);
    observeResolution(state, "refilled");
    [markedCountI, ignored] = scanMatches(state.board, state.clearMask);
  }
  state.creditedWavesI = waveCountI;
  state.cascadeWavesI = (waveCountI - 1);
  if ((state.cascadeWavesI < 0)) {
    state.cascadeWavesI = 0;
  }
  if ((markedCountI > 0)) {
    state.cascadeOverflowI = 1;
    generateStablePlayableBoard(state);
  }
}

// Python: apply_burden_phase
export function applyBurdenPhase(state) {
  let actorI, burdenRoomI, damageI, damageRoomI, opponentI, rawDamageI, rawReliefI, reliefI, reliefRoomI;
  actorI = state.actorI;
  opponentI = (1 - actorI);
  rawDamageI = (state.pendingHeartTilesI * heartPerTile);
  damageRoomI = (chainDamageCap - state.chainDamageI);
  damageI = rawDamageI;
  if ((damageI > damageRoomI)) {
    damageI = damageRoomI;
  }
  burdenRoomI = (burdenMax - state.burden[opponentI]);
  if ((damageI > burdenRoomI)) {
    damageI = burdenRoomI;
  }
  if ((damageI < 0)) {
    damageI = 0;
  }
  rawReliefI = ((state.pendingFeatherTilesI * featherPerTile) + state.pendingDirectReliefI);
  reliefRoomI = (chainReliefCap - state.chainReliefI);
  reliefI = rawReliefI;
  if ((reliefI > reliefRoomI)) {
    reliefI = reliefRoomI;
  }
  if ((reliefI > state.burden[actorI])) {
    reliefI = state.burden[actorI];
  }
  if ((reliefI < 0)) {
    reliefI = 0;
  }
  state.burden[opponentI] += damageI;
  state.burden[actorI] -= reliefI;
  state.chainDamageI += damageI;
  state.chainReliefI += reliefI;
  state.cumulativeHeartDamage[actorI] += damageI;
  state.lastHeartTilesI = state.pendingHeartTilesI;
  state.lastFeatherTilesI = state.pendingFeatherTilesI;
  state.lastGodTilesI = state.pendingGodTiles.reduce((total, value) => total + value, 0);
  state.lastDamageI = damageI;
  state.lastReliefI = reliefI;
  if ((state.chainDamageI > state.maxChainDamageI)) {
    state.maxChainDamageI = state.chainDamageI;
  }
  if ((state.chainReliefI > state.maxChainReliefI)) {
    state.maxChainReliefI = state.chainReliefI;
  }
}

// Python: finish_duel
export function finishDuel(state, winnerI, reasonI) {
  if ((state.winnerI >= 0)) {
    return;
  }
  state.winnerI = winnerI;
  state.finishReasonI = reasonI;
  if ((reasonI === finishActionCap)) {
    state.adjudicatedI = 1;
  }
  if ((winnerI === 0)) {
    if ((state.soulPartsWon < soulAkh)) {
      state.soulPartsWon += 1;
    }
    if ((state.soulPartsWon === soulAkh)) {
      state.descentOpenI = 1;
    }
  }
}

// Python: adjudicate_action_cap
export function adjudicateActionCap(state) {
  if ((state.burden[0] > state.burden[1])) {
    finishDuel(state, 1, finishActionCap);
    return;
  }
  if ((state.burden[1] > state.burden[0])) {
    finishDuel(state, 0, finishActionCap);
    return;
  }
  if ((state.cumulativeHeartDamage[0] < state.cumulativeHeartDamage[1])) {
    finishDuel(state, 1, finishActionCap);
    return;
  }
  if ((state.cumulativeHeartDamage[1] < state.cumulativeHeartDamage[0])) {
    finishDuel(state, 0, finishActionCap);
    return;
  }
  if ((state.cumulativeGodTiles[0] < state.cumulativeGodTiles[1])) {
    finishDuel(state, 1, finishActionCap);
    return;
  }
  if ((state.cumulativeGodTiles[1] < state.cumulativeGodTiles[0])) {
    finishDuel(state, 0, finishActionCap);
    return;
  }
  finishDuel(state, (1 - state.firstActorI), finishActionCap);
}

// Python: handoff_phase
export function handoffPhase(state) {
  state.actorI = (1 - state.actorI);
  state.bonusUsedI = 0;
  state.chainActionCountI = 0;
  state.chainDamageI = 0;
  state.chainReliefI = 0;
}

// Python: ensure_playable_phase
export function ensurePlayablePhase(state) {
  if ((enumerateLegalSwaps(state.board).length === 0)) {
    reshuffleBoard(state);
    state.freeReshuffleCountI += 1;
  }
}

// Python: close_action_phase
export function closeActionPhase(state, kindI) {
  let eligibleI, opponentI;
  opponentI = (1 - state.actorI);
  if ((state.burden[opponentI] >= burdenMax)) {
    finishDuel(state, state.actorI, finishThreshold);
    return;
  }
  if ((state.actionCountI >= actionCap)) {
    adjudicateActionCap(state);
    return;
  }
  ensurePlayablePhase(state);
  eligibleI = 0;
  if (((kindI === kindSwap) && (state.primaryMaxRunI >= 4))) {
    if ((state.bonusUsedI === 0)) {
      eligibleI = 1;
    }
  }
  if ((eligibleI !== 0)) {
    state.bonusUsedI = 1;
    state.lastBonusAwardedI = 1;
    return;
  }
  handoffPhase(state);
}

// Optional read-only presentation observer. No game state, ordering or RNG changes.
const resolutionObservers = new WeakMap();
function observeResolution(state, phase) {
  resolutionObservers.get(state)?.(phase, state);
}
export function applyAction(state, actionI, observer) {
  if (observer) resolutionObservers.set(state, observer);
  try { return applyActionCore(state, actionI); }
  finally { resolutionObservers.delete(state); }
}

// Python: apply_action
function applyActionCore(state, actionI) {
  let kindI, preCountI, preHashI, preSeedI, primaryCountI;
  // Apply one successful action.  Invalid actions mutate nothing and cost 0.
  preHashI = boardHash(state.board);
  preSeedI = state.seedI;
  preCountI = state.actionCountI;
  if ((validateAction(state, actionI) === 0)) {
    state.invalidActionCountI += 1;
    if ((boardHash(state.board) !== preHashI)) {
      throw new Error("invalid action changed board");
    }
    if (((state.seedI !== preSeedI) || (state.actionCountI !== preCountI))) {
      throw new Error("invalid action consumed RNG or action count");
    }
    return 0;
  }
  kindI = actionKind(actionI);
  commitActionPhase(state, actionI, kindI);
  observeResolution(state, "committed");
  primaryCountI = dispatchActionPhase(state, actionI, kindI);
  observeResolution(state, "dispatched");
  resolveWavesPhase(state, primaryCountI);
  applyBurdenPhase(state);
  observeResolution(state, "burden");
  closeActionPhase(state, kindI);
  observeResolution(state, "closed");
  assertInvariants(state);
  return 1;
}

// Python: assert_invariants
export function assertInvariants(state) {
  let actorI, godI, vesselI;
  if ((!(0 <= state.burden[0] && state.burden[0] <= burdenMax))) {
    throw new Error("player burden outside 0..30");
  }
  if ((!(0 <= state.burden[1] && state.burden[1] <= burdenMax))) {
    throw new Error("opponent burden outside 0..30");
  }
  if ((state.chainDamageI > chainDamageCap)) {
    throw new Error("chain damage cap exceeded");
  }
  if ((state.chainReliefI > chainReliefCap)) {
    throw new Error("chain relief cap exceeded");
  }
  if ((state.maxChainActionsI > 2)) {
    throw new Error("bonus chain exceeded two actions");
  }
  if (((state.soulPartsWon < 0) || (state.soulPartsWon > soulAkh))) {
    throw new Error("SoulPartsWon outside 0..7");
  }
  for (actorI = 0; actorI < 2; actorI += 1) {
    for (godI = 0; godI < godCount; godI += 1) {
      vesselI = state.vessels[actorI][godI];
      if (((vesselI < 0) || (vesselI > vesselCap))) {
        throw new Error("vessel outside 0..15");
      }
    }
  }
  if ((state.winnerI < 0)) {
    if ((boardHasMatch(state.board) !== 0)) {
      throw new Error("resolver returned a board with a standing match");
    }
    if ((enumerateLegalSwaps(state.board).length === 0)) {
      throw new Error("resolver returned a board with no legal swap");
    }
  }
}

// Preview slots: action, clear, max run, Heart, Feather, five gods, direct relief.
export const pvAction = 0;

export const pvClear = 1;

export const pvMaxRun = 2;

export const pvHeart = 3;

export const pvFeather = 4;

export const pvGod0 = 5;

export const pvDirectRelief = 10;

export const pvCount = 11;

// Feature slots: damage, relief, five gods, bonus, 5+, readiness, clear, storm, lethal, noise.
// Features use integer scale 10000; weights are scaled by 100.
export const ftD = 0;

export const ftH = 1;

export const ftG0 = 2;

export const ftX = 7;

export const ftF = 8;

export const ftR = 9;

export const ftC = 10;

export const ftS = 11;

export const ftK = 12;

export const ftN = 13;

export const ftCount = 14;

export const featureScale = 10000;

// Published starting vectors, retained for audit; not the active ladder.
export const publishedAiWeights = Object.freeze([
  [80, 30, 25, 15, 15, 25, 20, 35, 10, 20, 70, 20, 200, 250],
  [90, 50, 110, 80, 90, 70, 100, 60, 20, 120, 80, 40, 1000, 110],
  [320, 35, 45, 25, 70, 20, 25, 130, 20, 70, 15, 10, 10000, 65],
  [110, 340, 40, 150, 35, 30, 50, 100, 25, 150, 25, 40, 10000, 45],
  [150, 110, 80, 70, 60, 140, 130, 160, 35, 240, 35, 150, 20000, 25],
  [220, 150, 80, 80, 80, 70, 80, 450, 80, 180, 55, 50, 50000, 12],
  [380, 300, 115, 105, 125, 65, 100, 320, 40, 300, 20, 80, 100000, 2],
].map(row => Object.freeze(row)));

// Pre-SUNDERING validated vectors, retained for audit.
export const preSunderingAiWeights = Object.freeze([
  publishedAiWeights[0],
  [150, 100, 110, 80, 90, 70, 100, 80, 20, 100, 60, 30, 3000, 90],
  [320, 35, 45, 25, 70, 20, 25, 130, 20, 70, 15, 10, 10000, 150],
  publishedAiWeights[3],
  [250, 200, 80, 70, 60, 120, 110, 180, 35, 160, 35, 100, 30000, 25],
  publishedAiWeights[5],
  [500, 400, 115, 105, 125, 65, 100, 380, 40, 180, 20, 60, 100000, 2],
].map(row => Object.freeze(row)));

// Canonical post-SUNDERING seven-opponent ladder. D, H, five G, X,F,R,C,S,K,N.
export const aiWeights = Object.freeze([
  [80, 30, 25, 15, 15, 25, 20, 35, 10, 20, 70, 20, 200, 320],
  [150, 100, 110, 80, 90, 70, 100, 80, 20, 100, 60, 30, 3000, 120],
  preSunderingAiWeights[2],
  preSunderingAiWeights[3],
  [250, 200, 80, 70, 60, 120, 110, 180, 35, 160, 35, 100, 30000, 80],
  preSunderingAiWeights[5],
  [500, 400, 115, 105, 125, 100, 100, 380, 40, 180, 50, 100, 100000, 2],
].map(row => Object.freeze(row)));

// Canonical novice consumes one seeded noise roll per sorted candidate.
export const noviceWeights = Object.freeze([250, 210, 35, 35, 35, 35, 35, 105, 15, 70, 25, 15, 30000, 400]);

// Fixed calibration vector excludes powers and consumes no choice RNG.
export const calibrationWeights = Object.freeze([210, 180, 20, 20, 20, 20, 20, 100, 20, 45, 30, 0, 30000, 0]);

export const stormLowUtility = 8000;

// Python: preview_action
export function previewAction(state, actionI) {
  let ignored, blockXI, blockYI, board, cellAI, cellBI, cellI, clearCountI, clearMask, kindI, maxRunI, preview, rowI, tileI, topXI, topYI, xI;
  // Direct deterministic preview; never gravity/refill/cascade or RNG.
  preview = Array.from({length: pvCount}, () => 0);
  preview[pvAction] = actionI;
  kindI = actionKind(actionI);
  board = state.board.slice(0);
  clearMask = Array.from({length: boardCells}, () => 0);
  clearCountI = 0;
  maxRunI = 0;
  if ((kindI === kindSwap)) {
    [cellAI, cellBI] = actionIdToSwap(actionI);
    [board[cellAI], board[cellBI]] = [board[cellBI], board[cellAI]];
    [clearCountI, maxRunI] = scanMatches(board, clearMask);
  } else {
    if ((kindI === kindFirstLight)) {
      rowI = (actionI - actionFirstLightBase);
      for (xI = 0; xI < 8; xI += 1) {
        clearMask[((rowI * 8) + xI)] = 1;
      }
      clearCountI = 8;
    } else {
      if ((kindI === kindWaterBeneath)) {
        for (cellI = 0; cellI < boardCells; cellI += 1) {
          if ((board[cellI] === tileNun)) {
            board[cellI] = tileFeather;
          }
        }
        [clearCountI, ignored] = scanMatches(board, clearMask);
      } else {
        if ((kindI === kindGrain)) {
          [cellI, tileI] = decodeGrain(actionI);
          board[cellI] = tileI;
          [clearCountI, ignored] = scanMatches(board, clearMask);
        } else {
          if ((kindI === kindSundering)) {
            [topXI, topYI] = decodeSundering(actionI);
            for (blockYI = 0; blockYI < sunderingBlockSize; blockYI += 1) {
              for (blockXI = 0; blockXI < sunderingBlockSize; blockXI += 1) {
                cellI = ((((topYI + blockYI) * 8) + topXI) + blockXI);
                clearMask[cellI] = 1;
              }
            }
            clearCountI = (sunderingBlockSize * sunderingBlockSize);
          } else {
            if ((kindI === kindLift)) {
              preview[pvDirectRelief] = liftRelief;
            }
          }
        }
      }
    }
  }
  preview[pvClear] = clearCountI;
  preview[pvMaxRun] = maxRunI;
  if ((clearCountI > 0)) {
    for (cellI = 0; cellI < boardCells; cellI += 1) {
      if ((clearMask[cellI] === 0)) {
        continue;
      }
      tileI = board[cellI];
      if ((tileI === tileHeart)) {
        preview[pvHeart] += 1;
      } else {
        if ((tileI === tileFeather)) {
          preview[pvFeather] += 1;
        } else {
          if ((godFirstTile <= tileI && tileI < tileCount)) {
            preview[((pvGod0 + tileI) - godFirstTile)] += 1;
          }
        }
      }
    }
  }
  return preview;
}

// Python: grain_setup_value
export function grainSetupValue(board, cellI, tileI) {
  let adjacentI, distanceTwoI, xI, yI;
  // Score a non-clearing rewrite as an adjacent-pair setup, integer-only.
  xI = (cellI & 7);
  yI = (cellI >> 3);
  adjacentI = 0;
  distanceTwoI = 0;
  if (((xI > 0) && (board[(cellI - 1)] === tileI))) {
    adjacentI += 1;
  }
  if (((xI < 7) && (board[(cellI + 1)] === tileI))) {
    adjacentI += 1;
  }
  if (((yI > 0) && (board[(cellI - 8)] === tileI))) {
    adjacentI += 1;
  }
  if (((yI < 7) && (board[(cellI + 8)] === tileI))) {
    adjacentI += 1;
  }
  if (((xI > 1) && (board[(cellI - 2)] === tileI))) {
    distanceTwoI += 1;
  }
  if (((xI < 6) && (board[(cellI + 2)] === tileI))) {
    distanceTwoI += 1;
  }
  if (((yI > 1) && (board[(cellI - 16)] === tileI))) {
    distanceTwoI += 1;
  }
  if (((yI < 6) && (board[(cellI + 16)] === tileI))) {
    distanceTwoI += 1;
  }
  return ((adjacentI * 10) + distanceTwoI);
}

// Python: enumerate_grain_candidates
export function enumerateGrainCandidates(state) {
  let bestValueI, board, cellI, immediate, oldTileI, setupActions, tileI, valueI;
  immediate = [];
  board = state.board;
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    oldTileI = board[cellI];
    for (tileI = godFirstTile; tileI < tileCount; tileI += 1) {
      if ((tileI === oldTileI)) {
        continue;
      }
      board[cellI] = tileI;
      if ((cellHasMatch(board, cellI) !== 0)) {
        immediate.push(encodeGrain(cellI, tileI));
      }
      board[cellI] = oldTileI;
    }
  }
  if ((immediate.length > 0)) {
    return immediate;
  }
  setupActions = [];
  bestValueI = (-1);
  for (cellI = 0; cellI < boardCells; cellI += 1) {
    oldTileI = board[cellI];
    for (tileI = godFirstTile; tileI < tileCount; tileI += 1) {
      if ((tileI === oldTileI)) {
        continue;
      }
      valueI = grainSetupValue(board, cellI, tileI);
      if ((valueI > bestValueI)) {
        setupActions = [encodeGrain(cellI, tileI)];
        bestValueI = valueI;
      } else {
        if ((valueI === bestValueI)) {
          setupActions.push(encodeGrain(cellI, tileI));
        }
      }
    }
  }
  return setupActions;
}

// Python: enumerate_candidate_actions
export function enumerateCandidateActions(state, allowSpellsI = 1) {
  let actions, actorI, rowI, topXI, topYI;
  actions = enumerateLegalSwaps(state.board);
  if ((allowSpellsI === 0)) {
    return actions;
  }
  actorI = state.actorI;
  if ((state.vessels[actorI][0] >= costRa)) {
    for (rowI = 0; rowI < 8; rowI += 1) {
      actions.push((actionFirstLightBase + rowI));
    }
  }
  if ((state.vessels[actorI][1] >= costNun)) {
    actions.push(actionWaterBeneath);
  }
  if ((state.vessels[actorI][2] >= costOsiris)) {
    actions.push(...enumerateGrainCandidates(state));
  }
  if ((state.vessels[actorI][3] >= costSet)) {
    for (topYI = 0; topYI < sunderingBlockPositions; topYI += 1) {
      for (topXI = 0; topXI < sunderingBlockPositions; topXI += 1) {
        actions.push(encodeSundering(topXI, topYI));
      }
    }
  }
  if ((state.vessels[actorI][4] >= costShu)) {
    if ((state.liftUsed[actorI] === 0)) {
      actions.push(actionLift);
    }
  }
  actions.sort((a, b) => a - b);
  return actions;
}

// Python: action_cost_god_and_value
export function actionCostGodAndValue(actionI) {
  let godI;
  godI = actionPowerGodIndex(actionKind(actionI));
  if ((godI < 0)) {
    return [(-1), 0];
  }
  return [godI, powerCosts[godI]];
}

// Python: action_makes_power_available
export function actionMakesPowerAvailable(state, preview, futureVessels) {
  let actionI, actorI, afterI, beforeI, godI;
  actorI = state.actorI;
  actionI = preview[pvAction];
  for (godI = 0; godI < godCount; godI += 1) {
    beforeI = ((state.vessels[actorI][godI] >= powerCosts[godI]) ? 1 : 0);
    afterI = ((futureVessels[godI] >= powerCosts[godI]) ? 1 : 0);
    if ((godI === 4)) {
      if (((state.liftUsed[actorI] !== 0) || (actionI === actionLift))) {
        afterI = 0;
      }
    }
    if (((beforeI === 0) && (afterI !== 0))) {
      return 1;
    }
  }
  return 0;
}

// Python: features_from_preview
export function featuresFromPreview(state, preview, noiseI, bestSwapUtilityI) {
  let actionI, actorI, capacityI, clearFeatureI, costGodI, costI, damageBaseI, damageFactorI, damageI, damageRoomI, features, futureVessels, godI, kindI, opponentI, reliefBaseI, reliefFactorI, reliefI, reliefRoomI, usefulGainI;
  features = Array.from({length: ftCount}, () => 0);
  actorI = state.actorI;
  opponentI = (1 - actorI);
  actionI = preview[pvAction];
  kindI = actionKind(actionI);
  damageI = (preview[pvHeart] * heartPerTile);
  damageRoomI = (chainDamageCap - state.chainDamageI);
  if ((damageI > damageRoomI)) {
    damageI = damageRoomI;
  }
  if ((damageI > (burdenMax - state.burden[opponentI]))) {
    damageI = (burdenMax - state.burden[opponentI]);
  }
  if ((damageI < 0)) {
    damageI = 0;
  }
  reliefI = ((preview[pvFeather] * featherPerTile) + preview[pvDirectRelief]);
  reliefRoomI = (chainReliefCap - state.chainReliefI);
  if ((reliefI > reliefRoomI)) {
    reliefI = reliefRoomI;
  }
  if ((reliefI > state.burden[actorI])) {
    reliefI = state.burden[actorI];
  }
  if ((reliefI < 0)) {
    reliefI = 0;
  }
  damageBaseI = Math.floor((damageI * featureScale) / chainDamageCap);
  damageFactorI = Math.floor(featureScale / 2);
  damageFactorI += Math.floor((state.burden[opponentI] * featureScale) / 60);
  features[ftD] = Math.floor((damageBaseI * damageFactorI) / featureScale);
  reliefBaseI = Math.floor((reliefI * featureScale) / chainReliefCap);
  reliefFactorI = Math.floor(featureScale / 4);
  reliefFactorI += Math.floor(((state.burden[actorI] * 3) * featureScale) / 120);
  features[ftH] = Math.floor((reliefBaseI * reliefFactorI) / featureScale);
  futureVessels = state.vessels[actorI].slice(0);
  [costGodI, costI] = actionCostGodAndValue(actionI);
  if ((costGodI >= 0)) {
    futureVessels[costGodI] -= costI;
  }
  for (godI = 0; godI < godCount; godI += 1) {
    capacityI = (vesselCap - futureVessels[godI]);
    usefulGainI = preview[(pvGod0 + godI)];
    if ((usefulGainI > capacityI)) {
      usefulGainI = capacityI;
    }
    if ((usefulGainI < 0)) {
      usefulGainI = 0;
    }
    features[(ftG0 + godI)] = Math.floor((usefulGainI * featureScale) / powerCosts[godI]);
    if ((features[(ftG0 + godI)] > featureScale)) {
      features[(ftG0 + godI)] = featureScale;
    }
    futureVessels[godI] += usefulGainI;
  }
  if (((kindI === kindSwap) && (preview[pvMaxRun] >= 4))) {
    if ((state.bonusUsedI === 0)) {
      features[ftX] = featureScale;
    }
  }
  if (((kindI === kindSwap) && (preview[pvMaxRun] >= 5))) {
    features[ftF] = featureScale;
  }
  if ((actionMakesPowerAvailable(state, preview, futureVessels) !== 0)) {
    features[ftR] = featureScale;
  }
  if ((preview[pvClear] > 3)) {
    clearFeatureI = Math.floor(((preview[pvClear] - 3) * featureScale) / 5);
    if ((clearFeatureI > featureScale)) {
      clearFeatureI = featureScale;
    }
    features[ftC] = clearFeatureI;
  }
  if (((kindI === kindSundering) && (bestSwapUtilityI < stormLowUtility))) {
    features[ftS] = featureScale;
  }
  if (((damageI > 0) && (damageI >= (burdenMax - state.burden[opponentI])))) {
    features[ftK] = featureScale;
  }
  features[ftN] = noiseI;
  return features;
}

// Python: unweighted_swap_utility
export function unweightedSwapUtility(features) {
  let godI, godSumI, utilityI;
  utilityI = (features[ftD] + features[ftH]);
  godSumI = 0;
  for (godI = 0; godI < godCount; godI += 1) {
    godSumI += features[(ftG0 + godI)];
  }
  utilityI += Math.floor(godSumI / godCount);
  utilityI += Math.floor(features[ftX] / 2);
  utilityI += Math.floor(features[ftC] / 2);
  return utilityI;
}

// Python: score_features
export function scoreFeatures(features, weights) {
  let featureI, scoreI;
  scoreI = 0;
  for (featureI = 0; featureI < ftCount; featureI += 1) {
    scoreI += (features[featureI] * weights[featureI]);
  }
  return scoreI;
}

// Python: candidate_is_better
export function candidateIsBetter(scoreI, features, actionI, bestScoreI, bestFeatures, bestActionI) {
  let bestDirectI, directI;
  if ((bestFeatures === null)) {
    return 1;
  }
  if ((scoreI > bestScoreI)) {
    return 1;
  }
  if ((scoreI < bestScoreI)) {
    return 0;
  }
  if ((features[ftK] > bestFeatures[ftK])) {
    return 1;
  }
  if ((features[ftK] < bestFeatures[ftK])) {
    return 0;
  }
  if ((features[ftX] > bestFeatures[ftX])) {
    return 1;
  }
  if ((features[ftX] < bestFeatures[ftX])) {
    return 0;
  }
  directI = (features[ftD] + features[ftH]);
  bestDirectI = (bestFeatures[ftD] + bestFeatures[ftH]);
  if ((directI > bestDirectI)) {
    return 1;
  }
  if ((directI < bestDirectI)) {
    return 0;
  }
  return ((actionI < bestActionI) ? 1 : 0);
}

// Python: prepare_previews
export function preparePreviews(state, allowSpellsI) {
  let actionI, actions, bestSwapUtilityI, features, preview, previews, utilityI;
  actions = enumerateCandidateActions(state, allowSpellsI);
  previews = [];
  bestSwapUtilityI = 0;
  for (actionI of actions) {
    preview = previewAction(state, actionI);
    previews.push(preview);
    if ((actionKind(actionI) === kindSwap)) {
      features = featuresFromPreview(state, preview, 0, 0);
      utilityI = unweightedSwapUtility(features);
      if ((utilityI > bestSwapUtilityI)) {
        bestSwapUtilityI = utilityI;
      }
    }
  }
  return [previews, bestSwapUtilityI];
}

// Python: choose_ai_action
export function chooseAiAction(state, opponentIndexI, allowSpellsI = 1) {
  let actionI, bestActionI, bestFeatures, bestScoreI, bestSwapUtilityI, features, noiseI, preview, previews, scoreI, weights;
  if ((opponentIndexI < 1)) {
    opponentIndexI = 1;
  }
  if ((opponentIndexI > 7)) {
    opponentIndexI = 7;
  }
  weights = aiWeights[(opponentIndexI - 1)];
  [previews, bestSwapUtilityI] = preparePreviews(state, allowSpellsI);
  bestActionI = actionNone;
  bestScoreI = 0;
  bestFeatures = null;
  for (preview of previews) {
    noiseI = ((2 * rngRoll10000(state)) - 9999);
    features = featuresFromPreview(state, preview, noiseI, bestSwapUtilityI);
    scoreI = scoreFeatures(features, weights);
    actionI = preview[pvAction];
    if ((candidateIsBetter(scoreI, features, actionI, bestScoreI, bestFeatures, bestActionI) !== 0)) {
      bestActionI = actionI;
      bestScoreI = scoreI;
      bestFeatures = features;
    }
  }
  return bestActionI;
}

// Python: choose_weighted_fixed_action
export function chooseWeightedFixedAction(state, weights, allowSpellsI) {
  let actionI, bestActionI, bestFeatures, bestScoreI, bestSwapUtilityI, features, preview, previews, scoreI;
  [previews, bestSwapUtilityI] = preparePreviews(state, allowSpellsI);
  bestActionI = actionNone;
  bestScoreI = 0;
  bestFeatures = null;
  for (preview of previews) {
    features = featuresFromPreview(state, preview, 0, bestSwapUtilityI);
    scoreI = scoreFeatures(features, weights);
    actionI = preview[pvAction];
    if ((candidateIsBetter(scoreI, features, actionI, bestScoreI, bestFeatures, bestActionI) !== 0)) {
      bestActionI = actionI;
      bestScoreI = scoreI;
      bestFeatures = features;
    }
  }
  return bestActionI;
}

// Python: choose_weighted_noisy_action
export function chooseWeightedNoisyAction(state, weights, allowSpellsI) {
  let actionI, bestActionI, bestFeatures, bestScoreI, bestSwapUtilityI, features, noiseI, preview, previews, scoreI;
  // Deterministic seeded novice errors; one roll per sorted candidate.
  [previews, bestSwapUtilityI] = preparePreviews(state, allowSpellsI);
  bestActionI = actionNone;
  bestScoreI = 0;
  bestFeatures = null;
  for (preview of previews) {
    noiseI = ((2 * rngRoll10000(state)) - 9999);
    features = featuresFromPreview(state, preview, noiseI, bestSwapUtilityI);
    scoreI = scoreFeatures(features, weights);
    actionI = preview[pvAction];
    if ((candidateIsBetter(scoreI, features, actionI, bestScoreI, bestFeatures, bestActionI) !== 0)) {
      bestActionI = actionI;
      bestScoreI = scoreI;
      bestFeatures = features;
    }
  }
  return bestActionI;
}

// Python: choose_novice_action
export function chooseNoviceAction(state, allowSpellsI = 1) {
  return chooseWeightedNoisyAction(state, noviceWeights, allowSpellsI);
}

// Python: choose_calibration_action
export function chooseCalibrationAction(state) {
  return chooseWeightedFixedAction(state, calibrationWeights, 0);
}

// Python: choose_random_action
export function chooseRandomAction(state, allowSpellsI = 0) {
  let actions, choiceI;
  actions = enumerateCandidateActions(state, allowSpellsI);
  if ((actions.length === 0)) {
    return actionNone;
  }
  choiceI = rngIndex(state, actions.length);
  return actions[choiceI];
}

// Python: choose_policy_action
export function choosePolicyAction(state, policyI, levelI, allowSpellsI) {
  if ((policyI === policyAi)) {
    return chooseAiAction(state, levelI, allowSpellsI);
  }
  if ((policyI === policyNovice)) {
    return chooseNoviceAction(state, allowSpellsI);
  }
  if ((policyI === policyCalibration)) {
    return chooseCalibrationAction(state);
  }
  return chooseRandomAction(state, allowSpellsI);
}

// Python: play_duel
export function playDuel(seedI, policy0I = policyAi, level0I = 7, policy1I = policyAi, level1I = 7, firstActorI = 0, allowSpellsI = 1, soulPartsWonI = 0) {
  let actionI, state;
  state = newGame(seedI, firstActorI, soulPartsWonI);
  while (((state.winnerI < 0) && (state.actionCountI < actionCap))) {
    if ((state.actorI === 0)) {
      actionI = choosePolicyAction(state, policy0I, level0I, allowSpellsI);
    } else {
      actionI = choosePolicyAction(state, policy1I, level1I, allowSpellsI);
    }
    if ((actionI === actionNone)) {
      throw new Error("active duel has no candidate action");
    }
    if ((applyAction(state, actionI) === 0)) {
      throw new Error("policy selected an invalid action");
    }
  }
  if ((state.winnerI < 0)) {
    throw new Error("duel reached loop bound without adjudication");
  }
  assertInvariants(state);
  return state;
}

// Python: replay_actions
export function replayActions(seedI, actionList, firstActorI = 0, soulPartsWonI = 0) {
  let actionI, state;
  state = newGame(seedI, firstActorI, soulPartsWonI);
  for (actionI of actionList) {
    if ((state.winnerI >= 0)) {
      break;
    }
    if ((applyAction(state, actionI) === 0)) {
      throw new Error(`invalid replay action ${actionI} at ${state.actionCountI}`);
    }
  }
  return state;
}

// Python: state_signature
export function stateSignature(state) {
  let actorI, vesselsFlat;
  vesselsFlat = [];
  for (actorI = 0; actorI < 2; actorI += 1) {
    vesselsFlat.push(...state.vessels[actorI]);
  }
  return [boardHash(state.board), state.seedI, state.winnerI, state.finishReasonI, state.actionCountI, state.burden[0], state.burden[1], ...vesselsFlat, state.cumulativeHeartDamage[0], state.cumulativeHeartDamage[1], state.cumulativeGodTiles[0], state.cumulativeGodTiles[1], state.soulPartsWon, state.descentOpenI];
}

// Python: state_summary
export function stateSummary(state) {
  return {
    "seed": state.seedI,
    "actions": state.actionCountI,
    "winner": state.winnerI,
    "finish_reason": state.finishReasonI,
    "board_hash": boardHash(state.board),
    "burdens": state.burden.slice(0),
    "vessels_0": state.vessels[0].slice(0),
    "vessels_1": state.vessels[1].slice(0),
    "soul_parts_won": state.soulPartsWon,
    "descent_open": state.descentOpenI,
    "max_chain_actions": state.maxChainActionsI,
    "max_chain_damage": state.maxChainDamageI,
    "max_chain_relief": state.maxChainReliefI,
    "max_vessel": state.maxVesselI,
    "cascade_overflow": state.cascadeOverflowI
  };
}

// Python: sample_seed
export function sampleSeed(seedBaseI, sampleI) {
  // Odd stride permutes all 65536 seeds before repeating.
  return ((seedBaseI + (sampleI * 40503)) & 65535);
}

// Python: measure_board_statistics
export function measureBoardStatistics(sampleCountI, seedBaseI = 1) {
  let actionI, actions, bothBoardsI, cascadeActionsI, choiceI, clearTotalI, divisor, featherBoardsI, featherI, heartBoardsI, heartI, legalTotalI, maxClearI, preview, sampleI, state, waveTotalI;
  legalTotalI = 0;
  heartBoardsI = 0;
  featherBoardsI = 0;
  bothBoardsI = 0;
  cascadeActionsI = 0;
  waveTotalI = 0;
  clearTotalI = 0;
  maxClearI = 0;
  for (sampleI = 0; sampleI < sampleCountI; sampleI += 1) {
    state = newGame(sampleSeed(seedBaseI, sampleI));
    actions = enumerateLegalSwaps(state.board);
    legalTotalI += actions.length;
    heartI = 0;
    featherI = 0;
    for (actionI of actions) {
      preview = previewAction(state, actionI);
      if ((preview[pvHeart] > 0)) {
        heartI = 1;
      }
      if ((preview[pvFeather] > 0)) {
        featherI = 1;
      }
    }
    heartBoardsI += heartI;
    featherBoardsI += featherI;
    if (((heartI !== 0) && (featherI !== 0))) {
      bothBoardsI += 1;
    }
    choiceI = rngIndex(state, actions.length);
    applyAction(state, actions[choiceI]);
    if ((state.cascadeWavesI > 0)) {
      cascadeActionsI += 1;
    }
    waveTotalI += state.creditedWavesI;
    clearTotalI += state.lastTotalClearI;
    if ((state.lastTotalClearI > maxClearI)) {
      maxClearI = state.lastTotalClearI;
    }
  }
  divisor = sampleCountI;
  return {
    "samples": sampleCountI,
    "mean_legal_moves": (legalTotalI / divisor),
    "heart_opportunity": (heartBoardsI / divisor),
    "feather_opportunity": (featherBoardsI / divisor),
    "both_opportunity": (bothBoardsI / divisor),
    "cascade_chance": (cascadeActionsI / divisor),
    "mean_resolution_waves": (waveTotalI / divisor),
    "mean_total_clear": (clearTotalI / divisor),
    "max_total_clear": maxClearI
  };
}

// Python: aggregate_duels
export function aggregateDuels(states) {
  let actions, cappedI, naturalI, wins0I;
  actions = states.map(state => state.actionCountI);
  naturalI = states.filter(state => (state.finishReasonI === finishThreshold)).map(state => 1).reduce((total, value) => total + value, 0);
  wins0I = states.filter(state => (state.winnerI === 0)).map(state => 1).reduce((total, value) => total + value, 0);
  cappedI = (states.length - naturalI);
  return {
    "duels": states.length,
    "median_actions": median(actions),
    "mean_actions": (actions.reduce((total, value) => total + value, 0) / actions.length),
    "min_actions": Math.min(...actions),
    "max_actions": Math.max(...actions),
    "natural_finish_rate": (naturalI / states.length),
    "cap_rate": (cappedI / states.length),
    "side_0_win_rate": (wins0I / states.length),
    "max_chain_actions": Math.max(...states.map(state => state.maxChainActionsI)),
    "max_chain_damage": Math.max(...states.map(state => state.maxChainDamageI)),
    "max_chain_relief": Math.max(...states.map(state => state.maxChainReliefI)),
    "max_vessel": Math.max(...states.map(state => state.maxVesselI)),
    "cascade_overflows": states.map(state => state.cascadeOverflowI).reduce((total, value) => total + value, 0)
  };
}

// Python: measure_calibration_duels
export function measureCalibrationDuels(duelCountI, seedBaseI = 7001) {
  let duelI, naturalActions, result, state, states;
  states = [];
  for (duelI = 0; duelI < duelCountI; duelI += 1) {
    state = playDuel(sampleSeed(seedBaseI, duelI), policyCalibration, 0, policyCalibration, 0, (duelI & 1), 0);
    states.push(state);
  }
  result = aggregateDuels(states);
  naturalActions = states.filter(state => (state.finishReasonI === finishThreshold)).map(state => state.actionCountI);
  if ((naturalActions.length > 0)) {
    result["mean_natural_finish_actions"] = (naturalActions.reduce((total, value) => total + value, 0) / naturalActions.length);
    result["median_natural_finish_actions"] = median(naturalActions);
  } else {
    result["mean_natural_finish_actions"] = 0.0;
    result["median_natural_finish_actions"] = 0.0;
  }
  return result;
}

// Python: measure_termination
export function measureTermination(duelCountI, seedBaseI = 19001) {
  let duelI, state, states;
  states = [];
  for (duelI = 0; duelI < duelCountI; duelI += 1) {
    state = playDuel(sampleSeed(seedBaseI, duelI), policyAi, 7, policyAi, 7, (duelI & 1), 1);
    states.push(state);
  }
  return [aggregateDuels(states), states];
}

// Python: measure_ladder
export function measureLadder(gamesPerLevelI, seedBaseI = 31001, allowSpellsI = 1) {
  let gameI, levelI, opponentWinsI, rates, seedI, state;
  rates = {};
  for (levelI = 1; levelI < 8; levelI += 1) {
    opponentWinsI = 0;
    for (gameI = 0; gameI < gamesPerLevelI; gameI += 1) {
      seedI = sampleSeed((seedBaseI + (levelI * 997)), gameI);
      state = playDuel(seedI, policyNovice, 0, policyAi, levelI, (gameI & 1), allowSpellsI);
      if ((state.winnerI === 1)) {
        opponentWinsI += 1;
      }
    }
    rates[levelI] = (opponentWinsI / gamesPerLevelI);
  }
  return rates;
}

// Python: measure_selfplay
export function measureSelfplay(duelCountI, level0I = 7, level1I = 7, seedBaseI = 1, allowSpellsI = 1) {
  let duelI, state, states;
  states = [];
  for (duelI = 0; duelI < duelCountI; duelI += 1) {
    state = playDuel(sampleSeed(seedBaseI, duelI), policyAi, level0I, policyAi, level1I, (duelI & 1), allowSpellsI);
    states.push(state);
  }
  return aggregateDuels(states);
}

// Python: run_acceptance
export function runAcceptance(boardSamplesI = 12000, calibrationDuelsI = 800, terminationDuelsI = 800, ladderGamesI = 200) {
  let board, calibration, failures, ladder, levelI, state, states, termination, warnings;
  board = measureBoardStatistics(boardSamplesI);
  calibration = measureCalibrationDuels(calibrationDuelsI);
  [termination, states] = measureTermination(terminationDuelsI);
  ladder = measureLadder(ladderGamesI);
  failures = [];
  warnings = [];
  if ((!(11.25 <= board["mean_legal_moves"] && board["mean_legal_moves"] <= 12.75))) {
    failures.push("published ~12 legal moves did not reproduce");
  }
  if ((!(0.273 <= board["cascade_chance"] && board["cascade_chance"] <= 0.343))) {
    failures.push("published 30.8% cascade chance did not reproduce");
  }
  if ((!(0.77 <= board["heart_opportunity"] && board["heart_opportunity"] <= 0.84))) {
    failures.push("published 80.5% Heart opportunity did not reproduce");
  }
  if ((!(0.125 <= board["feather_opportunity"] && board["feather_opportunity"] <= 0.185))) {
    failures.push("published 15.3% Feather opportunity did not reproduce");
  }
  if ((!(32 <= calibration["median_actions"] && calibration["median_actions"] <= 44))) {
    failures.push("published median ~38 actions did not reproduce");
  }
  if ((termination["max_actions"] > actionCap)) {
    failures.push("termination exceeded the 48-action cap");
  }
  if ((termination["max_chain_actions"] > 2)) {
    failures.push("a bonus chain exceeded two actions");
  }
  if ((termination["max_chain_damage"] > chainDamageCap)) {
    failures.push("a chain exceeded the damage cap");
  }
  if ((termination["max_chain_relief"] > chainReliefCap)) {
    failures.push("a chain exceeded the relief cap");
  }
  if ((termination["max_vessel"] > vesselCap)) {
    failures.push("a vessel exceeded capacity");
  }
  if ((termination["natural_finish_rate"] < 0.7)) {
    failures.push("full-rule natural finish rate is below 70%");
  }
  if ((!(34 <= termination["median_actions"] && termination["median_actions"] <= 42))) {
    failures.push("full-rule median is outside 34-42 actions");
  }
  if ((!(0.48 <= termination["side_0_win_rate"] && termination["side_0_win_rate"] <= 0.52))) {
    failures.push("full-rule side-0 win rate is outside 48-52%");
  }
  if ((!(0.25 <= ladder[1] && ladder[1] <= 0.4))) {
    failures.push("opponent 1 is outside the 25-40% novice target");
  }
  if ((ladder[7] < 0.65)) {
    failures.push("opponent 7 is not overwhelming against the novice");
  }
  for (levelI = 1; levelI < 7; levelI += 1) {
    if ((ladder[(levelI + 1)] < ladder[levelI])) {
      failures.push(`ladder is not monotonic at ${levelI}->${(levelI + 1)}`);
    }
  }
  for (state of states) {
    assertInvariants(state);
  }
  return {
    "passed": ((failures.length === 0) ? 1 : 0),
    "failures": failures,
    "warnings": warnings,
    "board": board,
    "calibration_no_spells": calibration,
    "termination_full_rules": termination,
    "ladder_opponent_win_rates": ladder
  };
}

// Python: statistics.median (measurement helper; sorts a copy).
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
