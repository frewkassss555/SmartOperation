export type SectionProps = {
  /** True on the phone layout (one screen at a time), false on the desktop. */
  compact: boolean;
  /** Full-screen section on the desktop: room for two columns. */
  wide?: boolean | undefined;
};
