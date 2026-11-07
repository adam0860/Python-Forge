import type { Unit } from '../../types';
import { lesson as mlGameAiOverview } from './ml-game-ai-overview';
import { lesson as mlCustomEnv } from './ml-custom-env';
import { lesson as mlRewardDesign } from './ml-reward-design';
import { lesson as mlRlgym } from './ml-rlgym';
import { lesson as mlRlgymTraining } from './ml-rlgym-training';
import { lesson as mlSelfPlay } from './ml-self-play';
import { lesson as mlImitation } from './ml-imitation';
import { lesson as mlEngineDeploy } from './ml-engine-deploy';

export const unit: Unit = {
  id: "ml-u10-game-ai",
  title: "AI for Games",
  description: "Classic game AI vs learned agents, wrapping your own game as an environment, reward design, RLGym for Rocket League, self-play, imitation learning, and running trained models inside Unity and Unreal.",
  icon: "🕹️",
  level: "Expert",
  lessons: [mlGameAiOverview, mlCustomEnv, mlRewardDesign, mlRlgym, mlRlgymTraining, mlSelfPlay, mlImitation, mlEngineDeploy],
};
