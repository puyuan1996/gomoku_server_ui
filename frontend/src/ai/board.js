/*
这段代码定义了一个名为 Board 的类，用于表示和管理围棋或象棋等棋盘游戏的状态。以下是其功能和结构概述：

初始化棋盘大小、当前玩家角色以及各种缓存。
提供检测游戏是否结束的方法。
提供获取当前获胜者的方法。
提供获取合法走法的方法。
提供执行走子及撤销走子的方法。
提供坐标与位置之间转换的方法。
提供获取有价值走法的方法。
提供显示棋盘的方法。
提供棋盘状态的哈希方法。
提供评估棋盘状态的方法。
提供复制当前棋盘并反转角色的方法。
提供将棋盘状态转换为字符串的方法。
*/
// 导入相关模块
import Zobrist from './zobrist';
import Cache from './cache';
// import { evaluate } from './evaluate'; // 这一行已经被注释掉，因为下面使用了新的评估方法
import Evaluate, { FIVE } from './eval';

// 定义棋盘类
class Board {
  constructor(size = 15, firstRole = 1) {
    this.size = size; // 棋盘大小，默认为15x15
    this.board = Array(this.size).fill().map(() => Array(this.size).fill(0)); // 初始化棋盘，所有位置为空（用0表示）
    this.firstRole = firstRole;  // 第一个玩家的角色，默认为1（通常代表黑棋）
    this.role = firstRole;  // 当前玩家的角色
    this.history = []; // 历史记录，用于记录每次走子的位置和角色
    this.zobrist = new Zobrist(this.size); // 初始化Zobrist哈希
    this.winnerCache = new Cache(); // 获胜者缓存
    this.gameoverCache = new Cache(); // 游戏结束缓存
    this.evaluateCache = new Cache(); // 评估分数缓存
    this.valuableMovesCache = new Cache(); // 有价值走法缓存
    this.evaluateTime = 0; // 评估时间
    this.evaluator = new Evaluate(this.size); // 初始化评估器
  }

  // 检查游戏是否结束
  isGameOver() {
    const hash = this.hash(); // 获取当前棋盘的哈希值
    // 如果游戏结束缓存中有记录，直接返回结果
    if (this.gameoverCache.get(hash)) {
      return this.gameoverCache.get(hash);
    }
    // 如果已经有获胜者，游戏结束
    if (this.getWinner() !== 0) {
      this.gameoverCache.put(hash, true); // 缓存结果
      return true;
    }
    // 如果棋盘上没有空位，则游戏结束，否则游戏继续
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) {
          this.gameoverCache.put(hash, false);
          return false;
        }
      }
    }
    this.gameoverCache.put(hash, true);
    return true;
  }

  // 定义getWinner函数，用于判断当前棋盘上是否有获胜者
  getWinner() {
      // 计算当前棋盘状态的哈希值
      const hash = this.hash();
      // 如果在缓存中已经存在当前哈希值对应的获胜者信息，则直接返回该信息
      if (this.winnerCache.get(hash)) {
        return this.winnerCache.get(hash);
      }
      // 定义四个检查方向：水平、垂直、正对角线、反对角线
      let directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
      // 遍历棋盘上的所有格子
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          // 如果当前格子为空，则跳过
          if (this.board[i][j] === 0) continue;
          // 遍历四个方向
          for (let direction of directions) {
            let count = 0;
            // 在当前方向上连续检查相同棋子的数量
            while (
              i + direction[0] * count >= 0 &&
              i + direction[0] * count < this.size &&
              j + direction[1] * count >= 0 &&
              j + direction[1] * count < this.size &&
              this.board[i + direction[0] * count][j + direction[1] * count] === this.board[i][j]
            ) {
              count++;
            }
            // 如果连续相同的棋子数量达到5个或以上，则该玩家获胜
            if (count >= 5) {
              // 将获胜者信息存入缓存
              this.winnerCache.put(hash, this.board[i][j]);
              // 返回获胜者信息
              return this.board[i][j];
            }
          }
        }
      }
      // 如果没有获胜者，则在缓存中记录当前哈希值对应的获胜者信息为0（无获胜者）
      this.winnerCache.put(hash, 0);
      // 返回0表示当前没有获胜者
      return 0;
    }

  // 定义getValidMoves函数，用于获取当前棋盘上所有合法的落子位置
  getValidMoves() {
      let moves = [];
      // 遍历棋盘的每一个格子
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          // 如果当前格子为空，则可以落子
          if (this.board[i][j] === 0) {
            // 将该位置加入到合法落子位置列表中
            moves.push([i, j]);
          }
        }
      }
      // 返回所有合法的落子位置列表
      return moves;
    }

  // 定义put函数，用于在棋盘上放置一个棋子
  put(i, j, role) {
      // 如果没有指定角色，则使用当前角色
      if (role === undefined) {
        role = this.role;
      }
      // 如果输入的坐标不是数字，则打印错误信息并返回false
      if (isNaN(i) || isNaN(j)) {
        console.log("Invalid move：input position is not numbers!", i, j);
        return false;
      }
      // 如果当前坐标已经有棋子，则打印错误信息并返回false
      if (this.board[i][j] !== 0) {
        console.log("Invalid move: current position is not empty!", i, j);
        return false;
      }
      // 在指定位置放置棋子
      this.board[i][j] = role;
      // 将此次移动记录到历史记录中
      this.history.push({ i, j, role });
      // 使用Zobrist散列更新当前棋盘的哈希值
      this.zobrist.togglePiece(i, j, role);
      // 更新评估器中的棋盘状态
      this.evaluator.move(i, j, role);
      // 切换角色，如果当前是1，切换为-1；如果当前是-1，切换为1
      this.role *= -1;  // Switch role
      return true;
  }

  // 实现撤销操作的函数
  undo() {
      // 如果历史记录为空，说明没有可撤销的步骤
      if (this.history.length === 0) {
        console.log("No moves to undo!"); // 打印提示信息
        return false; // 返回false，表示撤销失败
      }

      // 从历史记录中取出最后一步棋的信息
      let lastMove = this.history.pop();
      // 将棋盘上对应的位置重置为0（假设0代表该位置没有棋子）
      this.board[lastMove.i][lastMove.j] = 0;
      // 将当前的玩家角色恢复到前一步的玩家
      this.role = lastMove.role;
      // 切换Zobrist哈希中的棋子，用于快速哈希棋盘状态
      this.zobrist.togglePiece(lastMove.i, lastMove.j, lastMove.role);
      // 调用评估器的undo函数，撤销上一步的评估效果
      this.evaluator.undo(lastMove.i, lastMove.j);
      // 返回true，表示撤销成功
      return true;
  }

  // 将一维位置索引转换为二维坐标
  position2coordinate(position) {
      // 计算行索引
      const row = Math.floor(position / this.size)
      // 计算列索引
      const col = position % this.size
      // 返回二维坐标数组
      return [row, col]
  }

  // 将二维坐标转换为一维位置索引
  coordinate2position(coordinate) {
      // 根据行、列索引和棋盘大小计算一维位置索引
      return coordinate[0] * this.size + coordinate[1]
  }

  // 获取价值较高的可落子点
  getValuableMoves(role, depth = 0, onlyThree = false, onlyFour = false) {
      // 获取当前棋盘的哈希值
      const hash = this.hash();
      // 尝试从缓存中获取此哈希值对应的价值较高的落子点
      const prev = this.valuableMovesCache.get(hash);
      if (prev) {
          // 如果缓存中存在，并且各项参数都相同，则直接返回缓存中的落子点
          if (prev.role === role && prev.depth === depth && prev.onlyThree === onlyThree && prev.onlyFour === onlyFour) {
              return prev.moves;
          }
      }
      // 否则，调用评估器获取价值较高的落子点
      const moves = this.evaluator.getMoves(role, depth, onlyThree, onlyFour);
      // 如果不是仅考虑三连或四连的情况，则默认在中心点落子（如果中心点为空）
      if (!onlyThree && !onlyFour) {
          const center = Math.floor(this.size / 2);
          if (this.board[center][center] == 0) moves.push([center, center]);
      }
      // 将计算出的落子点存入缓存
      this.valuableMovesCache.put(hash, {
          role,
          moves,
          depth,
          onlyThree,
          onlyFour
      });
      // 返回价值较高的落子点数组
      return moves;
  }

  // 用于显示棋盘的函数，可以传入额外的位置列表以显示问号，辅助调试
  display(extraPoints = []) {
      // 将额外的点转换为一维位置索引
      const extraPosition = extraPoints.map((point) => this.coordinate2position(point));
      let result = ''; // 初始化结果字符串
      for (let i = 0; i < this.size; i++) {
          for (let j = 0; j < this.size; j++) {
              // 获取当前遍历的点的一维位置索引
              const position = this.coordinate2position([i, j]);
              // 如果当前点在额外的位置列表中，将其显示为问号
              if (extraPosition.includes(position)) {
                  result += '? ';
                  continue;
              }
              // 根据棋盘上的值，显示不同的字符
              switch (this.board[i][j]) {
                  case 1:
                      result += 'O '; // 玩家1的棋子用'O'表示
                      break;
                  case -1:
                      result += 'X '; // 玩家-1的棋子用'X'表示
                      break;
                  default:
                      result += '- '; // 空位用'-'表示
                      break;
              }
          }
          result += '\n';  // 每行结束后添加换行符
      }
      // 返回棋盘的字符串表示
      return result;
  }

  // 生成当前棋盘状态的哈希值的函数
  hash() {
      // 调用zobrist实例的getHash方法来获取当前棋盘的哈希值
      return this.zobrist.getHash();
  }

  // 注释掉的旧的评估函数，可能是用于调试或替换的函数
  //evaluate(role) {
  //  const start = + new Date();
  //  const hash = this.hash();
  //  const prev = this.evaluateCache.get(hash);
  //  if (prev) {
  //    if (prev.role === role) {
  //      return prev.value;
  //    }
  //  }
  //  const value = evaluate(this.board, role);
  //  this.evaluateTime += +new Date - start;
  //  this.evaluateCache.put(hash, { role, value });
  //  return value;
  //}

  // 新的评估函数，用于评估当前棋盘对指定玩家的得分
  evaluate(role) {
      // 获取当前棋盘的哈希值
      const hash = this.hash();
      // 从评估缓存中获取之前的评估结果
      const prev = this.evaluateCache.get(hash);
      if (prev) {
          // 如果缓存中有对应角色的评估结果，直接返回该结果
          if (prev.role === role) {
              return prev.score;
          }
      }
      // 获取当前棋盘的胜者
      const winner = this.getWinner();
      let score = 0;
      // 如果已经有胜者，根据胜者和当前角色计算分数
      if (winner !== 0) {
          score = FIVE * winner * role;
      } else {
          // 否则通过评估器计算当前角色的得分
          score = this.evaluator.evaluate(role);
      }
      // 将评估结果存入缓存
      this.evaluateCache.put(hash, { role, score });
      // 返回评估得分
      return score;
  }

  // 反转棋盘的函数，反转棋盘上所有棋子的角色
  reverse() {
      // 创建新的Board实例，大小与当前棋盘相同，但是首个落子角色相反
      const newBoard = new Board(this.size, -this.firstRole);
      // 遍历历史记录中的所有落子
      for (let i = 0; i < this.history.length; i++) {
          // 获取落子的坐标和角色
          const { i: x, j: y, role } = this.history[i];
          // 在新棋盘上落子，但是角色取反
          newBoard.put(x, y, -role);
      }
      // 返回反转后的棋盘
      return newBoard;
  }

  // 将棋盘转换为字符串形式的函数
  toString() {
      // 遍历棋盘的每一行，将每个位置的值转换为字符串，并将每行连接起来
      return this.board.map(row => row.join('')).join('');
  }
}
// 导出Board类
export default Board;
