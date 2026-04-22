export type SyncReason =
  | 'bootstrap'
  | 'login'
  | 'appForeground'
  | 'networkOnline'
  | 'postMutation'
  | 'pullToRefresh'
  | 'manual'
  | 'fullReconcile';

export type SyncOutcome = 'ok' | 'skipped' | 'partial' | 'aborted';

export type SyncResult = {
  reason: SyncReason;
  outcome: SyncOutcome;
  pushed: number;
  pulled: number;
  errors: number;
  startedAt: string;
  finishedAt: string;
  message?: string;
};
