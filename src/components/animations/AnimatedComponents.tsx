/**
 * Animated Components Library - Fleet-CTA
 *
 * Pre-built components using the comprehensive animation system
 * Combines CSS animations with Framer Motion for production-ready interactions
 *
 * Export these components to use across the application
 */

import { motion, AnimatePresence, Variants } from 'framer-motion';
import React, { ReactNode, useState, useEffect } from 'react';
import type { MouseEvent } from 'react';

/* ============================================================================
 * PAGE TRANSITIONS
 * ============================================================================ */

interface PageTransitionProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
}

/**
 * PageTransition: Animates page entrance with fade and slide
 * @example
 * <PageTransition direction="right">
 *   <YourPageComponent />
 * </PageTransition>
 */
export function PageTransition({
  children,
  direction = 'up',
  duration = 0.3,
}: PageTransitionProps) {
  const directionVariants = {
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
    },
    left: {
      initial: { opacity: 0, x: -30 },
      animate: { opacity: 1, x: 0 },
    },
    right: {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 },
    },
  };

  const variant = directionVariants[direction];

  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        ease: [0.16, 1, 0.3, 1], // cubic-bezier for smooth easing
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
 * INTERACTIVE BUTTONS
 * ============================================================================ */

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  withRipple?: boolean;
  withShimmer?: boolean;
  children: ReactNode;
}

/**
 * AnimatedButton: Button with hover lift, ripple, and shimmer effects
 * @example
 * <AnimatedButton variant="primary" size="lg" withRipple>
 *   Click me
 * </AnimatedButton>
 */
export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  withRipple = false,
  withShimmer = false,
  children,
  className = '',
  ...props
}: AnimatedButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost: 'bg-transparent hover:bg-muted text-foreground',
  };

  const animationClasses = [
    withRipple && 'btn-ripple',
    withShimmer && 'animate-button-hover-shimmer',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        rounded-lg font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${animationClasses}
        ${className}
      `}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

/* ============================================================================
 * FORM INPUTS
 * ============================================================================ */

interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
}

/**
 * FloatingLabelInput: Input with animated floating label
 * @example
 * <FloatingLabelInput
 *   label="Email"
 *   type="email"
 *   error={emailError}
 * />
 */
export function FloatingLabelInput({
  label,
  error,
  success,
  className = '',
  ...props
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value && String(props.value).length > 0;

  return (
    <div className="relative">
      <motion.input
        type="text"
        {...(props as any)}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          setIsFocused(!!hasValue);
          props.onBlur?.(e);
        }}
        className={`
          w-full px-4 py-2 border rounded-lg bg-input text-foreground
          transition-all duration-200
          ${error ? 'border-destructive focus:ring-destructive/50' : ''}
          ${success ? 'border-success focus:ring-success/50' : ''}
          ${!error && !success ? 'border-border focus:ring-ring/50' : ''}
          ${className}
        `}
      />
      <motion.label
        animate={{
          y: isFocused || hasValue ? -24 : 0,
          scale: isFocused || hasValue ? 0.85 : 1,
          opacity: isFocused || hasValue ? 1 : 0.7,
        }}
        transition={{ duration: 0.2 }}
        className={`
          absolute left-4 top-2 text-sm font-medium pointer-events-none origin-left
          ${error ? 'text-destructive' : ''}
          ${success ? 'text-success' : ''}
          ${!error && !success ? 'text-muted-foreground' : ''}
        `}
      >
        {label}
      </motion.label>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/* ============================================================================
 * CARDS
 * ============================================================================ */

interface AnimatedCardProps {
  children: ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * AnimatedCard: Card with hover lift and shadow expansion
 * @example
 * <AnimatedCard hoverable>
 *   Card content
 * </AnimatedCard>
 */
export function AnimatedCard({
  children,
  hoverable = true,
  className = '',
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={
        hoverable
          ? {
              y: -8,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className={`
        p-6 border border-border rounded-xl bg-card
        transition-all duration-300
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
 * MODALS & DIALOGS
 * ============================================================================ */

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * AnimatedModal: Modal with scale fade entrance and backdrop blur
 * @example
 * <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Confirm">
 *   Modal content
 * </AnimatedModal>
 */
export function AnimatedModal({
  isOpen,
  onClose,
  title,
  children,
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 pointer-events-auto shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {title && (
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  {title}
                </h2>
              )}
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
 * LOADING & SHIMMER
 * ============================================================================ */

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
}

/**
 * SkeletonLoader: Animated skeleton loading placeholders
 * @example
 * <SkeletonLoader count={3} height="h-12" />
 */
export function SkeletonLoader({ count = 3, height = 'h-16' }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={`animate-skeleton-loading bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg ${height}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}

/**
 * LoadingSpinner: Animated rotating spinner
 * @example
 * <LoadingSpinner size="lg" color="primary" />
 */
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <motion.div
      className={`rounded-full ${sizeClasses[size]} ${colorClasses[color]} animate-loading-spinner`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ============================================================================
 * NOTIFICATIONS & TOASTS
 * ============================================================================ */

interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onRemove: (id: string) => void;
}

/**
 * Toast: Individual toast notification with slide animation
 * @example
 * <Toast
 *   id="1"
 *   message="Success!"
 *   type="success"
 *   onRemove={removeToast}
 * />
 */
export function Toast({ id, message, type = 'info', onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const typeClasses = {
    success: 'bg-success/20 text-success border-success/50',
    error: 'bg-destructive/20 text-destructive border-destructive/50',
    warning: 'bg-warning/20 text-warning border-warning/50',
    info: 'bg-primary/20 text-primary border-primary/50',
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`border rounded-lg p-4 ${typeClasses[type]}`}
    >
      {message}
    </motion.div>
  );
}

/* ============================================================================
 * STATUS INDICATORS
 * ============================================================================ */

type StatusType = 'online' | 'offline' | 'warning' | 'error' | 'idle';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

/**
 * StatusBadge: Animated status indicator with color-coded appearance
 * @example
 * <StatusBadge status="online" label="Active" />
 */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig: Record<
    StatusType,
    { color: string; bgColor: string; dotColor: string }
  > = {
    online: {
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      dotColor: 'bg-emerald-500',
    },
    offline: {
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/20',
      dotColor: 'bg-gray-400',
    },
    warning: {
      color: 'text-warning',
      bgColor: 'bg-warning/20',
      dotColor: 'bg-warning',
    },
    error: {
      color: 'text-destructive',
      bgColor: 'bg-destructive/20',
      dotColor: 'bg-destructive',
    },
    idle: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      dotColor: 'bg-yellow-500',
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.color}`}
      animate={
        status === 'online' || status === 'error'
          ? { scale: [1, 1.05, 1] }
          : {}
      }
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`}
        animate={status === 'online' || status === 'error' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {label && <span className="text-sm font-medium">{label}</span>}
    </motion.div>
  );
}

/* ============================================================================
 * STAGGERED LIST
 * ============================================================================ */

interface StaggeredListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  staggerDelay?: number;
}

/**
 * StaggeredList: List items animate in with staggered timing
 * @example
 * <StaggeredList
 *   items={vehicles}
 *   renderItem={(vehicle) => <VehicleCard vehicle={vehicle} />}
 * />
 */
export function StaggeredList<T>({
  items,
  renderItem,
  staggerDelay = 0.1,
}: StaggeredListProps<T>) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 } as any,
    },
  };

  return (
    <motion.ul
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.li key={index} variants={itemVariants}>
          {renderItem(item, index)}
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ============================================================================
 * FLOATING ACTION BUTTON
 * ============================================================================ */

interface FloatingActionButtonProps {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * FloatingActionButton: Animated FAB with bounce and hover effects
 * @example
 * <FloatingActionButton
 *   icon={<PlusIcon />}
 *   label="Add"
 *   onClick={handleAdd}
 * />
 */
export function FloatingActionButton({
  icon,
  label,
  onClick,
  variant = 'primary',
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/40',
    secondary:
      'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/40',
    danger:
      'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40',
  };

  return (
    <motion.button
      className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center ${variantClasses[variant]} transition-all duration-300`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        y: isHovered ? -4 : 0,
        scale: isHovered ? 1.1 : 1,
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {icon}
      </motion.div>
      {label && isHovered && (
        <motion.span
          className="absolute right-16 px-3 py-1 bg-foreground text-background rounded-lg text-sm font-medium whitespace-nowrap"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  );
}

/* ============================================================================
 * GRADIENT TEXT
 * ============================================================================ */

interface GradientTextProps {
  children: ReactNode;
  colors?: string[];
  animated?: boolean;
  className?: string;
}

/**
 * GradientText: Text with animated gradient effect
 * @example
 * <GradientText colors={['#F0A000', '#FF6B35']}>
 *   Gradient Text
 * </GradientText>
 */
export function GradientText({
  children,
  colors = ['#F0A000', '#FF6B35'],
  animated = true,
  className = '',
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
    backgroundSize: animated ? '200% 200%' : '100% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <motion.span
      style={gradientStyle as any}
      animate={animated ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
      transition={
        animated ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}
      }
      className={className}
    >
      {children}
    </motion.span>
  );
}

export default {
  PageTransition,
  AnimatedButton,
  FloatingLabelInput,
  AnimatedCard,
  AnimatedModal,
  SkeletonLoader,
  LoadingSpinner,
  Toast,
  StatusBadge,
  StaggeredList,
  FloatingActionButton,
  GradientText,
};
