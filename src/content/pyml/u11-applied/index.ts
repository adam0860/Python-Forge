import type { Unit } from '../../types';
import { lesson as mlLlmApis } from './ml-llm-apis';
import { lesson as mlEmbeddingsRag } from './ml-embeddings-rag';
import { lesson as mlComputerVisionApps } from './ml-computer-vision-apps';
import { lesson as mlServing } from './ml-serving';
import { lesson as mlCapstone } from './ml-capstone';

export const unit: Unit = {
  id: "ml-u11-applied",
  title: "Applied AI Projects",
  description: "LLM APIs, embeddings and retrieval, practical computer vision, serving models, and an end-to-end capstone.",
  icon: "🚀",
  level: "Expert",
  lessons: [mlLlmApis, mlEmbeddingsRag, mlComputerVisionApps, mlServing, mlCapstone],
};
