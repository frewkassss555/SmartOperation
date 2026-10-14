import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary: accent fill for the main action; secondary: outlined; ghost: text only. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** md is 44px tall, lg is 56px. */
  size?: 'md' | 'lg';
  block?: boolean;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], block && styles.block, className]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} {...rest} />;
}
