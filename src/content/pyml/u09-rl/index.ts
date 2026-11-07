import type { Unit } from '../../types';
import { lesson as mlRlIntro } from './ml-rl-intro';
import { lesson as mlMdps } from './ml-mdps';
import { lesson as mlQLearning } from './ml-q-learning';
import { lesson as mlGymnasium } from './ml-gymnasium';
import { lesson as mlDqn } from './ml-dqn';
import { lesson as mlPolicyGradients } from './ml-policy-gradients';
import { lesson as mlPpo } from './ml-ppo';

export const unit: Unit = {
  id: "ml-u09-rl",
  title: "Reinforcement Learning",
  description: "Agents and rewards, MDPs, Q-learning, Gymnasium, deep Q-networks, policy gradients, and PPO with Stable-Baselines3.",
  icon: "🎮",
  level: "Advanced",
  lessons: [mlRlIntro, mlMdps, mlQLearning, mlGymnasium, mlDqn, mlPolicyGradients, mlPpo],
};
