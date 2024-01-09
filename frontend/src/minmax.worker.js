/*
这段代码是一个用于游戏AI的Web Worker脚本，用于在一个单独的线程中运行游戏AI的计算，以避免阻塞UI线程。
它实现了简单的消息处理，根据不同的动作（如开始游戏、移动棋子、撤销操作和结束游戏）对游戏状态进行更新，并计算AI的最佳移动。
代码使用了minimax算法来计算这些移动，这是一种常见的算法，用于在对弈游戏中找到最优策略。
*/
// 导入Board类和minmax函数
import Board from './ai/board';
import { minmax } from './ai/minmax';
import { board_size } from './config';

// 监听worker的消息事件
onmessage = function (event) {
  const { action, payload } = event.data; // 解构传入的动作和负载数据
  let res = null;
  switch (action) { // 根据动作类型决定要执行的代码块
    case 'start': // 开始游戏
      res = start(payload.board_size, payload.aiFirst, payload.depth);
      break;
    case 'move': // 执行移动
      res = move(payload.position, payload.depth);
      break;
    case 'undo': // 撤销操作
      res = undo();
      break;
    case 'end': // 结束游戏
      res = end();
      break;
    default:
      break;
  }
  postMessage({ // 发送处理结果回主线程
    action,
    payload: res,
  });
};

// 初始化棋盘
let board = new Board(board_size);
let score = 0, bestPath = [], currentDepth = 0;

// 获取棋盘数据的函数
const getBoardData = () => {
  return {
    board: JSON.parse(JSON.stringify(board.board)), // 获取当前棋盘状态的深拷贝
    winner: board.getWinner(), // 获取获胜者信息
    current_player: board.role, // 获取当前玩家
    history: JSON.parse(JSON.stringify(board.history)), // 获取历史记录的深拷贝
    size: board.size, // 获取棋盘大小
    score, // 当前得分
    bestPath, // 最佳路径
    currentDepth, // 当前搜索深度
  }
}

// 开始游戏的函数
export const start = (board_size, aiFirst = true, depth = 4) => {
  console.log('start', board_size, aiFirst, depth);
  board = new Board(board_size); // 创建新的棋盘实例
  try {
    if (aiFirst) { // 如果AI先手
      let score, move, bestPath, currentDepth;
      if (depth === 0) { //NOTE: depth === 0 表示 AI 使用后端传来的 LightZero Agent action
        // 当搜索深度为0时，直接放置在中心位置
        move = [7, 7]; // 这里假设棋盘足够大，中心位置是[7, 7]
      } else {
        // 当搜索深度不为0时，使用minimax算法计算最佳移动
        const res = minmax(board, board.role, depth);
        [score, move, bestPath, currentDepth] = res;
      }
      // 执行移动
      board.put(move[0], move[1]);
    }

  } catch (e) {
    console.log(e);
  }
  return getBoardData(); // 返回游戏状态
};

// 执行移动的函数
export const move = (position, depth) => {
  console.log('move', board_size, depth);
  try {
    board.put(position[0], position[1]); // 在棋盘上放置棋子
  } catch (e) {
    console.log(e);
  }

  if (!board.isGameOver()) { // 如果游戏没有结束
    let score, move, bestPath, currentDepth;
    if (depth === 0) { //NOTE: depth === 0 表示 AI 使用后端传来的 LightZero Agent action
//      debugger; // TODO: 调试代码，应该在实际使用中移除
      try {
        board.put(position[0], position[1]); // 更新棋盘状态
      } catch (e) {
        console.log(e);
      }
      // 如果搜索深度为0，直接使用输入的position作为结果
      move = [position[2], position[3]]; // 假设这里position是一个数组，如[2, 3, 4, 5]
    } else {
       try {
        board.put(position[0], position[1]);  // 将玩家的移动更新到棋盘上
       } catch (e) {
        console.log(e);
      }
      // 当搜索深度不为0时，使用minimax算法计算最佳移动
      const res = minmax(board, board.role, depth);
      [score, move, bestPath, currentDepth] = res;
    }
    // 执行AI的移动
    board.put(move[0], move[1]);
  }

  return getBoardData(); // 返回更新后的游戏状态
};

// 结束游戏的函数，实际上并不进行任何操作
export const end = () => {
  // do nothing
  return getBoardData(); // 返回当前游戏状态
};

// 撤销操作的函数
export const undo = () => {
  board.undo(); // 撤销一步
  board.undo(); // 再撤销一步，总共撤销两步，即玩家和AI各撤销一步
  return getBoardData(); // 返回更新后的游戏状态
}