import React, { useState } from 'react'

function optimizeCloudinaryUrl(url?: string, extraTransform?: string): string {
  const src = typeof url === 'string' ? url : '';
  try {
    if (!src || !src.includes('res.cloudinary.com') || !src.includes('/image/upload/')) return src;
    const marker = '/image/upload/';
    const idx = src.indexOf(marker);
    const before = src.slice(0, idx + marker.length);
    const after = src.slice(idx + marker.length);
    // If transformations already exist, keep them but prefix f_auto,q_auto
    // Cloudinary accepts multiple transformations separated by commas.
    const hasTransforms = after[0] !== 'v' && after.includes('/');
    if (hasTransforms) {
      // e.g. after = "c_fill,w_800/path/to/public_id.jpg"
      const extra = extraTransform ? `${extraTransform},` : '';
      return `${before}f_auto,q_auto,${extra}${after}`;
    }
    // No transforms present, inject defaults
    const extra = extraTransform ? `,${extraTransform}` : '';
    return `${before}f_auto,q_auto${extra}/${after}`;
  } catch {
    return src;
  }
}

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, loading, decoding, fetchPriority, ...rest } = props
  const safeAlt = typeof alt === 'string' ? alt : ''
  const extraTransform = typeof (rest as any)?.['data-cloudinary-transform'] === 'string'
    ? (rest as any)['data-cloudinary-transform']
    : undefined
  const finalSrc = optimizeCloudinaryUrl(src, extraTransform)
  const loadingAttr = loading ?? 'lazy'
  const decodingAttr = decoding ?? 'async'
  const fetchProps = fetchPriority ? { fetchpriority: fetchPriority as any } : {}

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="" {...rest} data-original-url={src} loading={loadingAttr} decoding={decodingAttr} {...fetchProps} />
      </div>
    </div>
  ) : (
    <img src={finalSrc} alt={safeAlt} className={className} style={style} {...rest} onError={handleError} loading={loadingAttr} decoding={decodingAttr} {...fetchProps} />
  )
}
