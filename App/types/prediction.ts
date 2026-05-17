// types/prediction.ts

export type PredictionItem = {
  label: string;
  prob: number;
};

export type PredictResponse = {
  top1: PredictionItem;
  top3: PredictionItem[];
};