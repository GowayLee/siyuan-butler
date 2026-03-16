export interface SiyuanApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface SiyuanChildBlock {
  id: string;
  type: string;
  subType?: string;
}

export interface SiyuanBlockKramdown {
  id: string;
  kramdown: string;
}

export interface SiyuanDocPath {
  notebook: string;
  path: string;
}

export interface SiyuanOperation {
  action: string;
  id: string;
  parentID?: string;
  previousID?: string;
  data?: string | null;
  retData?: unknown;
}

export interface SiyuanOperationBatch {
  doOperations?: SiyuanOperation[] | null;
  undoOperations?: unknown;
}
