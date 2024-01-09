# 配置环境变量，添加miniconda环境的路径到系统PATH中，以便可以使用该环境中的Python及其库
# export PATH="/Users/puyuan/miniconda3/envs/arm64-py38/bin:$PATH"
# 设置Flask应用相关的环境变量并启动Flask应用
# FLASK_APP=app.py FLASK_ENV=development FLASK_DEBUG=1 flask run --port 5001

import time  # 导入time模块用于时间操作

from flask import Flask, request, jsonify  # 导入Flask用于创建Web应用
from flask_restx import Api, Resource, fields  # 导入Flask-RESTx扩展用于创建REST API

app = Flask(__name__)  # 初始化Flask应用
api = Api(  # 初始化REST API
    app=app,
    version="0.0.1",  # API版本
    title="gomoku_server_ui App",  # API标题
    description="Play Gomoku with LightZero Agent, Powered by OpenDILab"  # API描述
)


@app.after_request  # Flask装饰器，在每个请求之后运行
def after_request(response):
    # 设置CORS，允许所有源访问
    response.headers.add('Access-Control-Allow-Origin', '*')
    # 允许跨源请求包含的头部字段
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    # 允许的HTTP方法
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response  # 返回修改后的响应


# 定义REST API的命名空间
name_space = api.namespace('gomoku_server_ui', description='gomoku_server_ui APIs')
# 定义传入API的数据模型
model = api.model(
    'gomoku_server_ui params', {
        'command': fields.String(required=False, description="Command Field", help="可选参数为：reset, step"),
        'argument': fields.Integer(required=False, description="Argument Field", help="如果输入 cmd 是 reset，则 argument 表示 agent type, 如果输入 cmd 是 step，则 argument 表示 [action_x, action_y, agent_type]"),
    }
)

MAX_ENV_NUM = 50  # 最大环境数限制
ENV_TIMEOUT_SECOND = 6000  # 环境超时时间（秒）

import sys

sys.path.append("/Users/puyuan/code/LightZero/")  # 将LightZero路径添加到系统路径中
from easydict import EasyDict  # 导入EasyDict，用于创建类似字典的对象，但可以像访问属性一样访问其元素
from zoo.board_games.gomoku.envs.gomoku_env import GomokuEnv  # 导入Gomoku环境
from agent import Agent  # 导入Agent类

# 配置Gomoku环境的参数
cfg = EasyDict(
    prob_random_agent=0,
    board_size=15,
    battle_mode='self_play_mode',
    channel_last=False,
    scale=False,
    agent_vs_human=False,
    bot_action_type='v1',
    prob_random_action_in_bot=0.,
    check_action_to_connect4_in_agent_v0=False,
    render_mode='state_realtime_mode',
    replay_path=None,
    screen_scaling=9,
    alphazero_mcts_ctree=False,
)
env = GomokuEnv(cfg)  # 创建一个Gomoku环境实例
obs = env.reset()  # 重置环境并获取初始观察
agent = Agent()  # 创建一个Agent实例

envs = {}  # 初始化环境字典
envs['127.0.0.1:1'] = {'env': env, 'update_time': time.time()}
# 假设这是类外面的全局变量
# envs = {}

from threading import Thread, Lock

envs_lock = Lock()


# 监控游戏环境的函数，用于清理超时的游戏环境
def env_monitor():
    while True:  # 无限循环
        with envs_lock:  # 确保在修改envs字典时不会有其他线程干扰
            cur_time = time.time()  # 获取当前时间
            pop_keys = []  # 准备一个列表来记录超时的环境键
            for k, v in envs.items():  # 遍历所有游戏环境
                if cur_time - v['update_time'] >= ENV_TIMEOUT_SECOND:  # 如果当前时间与环境的最后更新时间差大于超时时间
                    pop_keys.append(k)  # 将该环境的键加入到pop_keys列表中
            for k in pop_keys:  # 遍历需要清理的环境键
                envs.pop(k)  # 从envs字典中移除该环境
            time.sleep(1)  # 休眠1秒，减少CPU占用


# 创建一个守护线程运行env_monitor函数
api.env_thread = Thread(target=env_monitor, daemon=True)
api.env_thread.start()  # 启动线程


# 定义API的路由，即当POST请求发送到"/"时，执行MainClass内的方法
@name_space.route("/", methods=['POST'])
class MainClass(Resource):  # 定义一个资源类

    @api.expect(model)  # 指定预期的输入模型
    def post(self):  # 定义处理POST请求的方法
        try:
            t_start = time.time()  # 记录开始处理请求的时间
            data = request.json  # 获取请求的JSON数据
            cmd, arg, uid = data['command'], data['argument'], data['uid']  # 从数据中提取命令、参数和用户ID
            print("请求来源的IP地址:", request.remote_addr)  # 打印请求来源的IP地址
            ip = request.remote_addr + uid  # 将IP地址和用户ID组合作为唯一标识
            print("命令、参数、用户ID: ", cmd, arg, uid)  # 打印命令、参数、用户ID
            print('envs:', envs)  # 打印当前所有的游戏环境

            # 如果组合的IP不在envs字典中，即用户的游戏环境不存在
            if ip not in envs:
                print('ip not in envs')
                if cmd == 'reset':  # 如果命令是重置
                    if len(envs) >= MAX_ENV_NUM:  # 如果当前环境数量已达到最大限制
                        # 返回一个错误响应，告知资源不足
                        response = jsonify(
                            {
                                "statusCode": 501,
                                "status": "No enough env resource, please wait a moment",
                            }
                        )
                        return response
                    else:
                        # 创建一个新的游戏环境并记录当前时间
                        env = GomokuEnv(cfg)
                        envs[ip] = {'env': env, 'update_time': time.time()}
                else:
                    # 返回一个错误响应，告知用户长时间无响应，需要重置游戏
                    response = jsonify(
                        {
                            "statusCode": 501,
                            "status": "No response for too long time, please reset the game",
                        }
                    )
                    return response
            else:
                # 如果环境已存在，更新环境的最后活跃时间
                env = envs[ip]['env']
                envs[ip]['update_time'] = time.time()

            # 根据不同的命令，处理游戏逻辑
            if cmd == 'reset':
                # cmd == 'reset' 表示前端玩家设置了 AI 先手，需要重置游戏环境, 并返回一个 Agent action
                observation = env.reset()  # 重置游戏环境
                agent_type = arg
                print('agent type: {}'.format(agent_type))
                if agent_type == -2:  # 'Random'
                    agent_action = env.random_action()  # 获取一个随机动作
                elif agent_type == -1:  # 'RuleBot':
                    agent_action = env.bot_action()  # 让规则玩家计算动作
                elif agent_type == 0:   # 'AlphaZero'
                    agent_action = agent.compute_action(observation)  # 让智能体计算动作
                # 更新游戏环境
                observation, reward, done, info = env.step(agent_action)
                # print('original agent action: {}'.format(agent_action))
                agent_action = {'i': int(agent_action // 15), 'j': int(agent_action % 15)}
                print('agent action: {}'.format(agent_action))
                # 返回一个响应，包含游戏板状态、智能体动作、游戏是否结束和其他信息
                response = jsonify(
                    {
                        "statusCode": 200,
                        "status": "Execution action",
                        "result": {
                            'board': env.board.tolist(),
                            'action': agent_action,
                            'done': done,
                            'info': info,
                        }
                    }
                )

            elif cmd == 'step':
                # 使用之前存储的键来检索环境
                data = request.json
                action = data.get('argument')[:-1]  # 前端发送的动作  action: [i, j] 从0开始的，表示下在第i+1行，第j+1列
                print(f'前端发送过来的动作: {action}')
                agent_type = data.get('argument')[-1]
                print('agent type: {}'.format(agent_type))
                action = action[0] * 15 + action[1]
                # 更新游戏环境
                observation, reward, done, info = env.step(action)
                env.render()
                # 如果游戏没有结束，获取 agent 的动作
                if not done:
                    if agent_type == -2:  # 'Random'
                        agent_action = env.random_action()  # 获取一个随机动作
                    elif agent_type == -1:  # 'RuleBot':
                        agent_action = env.bot_action()  # 让规则玩家计算动作
                    elif agent_type == 0:  # 'AlphaZero'
                        agent_action = agent.compute_action(observation)  # 让智能体计算动作
                    # 更新环境状态
                    _, _, done, _ = env.step(agent_action)
                    # 准备响应数据
                    print('original agent action: {}'.format(agent_action))
                    agent_action = {'i': int(agent_action // 15), 'j': int(agent_action % 15)}
                    print('agent action: {}'.format(agent_action))
                else:
                    # agent_action = None # agent 的动作置为 None 会在前端中报错
                    agent_action = {'i': -1, 'j': -1}  # 如果游戏结束，agent 的动作置为特殊的值，表示游戏结束
                    observation = env.reset()  # 重置游戏环境

                # print(type(agent_action), type(done), type(info))
                response = {
                    "statusCode": 200,
                    "status": "Execution action",
                    "result": {
                        'board': None,
                        'action': agent_action,  # agent action格式为 {'i': x, 'j': y }
                        'done': done,
                    }
                }
            else:
                response = jsonify({
                    "statusCode": 500,
                    "status": "Invalid command: {}".format(cmd),
                })
                return response
            print('backend process time: {}'.format(time.time() - t_start))
            print('current env number: {}'.format(len(envs)))
            return response
        except Exception as e:
            import traceback
            print(repr(e))
            print(traceback.format_exc())
            response = jsonify({
                "statusCode": 500,
                "status": "Could not execute action",
            })
            return response
