export interface Kpi {
  label: string;
  unit: string;
  target: number;
}

export interface DeptTemplate {
  id: string;
  label: string;
  lead: string;
  color: string;
  icon: string;
  kpis: Kpi[];
}

export interface DeptEntry {
  values: number[];
  tasks: string[];
  notes: string;
}

/** monthKey (e.g. "2026-06") → dept id → entry */
export type MonthData = Record<string, DeptEntry>;

/** monthKey → all department entries for that month */
export type BizOpsData = Record<string, MonthData>;

export interface StatusPillProps {
  value: number;
  target: number;
  unit: string;
  small?: boolean;
}

export interface MiniBarProps {
  value: number;
  target: number;
  unit: string;
  color: string;
}

export interface EntryFormProps {
  dept: DeptTemplate;
  monthKey: string;
  data: BizOpsData;
  onSave: (deptId: string, mKey: string, entry: DeptEntry) => Promise<void>;
  onClose: () => void;
}
