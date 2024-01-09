# 五子棋前后端集成示例

这是一个五子棋游戏的前后端集成方案，其中[前端界面](https://github.com/lihongxun945/gobang)基于React构建，提供了与用户的交互界面；后端服务使用Flask框架搭建，实现了五子棋的AI逻辑。

## 快速上手

本指南将帮助您快速部署和启动五子棋游戏的前端和后端服务。

### 前端安装与运行

首先，您需要从GitHub上克隆前端项目代码：

```bash
git clone https://github.com/puyuan1996/gomoku_server_ui.git
cd gomoku/frontend
npm install
npm run debug
```

上面的命令会安装所有前端依赖，并启动前端开发服务器。

### 后端安装与运行

在您的系统中安装好Python环境之后，按照以下步骤配置和运行后端服务：

```bash
cd gomoku/backend
pip3 install -e .
# 将miniconda环境路径添加到系统PATH变量中，确保能使用该环境下的Python及其库
export PATH="/Users/puyuan/miniconda3/envs/arm64-py38/bin:$PATH"
# 设置Flask应用的环境变量
FLASK_APP=app.py FLASK_ENV=development FLASK_DEBUG=1 flask run --port 5001
```

上面的命令将设置必要的环境变量，然后启动Flask服务器。

### 与AI对战

在前端渲染得到的界面上，您可以选择与不同的AI对战，如下所示：

- [难度] 选择 `LightZero Agent` 就是与后端的 Python Gomoku Env 里面的 Agent (基于规则的 Bot, 或者训练好的 AlphaZero Agent) 对战。

- [难度] 选择 `AB-2, AB-4` 表示直接与[前端AI](https://github.com/lihongxun945/gobang) 中的 Alpha-Beta 减枝算法对战，其中 AB-x 中的 x 表示不同的搜索深度，也即不同的水平。

## 致谢

在这个五子棋项目中，前端部分是在[lihongxun945/gobang](https://github.com/lihongxun945/gobang)项目上进行了微调，感谢原作者提供的优秀代码作为参考。如果您对五子棋前端AI感兴趣，您可以访问原项目以了解更多详情。