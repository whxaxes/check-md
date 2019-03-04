export interface T100 {
  root: string[];
}
export interface T101 {
  defaultIndex: string[];
  root: string[];
  pattern: string;
  cwd: string;
}
export interface T102 {
  vuepress: T100;
  default: T101;
}
export const presetConfig: T102;
export interface CheckOption {
  cwd: string;
  fix?: boolean;
  root?: string[];
  defaultIndex?: string[];
  preset?: string;
  pattern?: string;
}
export interface ReportResult {
  msg: string;
  list: string[];
  type: string | string | string | string;
  exit: boolean;
}
export interface T103 {
  warning: ReportResult;
  deadlink: ReportResult;
}
/**
 * check markdown
 * @param {CheckOption} options
 */
export function check(options: CheckOption): Promise<T103>;
/**
 * check and throw
 * @param {CheckOption} options
 */
export function checkAndThrow(options: CheckOption): Promise<void>;
