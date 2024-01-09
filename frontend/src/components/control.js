/*
这段代码定义了一个React组件Control，它是一个用户界面控制面板，用于启动和结束游戏、悔棋、设置AI的一些参数等。
它使用react-redux的useDispatch和useSelector来与Redux状态管理库交互，允许它派发动作并获取状态。
这个组件有以下几个部分：

按钮组: 提供开始游戏、悔棋和认输的操作。
设置项: 允许用户设置AI是否先手、AI的类型（深度）、是否显示序号。
状态显示: 显示当前的评分、搜索深度、搜索路径和历史步骤。
组件中使用了antd库的Button、Switch和Select组件来创建用户界面。
*/

// 引入React和CSS样式文件
import React from 'react';
import './control.css';

// 引入Redux的钩子函数，用于状态管理和动作派发
import { useDispatch, useSelector } from 'react-redux';

// 引入游戏状态管理的动作
import { startGame, endGame, undoMove, setAiFirst, setDepth, setIndex } from '../store/gameSlice';

// 引入游戏的配置信息，如棋盘大小
import { board_size } from '../config';

// 引入antd库中的组件供我们使用
import { Button, Switch, Select } from 'antd';

// 引入游戏的状态常量
import { STATUS } from '../status';

// 引入React的钩子函数，用于记忆函数，以避免不必要的重新渲染
import { useCallback } from 'react';

// 定义Control组件
function Control() {
  // 使用dispatch发送动作到Redux的store
  const dispatch = useDispatch();

  // 通过useSelector从Redux的store中获取游戏状态数据
  const { loading, winner, status, history, aiFirst, depth, index, score, path, currentDepth } =
    useSelector((state) => state.game);

  // useCallback是React的一个钩子，用于缓存函数，以便在组件的重新渲染之间保持函数的引用不变，除非依赖项发生变化。
  // 这里创建了一个start函数，该函数在调用时会调用dispatch函数并发送一个startGame动作，这个动作带有关于棋盘大小、AI是否先手和AI深度的参数。
  // useCallback的第二个参数是依赖项数组，只有当这些依赖项发生变化时，函数start才会被重新创建。
  const start = useCallback(() => {
    dispatch(startGame({board_size, aiFirst, depth}));
  }, [dispatch, board_size, aiFirst, depth]);

  // 缓存结束游戏的函数
  const end = useCallback(() => {
    dispatch(endGame());
  }, [dispatch]);

  // 缓存悔棋的函数
  const undo = useCallback(() => {
    dispatch(undoMove());
  }, [dispatch]);

  // 缓存改变AI先手的函数
  const onFirstChange = useCallback((checked) => {
    dispatch(setAiFirst(checked));
  }, [dispatch]);

  // 缓存改变AI深度的函数
  const onDepthChange = useCallback((value) => {
    dispatch(setDepth(value));
  }, [dispatch]);

  // 缓存改变序号显示的函数
  const onIndexChange = useCallback((checked) => {
    dispatch(setIndex(checked));
  }, [dispatch]);

  // 渲染组件
  return (
    <div className="controle">
      <div className="buttons">
        {/* 开始按钮，当游戏正在加载或不在空闲状态时禁用*/}
        <Button className="button" type="primary" onClick={start} disabled={loading || status !== STATUS.IDLE}>开始</Button>
        {/* 悔棋按钮，当游戏正在加载或不在游戏进行状态或没有历史步骤时禁用*/}
        <Button className="button" type="primary" onClick={undo} disabled={loading || status !== STATUS.GAMING || history.length === 0}>悔棋</Button>
        {/* 认输按钮，当游戏正在加载或不在游戏进行状态时禁用*/}
        <Button className="button" type="primary" onClick={end} disabled={loading || status !== STATUS.GAMING}>认输</Button>
      </div>
      <div className="setting">
        {/* AI先手开关*/}
        <div className="setting-item">
          AI 先手: <Switch defaultChecked={aiFirst} onChange={onFirstChange} disabled={loading} />
        </div>
        {/* AI类型选择器，包含不同深度的AI选项*/}
        <div className="setting-item">
          AI 类型:
          <Select
            defaultValue={String(depth)}
            style={{ width: 200 }}
            onChange={onDepthChange}
            disabled={loading}
            options={[
              // 选项中的value代表AI的深度，label是显示给用户看的类型名称
              { value: '-2', label: 'Random' },
              { value: '-1', label: 'RuleBot' },
              { value: '0', label: 'AlphaZero' },
              { value: '2', label: 'AB-2' },
              { value: '4', label: 'AB-4' },
              // 注释掉的是其他可能的AI类型选项，这些被替换为更专业的名称了
              // { value: '2', label: '弱智' },
              // { value: '4', label: '简单' },
              // { value: '6', label: '普通' },
              // { value: '8', label: '困难' },
            ]}
          />
        </div>
        {/* 序号开关，控制是否显示序号*/}
        <div className="setting-item">
          显示棋子步数: <Switch defaultChecked={index} onChange={onIndexChange} />
        </div>
      </div>
      {/* 状态显示区域，显示当前评分、深度、路径和历史步骤 */}
      <div className="status">
        <div className="status-item">评分：{score}</div>
        <div className="status-item">深度: {currentDepth}</div>
        <div className="status-item">路径: {JSON.stringify(path)}</div>
        {/* 历史步骤是一个数组，这里将其转换为JSON字符串显示，并且只显示每个步骤的(i, j)坐标 */}
        <div className="status-item">历史: {JSON.stringify(history.map(h => [h.i, h.j]))}</div>
      </div>
    </div>
  );
}

// 导出Control组件，使其可以在其他文件中被引入和使用
export default Control;
