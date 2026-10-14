// Price alerts: a threshold above and/or below. An alert fires once when the price
// crosses it and re-arms when the price goes back to the other side.

export type AlertConfig = {
  alertAbove?: number | undefined;
  alertBelow?: number | undefined;
  firedAbove?: boolean | undefined;
  firedBelow?: boolean | undefined;
};

export type AlertCheck = {
  /** New fired flags to store. */
  firedAbove: boolean;
  firedBelow: boolean;
  /** Alerts that just fired and should notify. */
  newly: ('above' | 'below')[];
};

export function checkAlerts(price: number, config: AlertConfig): AlertCheck {
  const aboveHit = config.alertAbove !== undefined && price >= config.alertAbove;
  const belowHit = config.alertBelow !== undefined && price <= config.alertBelow;
  const newly: ('above' | 'below')[] = [];
  if (aboveHit && !config.firedAbove) newly.push('above');
  if (belowHit && !config.firedBelow) newly.push('below');
  return { firedAbove: aboveHit, firedBelow: belowHit, newly };
}

/** Parses a USD threshold typed as "90 000", "0,12" or "85000.5"; null if empty or invalid. */
export function parseUsd(input: string): number | null {
  const cleaned = input.replace(/[\s $]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value > 0 && Number.isFinite(value) ? value : null;
}
