// components/ui/rating-stars.tsx
import React from 'react'
import { Star } from 'lucide-react'

interface RatingStarsProps {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showValue?: boolean
  className?: string
}

export function RatingStars({
  value,
  size = 'md',
  showValue = false,
  className = '',
}: RatingStarsProps) {
  const clampedValue = Math.max(0, Math.min(5, value))
  const total = 5

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const renderStar = (index: number) => {
    const starValue = index + 1
    const fillPercentage = Math.max(
      0,
      Math.min(100, (clampedValue - index) * 100)
    )

    if (fillPercentage === 0) {
      // Empty star
      return (
        <Star
          key={index}
          className={`${sizeClasses[size]} fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700`}
          aria-hidden="true"
        />
      )
    } else if (fillPercentage === 100) {
      // Full star
      return (
        <Star
          key={index}
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          aria-hidden="true"
        />
      )
    } else {
      // Partial star (menggunakan gradient)
      const starId = `star-${index}-${Math.random().toString(36).substr(2, 9)}`

      return (
        <div key={index} className="relative inline-block">
          <svg
            className={sizeClasses[size]}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={starId}>
                <stop offset={`${fillPercentage}%`} stopColor="#FBBF24" />
                <stop offset={`${fillPercentage}%`} stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#${starId})`}
              stroke="#FBBF24"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )
    }
  }

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => renderStar(i))}
      </div>
      {showValue && (
        <span
          className={`ml-1.5 font-semibold text-gray-900 dark:text-white ${textSizeClasses[size]}`}
        >
          {clampedValue.toFixed(1)}
        </span>
      )}
      <span className="sr-only">{clampedValue.toFixed(1)} dari 5 bintang</span>
    </div>
  )
}

// Alternative simpler version using opacity overlay
export function RatingStarsSimple({
  value,
  size = 'md',
  showValue = false,
  className = '',
}: RatingStarsProps) {
  const clampedValue = Math.max(0, Math.min(5, value))
  const full = Math.floor(clampedValue)
  const decimal = clampedValue - full
  const total = 5

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => {
          if (i < full) {
            // Full star
            return (
              <Star
                key={i}
                className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
                aria-hidden="true"
              />
            )
          } else if (i === full && decimal > 0) {
            // Partial star with clip-path
            return (
              <div key={i} className="relative inline-block">
                <Star
                  className={`${sizeClasses[size]} fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700`}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${decimal * 100}%` }}
                >
                  <Star
                    className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )
          } else {
            // Empty star
            return (
              <Star
                key={i}
                className={`${sizeClasses[size]} fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700`}
                aria-hidden="true"
              />
            )
          }
        })}
      </div>
      {showValue && (
        <span
          className={`ml-1.5 font-semibold text-gray-900 dark:text-white ${textSizeClasses[size]}`}
        >
          {clampedValue.toFixed(1)}
        </span>
      )}
      <span className="sr-only">{clampedValue.toFixed(1)} dari 5 bintang</span>
    </div>
  )
}

export default RatingStars