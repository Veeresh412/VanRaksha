import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size,
  type = 'button',
  disabled = false,
  className = '',
  onClick,
  as: Component = 'button',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size ? `btn--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
}
