import sys

sys.path.append("/Users/puyuan/code/LightZero/")
from functools import partial
import torch
from ding.config import compile_config
from ding.envs import create_env_manager
from ding.envs import get_vec_env_setting
from ding.policy import create_policy
from ding.utils import set_pkg_seed
from zoo.board_games.gomoku.config.gomoku_alphazero_bot_mode_config import main_config, create_config
import numpy as np


class Agent:
    def __init__(self, seed=0):

        # model_path = './ckpt/ckpt_best.pth.tar'
        model_path = None

        # If True, you can play with the agent.
        # main_config.env.agent_vs_human = True
        main_config.env.agent_vs_human = False
        # main_config.env.render_mode = 'image_realtime_mode'
        main_config.env.render_mode = 'image_savefile_mode'
        main_config.env.replay_path = './video'

        create_config.env_manager.type = 'base'
        main_config.env.alphazero_mcts_ctree = False
        main_config.policy.mcts_ctree = False
        main_config.env.evaluator_env_num = 1
        main_config.env.n_evaluator_episode = 1

        cfg, create_cfg = [main_config, create_config]
        create_cfg.policy.type = create_cfg.policy.type

        if cfg.policy.cuda and torch.cuda.is_available():
            cfg.policy.device = 'cuda'
        else:
            cfg.policy.device = 'cpu'

        cfg = compile_config(cfg, seed=seed, env=None, auto=True, create_cfg=create_cfg, save_cfg=True)
        # Create main components: env, policy
        env_fn, collector_env_cfg, evaluator_env_cfg = get_vec_env_setting(cfg.env)
        collector_env = create_env_manager(cfg.env.manager, [partial(env_fn, cfg=c) for c in collector_env_cfg])
        evaluator_env = create_env_manager(cfg.env.manager, [partial(env_fn, cfg=c) for c in evaluator_env_cfg])
        collector_env.seed(cfg.seed)
        evaluator_env.seed(cfg.seed, dynamic_seed=False)
        set_pkg_seed(cfg.seed, use_cuda=cfg.policy.cuda)
        self.policy = create_policy(cfg.policy, model=None, enable_field=['learn', 'collect', 'eval'])

        # load pretrained model
        if model_path is not None:
            self.policy.learn_mode.load_state_dict(torch.load(model_path, map_location=cfg.policy.device))

    def compute_action(self, obs):
        # print(obs)
        policy_output = self.policy.eval_mode.forward({'0': obs})
        actions = {env_id: output['action'] for env_id, output in policy_output.items()}
        return actions['0']


if __name__ == '__main__':
    import sys

    sys.path.append("/Users/puyuan/code/LightZero/")
    from easydict import EasyDict
    from zoo.board_games.gomoku.envs.gomoku_env import GomokuEnv
    cfg = EasyDict(
        prob_random_agent=0,
        board_size=15,
        battle_mode='self_play_mode',  # NOTE
        channel_last=False,
        scale=False,
        agent_vs_human=False,
        bot_action_type='v1',  # {'v0', 'v1', 'alpha_beta_pruning'}
        prob_random_action_in_bot=0.,
        check_action_to_connect4_in_bot_v0=False,
        render_mode='state_realtime_mode',
        replay_path=None,
        screen_scaling=9,
        alphazero_mcts_ctree=False,
    )
    env = GomokuEnv(cfg)
    obs = env.reset()
    agent = Agent()

    while True:
        # 更新游戏环境
        observation, reward, done, info = env.step(env.random_action())
        # 如果游戏没有结束，获取 bot 的动作
        if not done:
            # agent_action = env.random_action()
            agent_action = agent.compute_action(observation)
            # 更新环境状态
            _, _, done, _ = env.step(agent_action)
            # 准备响应数据
            print('orig bot action: {}'.format(agent_action))
            agent_action = {'i': int(agent_action // 15), 'j': int(agent_action % 15)}
            print('bot action: {}'.format(agent_action))
        else:
            break

