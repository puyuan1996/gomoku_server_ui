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

## 致谢

在这个五子棋项目中，前端部分的设计和实现参考了[lihongxun945/gobang](https://github.com/lihongxun945/gobang)项目，感谢原作者提供的优秀代码作为参考。如果您对五子棋AI感兴趣，您可以访问原项目以了解更多详情。