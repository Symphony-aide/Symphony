# Applications

<aside>
💡

**Production Deployments Report (Open Source Only)**

</aside>

[Details](Details%2026e461aa2705808f8092d4c03fff6f76.md)

## Executive Summary

This report focuses specifically on **deployed RL model applications** that have open-source repositories available. These are actual AI agents/systems using reinforcement learning that have been deployed in real-world scenarios with publicly accessible code.

---

## 🏆 Top 7 Open-Source Deployed RL Model Applications

### 1. **OpenDILab DI-star StarCraft II Agent**

- **GitHub URL**: https://github.com/opendilab/DI-star

**Application Description**:
Large-scale distributed training platform for StarCraft II that achieved Grand-master level performance

**Key Features**:

- Trained Grand-master level Zerg agents
- Self-play and league training
- Real-time deployment against human players
- Fought against professional players (Harstem on YouTube)
- Complete training pipeline from supervised learning to RL

**Research Guide Mapping**:

- ✅ **Large-Scale Distributed Training**: Production distributed RL system
- ✅ **Multi-Agent Coordination**: Complex multi-unit control
- ✅ **Curriculum Learning**: Progressive difficulty training
- ✅ **Real-Game Action Categories**: Complex action spaces in RTS

---

### 2. **DeepMind AlphaStar (Research Implementation)**

- **GitHub URL**: https://github.com/deepmind/alphastar

**Application Description**:
AlphaStar research code and supervised learning components for StarCraft II AI that reached Grandmaster level

**Key Features**:

- Research implementation of AlphaStar components
- Supervised learning from human replays
- Multi-agent coordination architecture
- Population-based training methodology
- Data processing and environment setup

**Research Guide Mapping**:

- ✅ **Multi-Agent Systems**: Complex unit coordination and strategy
- ✅ **Hierarchical RL**: Macro and micro-strategy hierarchies
- ✅ **Population-Based Training**: League-style evolutionary training
- ✅ **Large-Scale Training**: Distributed training architecture

**Reproducibility Score**: 3/5

- Research publication and architecture available
- Supervised learning components provided
- Full RL training requires massive resources

---

### 3. **NVIDIA Isaac Lab Robot Training Applications**

- **GitHub URL**: https://github.com/isaac-sim/IsaacLab

**Application Description**:
NVIDIA Isaac Lab unified framework for robot learning that enables training through reinforcement, imitation, and transfer learning

**Key Features**:

- GPU-accelerated robot simulation
- Parallel training of thousands of robots
- Sim2real transfer for manipulation tasks
- Production robot training pipeline
- Real robot hardware integration

**Research Guide Mapping**:

- ✅ **Large-Scale Parallel Training**: GPU-accelerated simulation
- ✅ **Sim2Real Transfer**: Simulation to reality deployment
- ✅ **Robot Manipulation**: Real-world robotics applications
- ✅ **Multi-Modal State Handling**: Vision, proprioception, force feedback

---

### 4. **DeepMind Control Suite (MuJoCo RL Applications)**

- **GitHub URL**: https://github.com/deepmind/dm_control

**Application Description**:
Physics-based continuous control environments and trained RL agents for robot manipulation and locomotion tasks

**Key Features**:

- Physics-based robot simulation using MuJoCo
- Continuous control benchmark environments
- Pre-trained agent checkpoints
- Humanoid locomotion and manipulation tasks
- Research and industrial applications

**Research Guide Mapping**:

- ✅ **Continuous Control**: Smooth robot motion control
- ✅ **Physics Simulation**: Realistic robot dynamics
- ✅ **Benchmarking**: Standard evaluation environments
- ✅ **Multi-Modal State Handling**: Proprioceptive and visual observations

---

### 5. **Open Alpha Zero (AlphaGo/AlphaZero Implementation)**

- **GitHub URL**: https://github.com/suragnair/alpha-zero-general

**Application Description**:
Clean implementation of AlphaZero algorithm that can be applied to multiple board games including Go, Chess, and Othello

**Key Features**:

- Self-play training without human data
- Monte Carlo Tree Search integration
- Multiple game implementations (Connect4, Othello, Chess, Go)
- Modular design for new games
- Pre-trained models available

**Research Guide Mapping**:

- ✅ **Self-Play Training**: Advanced curriculum learning
- ✅ **Monte Carlo Planning**: Tree search integration
- ✅ **General Intelligence**: Transfer across multiple games
- ✅ **World Models**: Game state prediction and planning

---

### 6. **AI4Finance FinRL - Financial Trading Platform**

- **GitHub URL**: https://github.com/AI4Finance-Foundation/FinRL

**Application Description**:
FinRL is the first open-source framework for financial reinforcement learning, providing a comprehensive platform for developing, testing, and deploying Deep Reinforcement Learning (DRL) trading strategies

**Key Features**:

- Virtual environments configured with stock market datasets, trading agents trained with neural networks, and extensive backtesting analyzed via trading performance
- Incorporates important trading constraints such as transaction cost, market liquidity
- AI stock-selection and trading strategy deployment to online trading platforms
- Support for Dow-30, NASDAQ-100, and S&P 500 data
- Multi-asset portfolio optimization and risk management

**Research Guide Mapping**:

- ✅ **Real-Time Financial Decision Making**: Live trading deployment
- ✅ **Multi-Asset Portfolio Management**: Complex state and action spaces
- ✅ **Market Constraints Integration**: Transaction costs and liquidity
- ✅ **Production Deployment**: Online trading platform integration

---

### 7. **Huawei SMARTS - Autonomous Driving Multi-Agent RL**

- **GitHub URL**: https://github.com/huawei-noah/SMARTS

**Application Description**:
SMARTS (Scalable Multi-Agent Reinforcement Learning Training School) is a simulation platform for multi-agent reinforcement learning (RL) and research on autonomous driving. Its focus is on realistic and diverse interactions

**Key Features**:

- Part of the XingTian suite of RL platforms from Huawei Noah's Ark Lab
- Multi-agent autonomous driving simulation
- Realistic traffic scenarios and agent interactions
- Large-scale distributed training capabilities
- Integration with real-world driving datasets
- Vehicle-to-vehicle coordination and competition

**Research Guide Mapping**:

- ✅ **Multi-Agent Coordination**: Complex traffic interactions
- ✅ **Autonomous Vehicle Control**: Real-world driving applications
- ✅ **Large-Scale Simulation**: Scalable training environments
- ✅ **Safety-Critical Systems**: Autonomous driving safety research

---